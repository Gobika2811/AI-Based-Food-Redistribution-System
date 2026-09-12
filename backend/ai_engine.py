from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func
import models
import schemas

# Category perishability decay multipliers (higher = more perishable)
PERISHABILITY_WEIGHTS = {
    "dairy": 1.4,
    "meat": 1.5,
    "seafood": 1.6,
    "produce": 1.3,
    "bakery": 1.4,
    "prepared": 1.5,
    "canned": 0.3,
    "beverages": 0.6,
    "grains": 0.4,
    "snacks": 0.5,
}

def calculate_batch_waste_risk(batch: models.InventoryBatch, item: models.InventoryItem, db: Session) -> schemas.WasteRiskItem:
    """
    AI-driven waste risk score (0-100) based on:
    - Days to expiration
    - Category perishability weight
    - Historical sales/consumption velocity
    - Batch stock volume
    """
    today = date.today()
    days_to_expiry = (batch.expiry_date - today).days
    category_name = (item.category.name if item.category else "produce").lower()
    
    # Perishability factor (0.3 to 1.6)
    weight = 1.0
    for key, val in PERISHABILITY_WEIGHTS.items():
        if key in category_name or key in item.name.lower():
            weight = val
            break

    # Calculate 14-day depletion velocity for this item
    fourteen_days_ago = datetime.utcnow() - timedelta(days=14)
    recent_depletion = db.query(func.sum(models.InventoryHistory.quantity_changed)).filter(
        models.InventoryHistory.inventory_item_id == item.id,
        models.InventoryHistory.change_type.in_([models.HistoryAction.removed, models.HistoryAction.donated]),
        models.InventoryHistory.created_at >= fourteen_days_ago
    ).scalar() or Decimal('0.0')

    daily_depletion_velocity = float(recent_depletion) / 14.0
    batch_qty = float(batch.quantity)

    # Days needed to sell out at current rate
    if daily_depletion_velocity > 0:
        days_to_deplete = batch_qty / daily_depletion_velocity
    else:
        days_to_deplete = 30.0 # High risk of holding stagnant inventory

    # Core AI Scoring Logic
    # 1. Base urgency from shelf life
    if days_to_expiry < 0:
        base_score = 100.0
    elif days_to_expiry == 0:
        base_score = 95.0
    elif days_to_expiry <= 2:
        base_score = 85.0
    elif days_to_expiry <= 5:
        base_score = 65.0
    elif days_to_expiry <= 10:
        base_score = 40.0
    else:
        base_score = max(5.0, 30.0 - (days_to_expiry * 1.5))

    # 2. Velocity gap penalty: if days needed to sell > days to expiry, waste is imminent!
    velocity_gap = max(0.0, days_to_deplete - max(0.1, float(days_to_expiry)))
    velocity_penalty = min(30.0, velocity_gap * 4.0)

    # 3. Composite score normalized 0 - 100
    composite_score = min(100.0, max(0.0, (base_score * 0.75 + velocity_penalty) * (weight / 1.1)))
    risk_score = round(composite_score, 1)

    # Assign risk tier and actionable guidance
    if risk_score >= 80:
        risk_level = "Critical"
        urgency_recommendation = "Imminent Waste (< 48 hrs)"
        recommended_action = "Donate Immediately to local NGO"
    elif risk_score >= 60:
        risk_level = "High"
        urgency_recommendation = "High Waste Probability"
        recommended_action = "List on Surplus Feed or apply 40% discount"
    elif risk_score >= 35:
        risk_level = "Medium"
        urgency_recommendation = "Moderate Decay Rate"
        recommended_action = "Promote or bundle with other items"
    else:
        risk_level = "Low"
        urgency_recommendation = "Stable Inventory"
        recommended_action = "Monitor standard stock rotation"

    return schemas.WasteRiskItem(
        item_id=item.id,
        batch_id=batch.id,
        name=item.name,
        category=item.category.name if item.category else "Uncategorized",
        batch_number=batch.batch_number,
        quantity=batch_qty,
        unit=item.unit,
        expiry_date=batch.expiry_date.isoformat(),
        days_to_expiry=days_to_expiry,
        risk_score=risk_score,
        risk_level=risk_level,
        urgency_recommendation=urgency_recommendation,
        recommended_action=recommended_action
    )

