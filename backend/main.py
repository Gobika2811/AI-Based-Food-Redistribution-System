import os
import csv
import random
import string
from io import StringIO

from datetime import datetime, date, timedelta
from typing import List, Optional
from decimal import Decimal
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from dotenv import load_dotenv

import models
import schemas
import ai_engine
from database import engine, get_db
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_business,
    get_current_ngo
)

load_dotenv()


# Automatically initialize tables in database on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ResQFood Backend Service",
    description="Production-ready backend API managing authentication, categories, suppliers, inventory, CSV parsing, and alerts.",
    version="1.0.0"
)

# CORS config
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hardcoded taxonomy recommendations
FOOD_TAXONOMY = {
    "dairy": {
        "storage": "Keep refrigerated at 1°C to 4°C. Keep container tightly closed.",
        "shelf_life_extension": "Freeze butter or hard cheeses if not used immediately. Store milk on inner shelves, not the door."
    },
    "produce": {
        "storage": "Store leafy greens with damp paper towels in crisper drawer. Keep apples away from other produce.",
        "shelf_life_extension": "Store root vegetables (potatoes, onions) in cool, dark, well-ventilated dry spaces. Do not store together."
    },
    "bakery": {
        "storage": "Store at room temperature in sealed plastic or breadbox.",
        "shelf_life_extension": "Freeze bread immediately to prevent staling; slice before freezing for ease of use."
    },
    "meat": {
        "storage": "Keep in coldest section of refrigerator below 2°C, or store in freezer at -18°C.",
        "shelf_life_extension": "Keep wrapped securely in butcher paper or vacuum seal packages to prevent freezer burn."
    },
    "canned": {
        "storage": "Store in cool, dry, dark pantry shelves between 10°C and 21°C.",
        "shelf_life_extension": "Rotate cans using FIFO (First In, First Out) rules. Ensure cans are dent-free."
    }
}

def get_storage_recommendation(item_name: str, category_name: Optional[str]) -> str:
    category_key = (category_name or "").lower()
    item_key = item_name.lower()
    
    for key, tax in FOOD_TAXONOMY.items():
        if key in category_key or key in item_key:
            return f"{tax['storage']} Tip: {tax['shelf_life_extension']}"
    
    # Fallback default storage
    return "Store in a cool, dry place. Keep in airtight containers. Check expiry dates regularly."

# --- ROOT & HEALTH ---
@app.get("/")
def read_root():
    return {
        "service": "ResQFood API Server",
        "status": "active",
        "time": datetime.utcnow()
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}