def generate_reorder_recommendations(business_id: int, db: Session) -> List[schemas.ReorderRecommendation]:
    """
    AI Demand & Reorder Recommendation:
    Calculates moving average consumption velocity, compares with current on-hand stock,
    and identifies items that need reordering vs items at risk of overstocking.
    """
    items = db.query(models.InventoryItem).filter(models.InventoryItem.business_id == business_id).all()
    recommendations: List[schemas.ReorderRecommendation] = []
    
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    for item in items:
        # Sum active stock across all batches
        active_batches = [b for b in item.batches if b.status in (models.BatchStatus.active, models.BatchStatus.near_expiry)]
        current_stock = sum(float(b.quantity) for b in active_batches)

        # 30-day usage velocity
        depleted_qty = db.query(func.sum(models.InventoryHistory.quantity_changed)).filter(
            models.InventoryHistory.inventory_item_id == item.id,
            models.InventoryHistory.change_type.in_([models.HistoryAction.removed, models.HistoryAction.donated]),
            models.InventoryHistory.created_at >= thirty_days_ago
        ).scalar() or Decimal('0.0')

        daily_avg = max(0.5, float(depleted_qty) / 30.0)
        days_left = current_stock / daily_avg

        # Lead time assumed to be 3 days for standard fresh produce/groceries
        lead_time = 3.0
        safety_stock_days = 4.0
        reorder_point_days = lead_time + safety_stock_days

        if days_left <= reorder_point_days:
            # Need reorder
            target_buffer_days = 14.0 # Target 2 weeks stock to avoid overstock waste
            recommended_order = round((target_buffer_days * daily_avg) - current_stock, 1)
            recommended_order = max(5.0, recommended_order)

            if days_left <= lead_time:
                urgency = "Urgent"
                reasoning = f"Stock level critically low ({days_left:.1f} days left). Reorder {recommended_order} {item.unit} to prevent stockout."
            else:
                urgency = "Soon"
                reasoning = f"Stock approaching threshold ({days_left:.1f} days left). Recommended replenishment: {recommended_order} {item.unit}."

            recommendations.append(schemas.ReorderRecommendation(
                item_id=item.id,
                name=item.name,
                category=item.category.name if item.category else "General",
                current_stock=round(current_stock, 1),
                unit=item.unit,
                daily_consumption_avg=round(daily_avg, 2),
                days_of_stock_left=round(days_left, 1),
                recommended_order_quantity=recommended_order,
                reorder_urgency=urgency,
                reasoning=reasoning
            ))
        elif days_left > 25.0:
            # Overstocking warning
            recommendations.append(schemas.ReorderRecommendation(
                item_id=item.id,
                name=item.name,
                category=item.category.name if item.category else "General",
                current_stock=round(current_stock, 1),
                unit=item.unit,
                daily_consumption_avg=round(daily_avg, 2),
                days_of_stock_left=round(days_left, 1),
                recommended_order_quantity=0.0,
                reorder_urgency="Normal",
                reasoning=f"Overstocked ({days_left:.1f} days on hand). Freeze reorders to prevent surplus waste."
            ))

    return recommendations

def calculate_impact(quantity_kg: float) -> Dict[str, Any]:
    """
    Computes environmental and social impact metrics:
    - 1 meal ≈ 0.42 kg of food (standard USDA/FAO benchmark)
    - 1 kg food waste diverted ≈ 2.5 kg CO2e greenhouse gas emissions prevented
    - Average economic value saved ≈ $3.50 per kg
    """
    meals = int(quantity_kg / 0.42)
    co2 = round(quantity_kg * 2.5, 2)
    cost_saved = round(quantity_kg * 3.5, 2)

    return {
        "food_rescued_kg": round(quantity_kg, 2),
        "meals_served": meals,
        "co2_diverted_kg": co2,
        "cost_saved_estimated": cost_saved
    }