# --- AUTHENTICATION ---
@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = get_password_hash(user_in.password)
    user = models.User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hashed_pwd,
        role=user_in.role,
        business_type=user_in.business_type,
        address=user_in.address,
        phone=user_in.phone
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@app.post("/api/auth/login", response_model=schemas.Token)
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email, "role": user.role.value})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# --- CATEGORIES ---
@app.post("/api/categories", response_model=schemas.CategoryResponse)
def create_category(cat_in: schemas.CategoryCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_cat = db.query(models.Category).filter(models.Category.name == cat_in.name).first()
    if db_cat:
        return db_cat
    category = models.Category(name=cat_in.name, description=cat_in.description)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@app.get("/api/categories", response_model=List[schemas.CategoryResponse])
def get_categories(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Category).all()

# --- SUPPLIERS ---
@app.post("/api/suppliers", response_model=schemas.SupplierResponse)
def create_supplier(sup_in: schemas.SupplierCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    supplier = models.Supplier(**sup_in.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

@app.get("/api/suppliers", response_model=List[schemas.SupplierResponse])
def get_suppliers(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Supplier).all()

# --- INVENTORY CRUD ---
@app.post("/api/inventory", response_model=schemas.InventoryItemResponse)
def create_inventory_item(
    item_in: schemas.InventoryItemCreate,
    db: Session = Depends(get_db),
    business: models.User = Depends(get_current_business)
):
    # Retrieve or auto-assign storage recommendations using taxonomy
    cat = db.query(models.Category).filter(models.Category.id == item_in.category_id).first() if item_in.category_id else None
    cat_name = cat.name if cat else ""
    storage_rec = item_in.storage_recommendation or get_storage_recommendation(item_in.name, cat_name)
    
    # Create inventory item catalog entry
    item = models.InventoryItem(
        business_id=business.id,
        category_id=item_in.category_id,
        name=item_in.name,
        sku=item_in.sku,
        description=item_in.description,
        barcode=item_in.barcode,
        qr_code=item_in.qr_code,
        image_url=item_in.image_url,
        unit=item_in.unit,
        storage_recommendation=storage_rec
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    
    # Process initial batches
    for batch_in in item_in.batches:
        # Determine status base
        status_flag = models.BatchStatus.active
        today = date.today()
        if batch_in.expiry_date < today:
            status_flag = models.BatchStatus.expired
        elif batch_in.expiry_date <= (today + timedelta(days=3)):
            status_flag = models.BatchStatus.near_expiry
            
        batch = models.InventoryBatch(
            inventory_item_id=item.id,
            batch_number=batch_in.batch_number,
            quantity=batch_in.quantity,
            expiry_date=batch_in.expiry_date,
            status=status_flag
        )
        db.add(batch)
        db.commit()
        db.refresh(batch)
        
        # Write history audit log
        history = models.InventoryHistory(
            inventory_item_id=item.id,
            batch_id=batch.id,
            change_type=models.HistoryAction.added,
            quantity_changed=batch.quantity,
            notes=f"Initial batch creation {batch.batch_number}"
        )
        db.add(history)
    
    db.commit()
    db.refresh(item)
    return item

@app.get("/api/inventory", response_model=List[schemas.InventoryItemResponse])
def list_inventory_items(
    db: Session = Depends(get_db),
    business: models.User = Depends(get_current_business)
):
    return db.query(models.InventoryItem).filter(models.InventoryItem.business_id == business.id).all()

@app.get("/api/inventory/scan", response_model=schemas.InventoryItemResponse)
def scan_item(
    code: str,
    db: Session = Depends(get_db),
    business: models.User = Depends(get_current_business)
):
    """
    Search product by Barcode or QR code matching local business inventory list.
    """
    item = db.query(models.InventoryItem).filter(
        models.InventoryItem.business_id == business.id,
        (models.InventoryItem.barcode == code) | (models.InventoryItem.qr_code == code)
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Product code not found in your inventory catalog.")
    return item

@app.delete("/api/inventory/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    business: models.User = Depends(get_current_business)
):
    item = db.query(models.InventoryItem).filter(
        models.InventoryItem.id == item_id,
        models.InventoryItem.business_id == business.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return

# --- BATCH MANAGEMENT ---
@app.post("/api/inventory/batches", response_model=schemas.InventoryBatchResponse)
def create_batch(
    batch_in: schemas.InventoryBatchResponse, # Using response model format for inputs
    db: Session = Depends(get_db),
    business: models.User = Depends(get_current_business)
):
    item = db.query(models.InventoryItem).filter(
        models.InventoryItem.id == batch_in.inventory_item_id,
        models.InventoryItem.business_id == business.id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item catalog mapping not found.")
        
    today = date.today()
    status_flag = models.BatchStatus.active
    if batch_in.expiry_date < today:
        status_flag = models.BatchStatus.expired
    elif batch_in.expiry_date <= (today + timedelta(days=3)):
        status_flag = models.BatchStatus.near_expiry
        
    batch = models.InventoryBatch(
        inventory_item_id=batch_in.inventory_item_id,
        batch_number=batch_in.batch_number,
        quantity=batch_in.quantity,
        expiry_date=batch_in.expiry_date,
        status=status_flag
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    
    # Audit log
    history = models.InventoryHistory(
        inventory_item_id=item.id,
        batch_id=batch.id,
        change_type=models.HistoryAction.added,
        quantity_changed=batch.quantity,
        notes=f"Created separate batch {batch.batch_number}"
    )
    db.add(history)
    db.commit()
    return batch

@app.patch("/api/inventory/batches/{batch_id}", response_model=schemas.InventoryBatchResponse)
def update_batch(
    batch_id: int,
    batch_up: schemas.InventoryBatchUpdate,
    db: Session = Depends(get_db),
    business: models.User = Depends(get_current_business)
):
    batch = db.query(models.InventoryBatch).join(models.InventoryItem).filter(
        models.InventoryBatch.id == batch_id,
        models.InventoryItem.business_id == business.id
    ).first()
    
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
        
    old_qty = batch.quantity
    
    if batch_up.quantity is not None:
        batch.quantity = batch_up.quantity
        diff = batch.quantity - old_qty
        if diff != 0:
            history = models.InventoryHistory(
                inventory_item_id=batch.inventory_item_id,
                batch_id=batch.id,
                change_type=models.HistoryAction.modified,
                quantity_changed=diff,
                notes=f"Batch quantity updated manually from {old_qty} to {batch.quantity}"
            )
            db.add(history)
            
    if batch_up.status is not None:
        old_status = batch.status
        batch.status = batch_up.status
        if old_status != batch_up.status and batch_up.status == models.BatchStatus.donated:
            history = models.InventoryHistory(
                inventory_item_id=batch.inventory_item_id,
                batch_id=batch.id,
                change_type=models.HistoryAction.donated,
                quantity_changed=-batch.quantity,
                notes=f"Batch flag toggled as Donated. Removing from active catalog."
            )
            db.add(history)
            batch.quantity = 0.00
            
    db.commit()
    db.refresh(batch)
    return batch

# --- CSV IMPORT ---
@app.post("/api/inventory/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    business: models.User = Depends(get_current_business)
):
    """
    Import and create inventory catalogs recursively using CSV inputs.
    Expects headers: product_name, category_name, SKU, barcode, unit, batch_number, quantity, expiry_date
    """
    contents = await file.read()
    buffer = StringIO(contents.decode('utf-8'))
    reader = csv.DictReader(buffer)
    
    imported_count = 0
    errors = []
    
    for idx, row in enumerate(reader):
        try:
            prod_name = row.get("product_name")
            cat_name = row.get("category_name", "General")
            sku = row.get("SKU")
            barcode = row.get("barcode")
            unit = row.get("unit", "pcs")
            batch_num = row.get("batch_number")
            qty = Decimal(row.get("quantity", "0"))
            expiry_str = row.get("expiry_date")
            
            if not prod_name or not batch_num or not expiry_str:
                errors.append(f"Row {idx+1}: Missing required fields.")
                continue
                
            expiry_date = datetime.strptime(expiry_str.strip(), "%Y-%m-%d").date()
            
            # Find or create Category
            category = db.query(models.Category).filter(models.Category.name == cat_name).first()
            if not category:
                category = models.Category(name=cat_name, description="Auto-created via CSV upload")
                db.add(category)
                db.commit()
                db.refresh(category)
            
            # Find or create Inventory Item per SKU/Name
            item = db.query(models.InventoryItem).filter(
                models.InventoryItem.business_id == business.id,
                (models.InventoryItem.sku == sku) if sku else (models.InventoryItem.name == prod_name)
            ).first()
            
            if not item:
                storage_rec = get_storage_recommendation(prod_name, cat_name)
                item = models.InventoryItem(
                    business_id=business.id,
                    category_id=category.id,
                    name=prod_name,
                    sku=sku,
                    barcode=barcode,
                    unit=unit,
                    storage_recommendation=storage_rec
                )
                db.add(item)
                db.commit()
                db.refresh(item)
            
            # Create Batch
            today = date.today()
            status_flag = models.BatchStatus.active
            if expiry_date < today:
                status_flag = models.BatchStatus.expired
            elif expiry_date <= (today + timedelta(days=3)):
                status_flag = models.BatchStatus.near_expiry
                
            batch = models.InventoryBatch(
                inventory_item_id=item.id,
                batch_number=batch_num,
                quantity=qty,
                expiry_date=expiry_date,
                status=status_flag
            )
            db.add(batch)
            db.commit()
            db.refresh(batch)
            
            # Log audit
            history = models.InventoryHistory(
                inventory_item_id=item.id,
                batch_id=batch.id,
                change_type=models.HistoryAction.added,
                quantity_changed=qty,
                notes="CSV Upload creation"
            )
            db.add(history)
            db.commit()
            
            imported_count += 1
            
        except Exception as ex:
            errors.append(f"Row {idx+1} Parse Error: {str(ex)}")
            db.rollback()
            
    return {
        "status": "completed",
        "imported": imported_count,
        "errors": errors
    }

# --- ALERTS & NOTIFICATIONS ---
@app.get("/api/alerts", response_model=List[schemas.NotificationResponse])
def get_alerts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).all()

@app.patch("/api/alerts/{alert_id}/read", response_model=schemas.NotificationResponse)
def read_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    alert = db.query(models.Notification).filter(
        models.Notification.id == alert_id,
        models.Notification.user_id == current_user.id
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return alert

# --- DASHBOARD & ANALYTICS ---
@app.get("/api/analytics/dashboard", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    business: models.User = Depends(get_current_business)
):
    total_items = db.query(models.InventoryItem).filter(models.InventoryItem.business_id == business.id).count()
    
    batches = db.query(models.InventoryBatch).join(models.InventoryItem).filter(
        models.InventoryItem.business_id == business.id
    ).all()
    
    total_batches = len(batches)
    total_active_qty = sum(b.quantity for b in batches if b.status != models.BatchStatus.donated)
    
    expired_batches_count = sum(1 for b in batches if b.status == models.BatchStatus.expired)
    near_expiry_batches_count = sum(1 for b in batches if b.status == models.BatchStatus.near_expiry)
    
    total_expired_qty = sum(b.quantity for b in batches if b.status == models.BatchStatus.expired)
    total_ever_added_qty = db.query(func.sum(models.InventoryHistory.quantity_changed)).join(models.InventoryItem).filter(
        models.InventoryItem.business_id == business.id,
        models.InventoryHistory.change_type == models.HistoryAction.added
    ).scalar() or Decimal('1.0')
    
    waste_percentage = float((total_expired_qty / total_ever_added_qty) * 100)

    # Impact stats for this business
    impacts = db.query(models.ImpactMetric).filter(models.ImpactMetric.donor_id == business.id).all()
    total_rescued = sum(float(i.food_rescued_kg) for i in impacts)
    total_meals = sum(i.meals_served for i in impacts)
    total_co2 = sum(float(i.co2_diverted_kg) for i in impacts)
    donations_count = db.query(models.DonationListing).filter(models.DonationListing.donor_id == business.id).count()
    
    return {
        "total_items": total_items,
        "total_batches": total_batches,
        "total_active_qty": total_active_qty,
        "expired_batches_count": expired_batches_count,
        "near_expiry_batches_count": near_expiry_batches_count,
        "waste_percentage": round(waste_percentage, 2),
        "total_donations_count": donations_count,
        "total_food_rescued_kg": round(total_rescued, 2),
        "total_meals_saved": total_meals,
        "total_co2_prevented_kg": round(total_co2, 2)
    }

@app.get("/api/analytics/ngo-dashboard")
def get_ngo_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    available_donations = db.query(models.DonationListing).filter(
        models.DonationListing.status == models.DonationStatus.available
    ).count()

    active_claims = db.query(models.DonationClaim).filter(
        models.DonationClaim.ngo_id == current_user.id,
        models.DonationClaim.status.in_(["claimed", "in_transit"])
    ).count()

    impacts = db.query(models.ImpactMetric).filter(models.ImpactMetric.ngo_id == current_user.id).all()
    total_rescued = sum(float(i.food_rescued_kg) for i in impacts)
    total_meals = sum(i.meals_served for i in impacts)
    total_co2 = sum(float(i.co2_diverted_kg) for i in impacts)

    return {
        "available_donations": available_donations,
        "active_claims": active_claims,
        "total_rescued_kg": round(total_rescued, 2),
        "total_meals_served": total_meals,
        "total_co2_diverted_kg": round(total_co2, 2),
        "completed_pickups": len(impacts)
    }

# --- DONATION LISTINGS (BUSINESS & RECIPIENT) ---
@app.post("/api/donations", response_model=schemas.DonationListingResponse)
def create_donation_listing(
    donation_in: schemas.DonationListingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Validate or associate batch
    batch = None
    if donation_in.inventory_batch_id:
        batch = db.query(models.InventoryBatch).join(models.InventoryItem).filter(
            models.InventoryBatch.id == donation_in.inventory_batch_id,
            models.InventoryItem.business_id == current_user.id
        ).first()
        if batch:
            batch.status = models.BatchStatus.near_expiry

    listing = models.DonationListing(
        donor_id=current_user.id,
        inventory_batch_id=donation_in.inventory_batch_id,
        category_id=donation_in.category_id,
        title=donation_in.title,
        description=donation_in.description,
        quantity=donation_in.quantity,
        unit=donation_in.unit,
        dietary_tags=donation_in.dietary_tags,
        storage_condition=donation_in.storage_condition,
        urgency=donation_in.urgency,
        pickup_address=donation_in.pickup_address,
        pickup_window_start=donation_in.pickup_window_start,
        pickup_window_end=donation_in.pickup_window_end,
        expiry_date=donation_in.expiry_date,
        contact_phone=donation_in.contact_phone or current_user.phone,
        status=models.DonationStatus.available
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)

    # Log inventory history if attached to a batch
    if batch:
        history = models.InventoryHistory(
            inventory_item_id=batch.inventory_item_id,
            batch_id=batch.id,
            change_type=models.HistoryAction.donated,
            quantity_changed=donation_in.quantity,
            notes=f"Listed on surplus redistribution network (Listing #{listing.id})"
        )
        db.add(history)
        db.commit()

    return listing

@app.get("/api/donations/live", response_model=List[schemas.DonationListingResponse])
def get_live_donations(
    category_id: Optional[int] = None,
    storage_condition: Optional[str] = None,
    urgency: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.DonationListing).filter(
        models.DonationListing.status == models.DonationStatus.available
    )
    if category_id:
        query = query.filter(models.DonationListing.category_id == category_id)
    if storage_condition:
        query = query.filter(models.DonationListing.storage_condition == storage_condition)
    if urgency:
        query = query.filter(models.DonationListing.urgency == urgency)
    if search:
        query = query.filter(models.DonationListing.title.ilike(f"%{search}%"))

    return query.order_by(models.DonationListing.created_at.desc()).all()

@app.get("/api/donations/my-listings", response_model=List[schemas.DonationListingResponse])
def get_my_listings(
    db: Session = Depends(get_db),
    business: models.User = Depends(get_current_business)
):
    return db.query(models.DonationListing).filter(
        models.DonationListing.donor_id == business.id
    ).order_by(models.DonationListing.created_at.desc()).all()

@app.get("/api/donations/my-claims", response_model=List[schemas.DonationClaimResponse])
def get_my_claims(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.DonationClaim).filter(
        models.DonationClaim.ngo_id == current_user.id
    ).order_by(models.DonationClaim.claimed_at.desc()).all()

@app.get("/api/donations/{donation_id}", response_model=schemas.DonationListingResponse)
def get_donation_by_id(
    donation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    listing = db.query(models.DonationListing).filter(models.DonationListing.id == donation_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Donation listing not found")
    return listing

@app.post("/api/donations/{donation_id}/claim", response_model=schemas.DonationClaimResponse)
def claim_donation(
    donation_id: int,
    claim_in: schemas.DonationClaimCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    listing = db.query(models.DonationListing).filter(models.DonationListing.id == donation_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Donation not found")
    if listing.status != models.DonationStatus.available:
        raise HTTPException(status_code=400, detail="Donation is no longer available")

    # Generate 6-digit alphanumeric pickup OTP verification code
    code = f"RQ-{''.join(random.choices(string.digits, k=4))}"

    claim = models.DonationClaim(
        donation_id=listing.id,
        ngo_id=current_user.id,
        pickup_time=claim_in.pickup_time,
        beneficiary_count=claim_in.beneficiary_count,
        driver_name=claim_in.driver_name,
        driver_phone=claim_in.driver_phone,
        notes=claim_in.notes,
        verification_code=code,
        status="claimed"
    )
    listing.status = models.DonationStatus.claimed
    db.add(claim)

    # Notify donor business
    notification = models.Notification(
        user_id=listing.donor_id,
        message=f"Your surplus listing '{listing.title}' ({listing.quantity} {listing.unit}) was claimed by {current_user.name}. Scheduled pickup: {claim_in.pickup_time.strftime('%b %d, %H:%M')}.",
        type="donation_claimed"
    )
    db.add(notification)

    db.commit()
    db.refresh(claim)
    return claim

@app.post("/api/donations/{donation_id}/verify-pickup")
def verify_donation_pickup(
    donation_id: int,
    verify_in: schemas.DonationClaimVerify,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    listing = db.query(models.DonationListing).filter(models.DonationListing.id == donation_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Donation listing not found")

    claim = db.query(models.DonationClaim).filter(
        models.DonationClaim.donation_id == donation_id,
        models.DonationClaim.status.in_(["claimed", "in_transit"])
    ).first()

    if not claim:
        raise HTTPException(status_code=400, detail="No active claim found for this donation")

    # Check OTP verification code
    if claim.verification_code.strip().upper() != verify_in.verification_code.strip().upper():
        raise HTTPException(status_code=400, detail="Invalid verification code")

    # Complete claim & listing
    claim.status = "completed"
    claim.completed_at = datetime.utcnow()
    listing.status = models.DonationStatus.completed

    # If linked to inventory batch, mark donated
    if listing.batch:
        listing.batch.status = models.BatchStatus.donated

    # Calculate and store impact metrics
    impact_data = ai_engine.calculate_impact(float(listing.quantity))
    impact = models.ImpactMetric(
        donation_id=listing.id,
        donor_id=listing.donor_id,
        ngo_id=claim.ngo_id,
        food_rescued_kg=Decimal(str(impact_data["food_rescued_kg"])),
        meals_served=impact_data["meals_served"],
        co2_diverted_kg=Decimal(str(impact_data["co2_diverted_kg"])),
        cost_saved_estimated=Decimal(str(impact_data["cost_saved_estimated"]))
    )
    db.add(impact)

    # Send confirmation notifications
    db.add(models.Notification(
        user_id=listing.donor_id,
        message=f"Handover verified! {listing.quantity} {listing.unit} of '{listing.title}' successfully rescued. {impact_data['meals_served']} meals provided.",
        type="pickup_ready"
    ))
    db.add(models.Notification(
        user_id=claim.ngo_id,
        message=f"Pickup verified! {impact_data['meals_served']} meals saved and ready for distribution.",
        type="pickup_ready"
    ))

    db.commit()
    return {
        "status": "success",
        "message": "Pickup successfully verified!",
        "impact": impact_data
    }

@app.patch("/api/donations/{donation_id}/status")
def update_donation_status(
    donation_id: int,
    status_update: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    listing = db.query(models.DonationListing).filter(models.DonationListing.id == donation_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Donation not found")

    new_status = status_update.get("status")
    if new_status:
        listing.status = new_status
        db.commit()
        db.refresh(listing)
    return listing

# --- AI PREDICTION ENDPOINTS ---
@app.get("/api/ai/waste-risk", response_model=List[schemas.WasteRiskItem])
def get_ai_waste_risk_analysis(
    db: Session = Depends(get_db),
    business: models.User = Depends(get_current_business)
):
    batches = db.query(models.InventoryBatch).join(models.InventoryItem).filter(
        models.InventoryItem.business_id == business.id,
        models.InventoryBatch.status != models.BatchStatus.donated
    ).all()

    risk_evaluations: List[schemas.WasteRiskItem] = []
    for b in batches:
        eval_item = ai_engine.calculate_batch_waste_risk(b, b.inventory_item, db)
        risk_evaluations.append(eval_item)

    # Sort descending by risk score
    risk_evaluations.sort(key=lambda x: x.risk_score, reverse=True)
    return risk_evaluations

@app.get("/api/ai/reorder-recommendations", response_model=List[schemas.ReorderRecommendation])
def get_reorder_recommendations(
    db: Session = Depends(get_db),
    business: models.User = Depends(get_current_business)
):
    return ai_engine.generate_reorder_recommendations(business.id, db)

# --- IMPACT ANALYTICS ---
@app.get("/api/analytics/impact", response_model=schemas.ImpactSummary)
def get_impact_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role == models.UserRole.business:
        records = db.query(models.ImpactMetric).filter(models.ImpactMetric.donor_id == current_user.id).all()
    elif current_user.role == models.UserRole.ngo:
        records = db.query(models.ImpactMetric).filter(models.ImpactMetric.ngo_id == current_user.id).all()
    else:
        records = db.query(models.ImpactMetric).all()

    total_food = sum(float(r.food_rescued_kg) for r in records)
    total_meals = sum(r.meals_served for r in records)
    total_co2 = sum(float(r.co2_diverted_kg) for r in records)
    total_cost = sum(float(r.cost_saved_estimated) for r in records)

    beneficiaries = sum(
        c.beneficiary_count for c in db.query(models.DonationClaim).filter(models.DonationClaim.status == "completed").all()
    ) if current_user.role != models.UserRole.business else int(total_meals * 0.9)

    recent = db.query(models.ImpactMetric).order_by(models.ImpactMetric.recorded_at.desc()).limit(10).all()

    return {
        "total_food_rescued_kg": round(total_food, 2),
        "total_meals_served": total_meals,
        "total_co2_diverted_kg": round(total_co2, 2),
        "total_cost_saved": round(total_cost, 2),
        "donations_completed": len(records),
        "beneficiaries_reached": beneficiaries,
        "recent_rescues": recent
    }

# --- SEED DEMO DATA ENDPOINT ---
@app.post("/api/seed")
def seed_demo_data(db: Session = Depends(get_db)):
    """Seed comprehensive realistic data for testing both Business & NGO workflows."""
    today = date.today()
    
    # 1. Users
    users_data = [
        {
            "name": "GreenGrocer Supermarket",
            "email": "supermarket@greenmart.com",
            "password": "password123",
            "role": models.UserRole.business,
            "business_type": models.BusinessType.supermarket,
            "address": "45 Market Street, Downtown",
            "phone": "+1-555-0199"
        },
        {
            "name": "Bistro Good Food",
            "email": "chef@bistrogood.com",
            "password": "password123",
            "role": models.UserRole.business,
            "business_type": models.BusinessType.restaurant,
            "address": "88 Gourmet Blvd, Arts District",
            "phone": "+1-555-0144"
        },
        {
            "name": "Hope Community Food Bank",
            "email": "contact@hopefoodbank.org",
            "password": "password123",
            "role": models.UserRole.ngo,
            "business_type": None,
            "address": "12 Compassion Way, Southside",
            "phone": "+1-555-0177"
        },
        {
            "name": "City Heart Community Kitchen",
            "email": "kitchen@cityshelter.org",
            "password": "password123",
            "role": models.UserRole.ngo,
            "business_type": None,
            "address": "210 Unity Road, East End",
            "phone": "+1-555-0122"
        }
    ]

    created_users = {}
    for u in users_data:
        existing = db.query(models.User).filter(models.User.email == u["email"]).first()
        if not existing:
            existing = models.User(
                name=u["name"],
                email=u["email"],
                password_hash=get_password_hash(u["password"]),
                role=u["role"],
                business_type=u["business_type"],
                address=u["address"],
                phone=u["phone"]
            )
            db.add(existing)
            db.commit()
            db.refresh(existing)
        created_users[u["email"]] = existing

    # 2. Categories
    cat_names = [
        ("Fresh Produce", "Fruits, vegetables, leafy greens"),
        ("Bakery & Breads", "Artisan loaves, buns, pastries"),
        ("Dairy & Eggs", "Milk, yogurt, cheeses, organic eggs"),
        ("Prepared Meals", "Chef-prepared portions, boxed salads"),
        ("Pantry & Grains", "Rice, pasta, legumes, canned vegetables")
    ]
    created_cats = {}
    for name, desc in cat_names:
        c = db.query(models.Category).filter(models.Category.name == name).first()
        if not c:
            c = models.Category(name=name, description=desc)
            db.add(c)
            db.commit()
            db.refresh(c)
        created_cats[name] = c

    # 3. Inventory Items & Batches for GreenGrocer Supermarket
    biz = created_users["supermarket@greenmart.com"]
    items_to_create = [
        {
            "name": "Organic Whole Milk 1L",
            "category": "Dairy & Eggs",
            "sku": "MLK-001",
            "unit": "cartons",
            "batches": [
                {"number": "B-MLK-01", "qty": Decimal('24'), "expiry": today + timedelta(days=2)}, # High Risk!
                {"number": "B-MLK-02", "qty": Decimal('50'), "expiry": today + timedelta(days=12)}
            ]
        },
        {
            "name": "Artisan Sourdough Loaves",
            "category": "Bakery & Breads",
            "sku": "BAK-104",
            "unit": "loaves",
            "batches": [
                {"number": "B-BAK-01", "qty": Decimal('18'), "expiry": today + timedelta(days=1)} # Critical Risk!
            ]
        },
        {
            "name": "Crisp Romaine Lettuce",
            "category": "Fresh Produce",
            "sku": "VEG-201",
            "unit": "heads",
            "batches": [
                {"number": "B-VEG-01", "qty": Decimal('35'), "expiry": today + timedelta(days=3)} # High Risk!
            ]
        },
        {
            "name": "Gourmet Quinoa Salad Bowls",
            "category": "Prepared Meals",
            "sku": "PREP-502",
            "unit": "portions",
            "batches": [
                {"number": "B-PREP-01", "qty": Decimal('20'), "expiry": today + timedelta(days=2)} # High Risk!
            ]
        },
        {
            "name": "Basmati Rice 5kg",
            "category": "Pantry & Grains",
            "sku": "PNT-900",
            "unit": "bags",
            "batches": [
                {"number": "B-PNT-01", "qty": Decimal('40'), "expiry": today + timedelta(days=180)} # Low Risk
            ]
        }
    ]

    for item_data in items_to_create:
        item = db.query(models.InventoryItem).filter(
            models.InventoryItem.business_id == biz.id,
            models.InventoryItem.sku == item_data["sku"]
        ).first()
        if not item:
            item = models.InventoryItem(
                business_id=biz.id,
                category_id=created_cats[item_data["category"]].id,
                name=item_data["name"],
                sku=item_data["sku"],
                unit=item_data["unit"],
                storage_recommendation=get_storage_recommendation(item_data["name"], item_data["category"])
            )
            db.add(item)
            db.commit()
            db.refresh(item)

            for b_info in item_data["batches"]:
                b = models.InventoryBatch(
                    inventory_item_id=item.id,
                    batch_number=b_info["number"],
                    quantity=b_info["qty"],
                    expiry_date=b_info["expiry"],
                    status=models.BatchStatus.near_expiry if (b_info["expiry"] - today).days <= 3 else models.BatchStatus.active
                )
                db.add(b)
                db.commit()

                # History log
                db.add(models.InventoryHistory(
                    inventory_item_id=item.id,
                    batch_id=b.id,
                    change_type=models.HistoryAction.added,
                    quantity_changed=b_info["qty"],
                    notes="Initial Stocking"
                ))
            db.commit()

    # 4. Live Donation Listings
    ngo = created_users["contact@hopefoodbank.org"]
    existing_donations = db.query(models.DonationListing).count()
    if existing_donations == 0:
        d1 = models.DonationListing(
            donor_id=biz.id,
            category_id=created_cats["Bakery & Breads"].id,
            title="Fresh Bakery Assortment (Sourdough & Bagels)",
            description="High-quality fresh bakery items baked yesterday. Ideal for breakfast shelters and soup kitchens.",
            quantity=Decimal('25.0'),
            unit="kg",
            dietary_tags="Vegetarian, Halal",
            storage_condition=models.StorageCondition.ambient,
            urgency=models.UrgencyLevel.high,
            pickup_address="45 Market Street, Loading Bay B",
            pickup_window_start=datetime.utcnow() + timedelta(hours=2),
            pickup_window_end=datetime.utcnow() + timedelta(hours=10),
            expiry_date=today + timedelta(days=2),
            contact_phone="+1-555-0199",
            status=models.DonationStatus.available
        )
        d2 = models.DonationListing(
            donor_id=biz.id,
            category_id=created_cats["Fresh Produce"].id,
            title="Assorted Organic Crisp Greens & Tomatoes",
            description="Crated lettuce, heirloom tomatoes, and cucumbers in prime condition.",
            quantity=Decimal('40.0'),
            unit="kg",
            dietary_tags="Vegan, Vegetarian, Gluten-Free",
            storage_condition=models.StorageCondition.chilled,
            urgency=models.UrgencyLevel.medium,
            pickup_address="45 Market Street, Downtown",
            pickup_window_start=datetime.utcnow() + timedelta(hours=4),
            pickup_window_end=datetime.utcnow() + timedelta(hours=24),
            expiry_date=today + timedelta(days=3),
            contact_phone="+1-555-0199",
            status=models.DonationStatus.available
        )
        # Completed historical donation with Impact record
        d3 = models.DonationListing(
            donor_id=biz.id,
            category_id=created_cats["Dairy & Eggs"].id,
            title="Organic Greek Yogurt & Milk Crates",
            description="Sealed cartons rescued prior to inventory turnaround.",
            quantity=Decimal('35.0'),
            unit="kg",
            dietary_tags="Vegetarian",
            storage_condition=models.StorageCondition.chilled,
            urgency=models.UrgencyLevel.critical,
            pickup_address="45 Market Street, Downtown",
            pickup_window_start=datetime.utcnow() - timedelta(days=2),
            pickup_window_end=datetime.utcnow() - timedelta(days=2, hours=-6),
            expiry_date=today + timedelta(days=1),
            contact_phone="+1-555-0199",
            status=models.DonationStatus.completed
        )
        db.add_all([d1, d2, d3])
        db.commit()

        # Add claim & completed impact for d3
        claim3 = models.DonationClaim(
            donation_id=d3.id,
            ngo_id=ngo.id,
            pickup_time=datetime.utcnow() - timedelta(days=2),
            beneficiary_count=85,
            driver_name="Dave Miller",
            driver_phone="+1-555-0188",
            notes="Collected in refrigerated van",
            verification_code="RQ-7721",
            status="completed",
            completed_at=datetime.utcnow() - timedelta(days=2)
        )
        db.add(claim3)

        impact3 = models.ImpactMetric(
            donation_id=d3.id,
            donor_id=biz.id,
            ngo_id=ngo.id,
            food_rescued_kg=Decimal('35.00'),
            meals_served=83,
            co2_diverted_kg=Decimal('87.50'),
            cost_saved_estimated=Decimal('122.50'),
            recorded_at=datetime.utcnow() - timedelta(days=2)
        )
        db.add(impact3)
        db.commit()

    return {
        "status": "success",
        "message": "Demo data successfully initialized with Business and NGO personas, inventory, live listings, and verified impact metrics!",
        "demo_accounts": [
            {"email": "supermarket@greenmart.com", "role": "Business (Supermarket)", "password": "password123"},
            {"email": "chef@bistrogood.com", "role": "Business (Restaurant)", "password": "password123"},
            {"email": "contact@hopefoodbank.org", "role": "Recipient (Food Bank NGO)", "password": "password123"},
            {"email": "kitchen@cityshelter.org", "role": "Recipient (Community Kitchen)", "password": "password123"}
        ]
    }

