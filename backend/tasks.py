import os
from datetime import date, timedelta
from celery import Celery
from sqlalchemy.orm import Session
from database import SessionLocal
import models

# Initialize Celery app instance
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery("resqfood_tasks", broker=REDIS_URL, backend=REDIS_URL)

@celery_app.task
def check_expiry_dates():
    """
    Background worker daemon task running nightly scans.
    Flags items near expiry or expired, logging alerts to business profiles.
    """
    db: Session = SessionLocal()
    try:
        today = date.today()
        three_days_from_now = today + timedelta(days=3)
        
        # 1. Flag items that have expired
        expired_batches = db.query(models.InventoryBatch).filter(
            models.InventoryBatch.expiry_date < today,
            models.InventoryBatch.status != models.BatchStatus.expired,
            models.InventoryBatch.status != models.BatchStatus.donated
        ).all()
        
        for batch in expired_batches:
            batch.status = models.BatchStatus.expired
            
            # Create internal audit log history record
            history = models.InventoryHistory(
                inventory_item_id=batch.inventory_item_id,
                batch_id=batch.id,
                change_type=models.HistoryAction.expired,
                quantity_changed=-batch.quantity,
                notes=f"Batch {batch.batch_number} flagged as expired on {today}"
            )
            db.add(history)
            
            # Send notification alert to business user
            item = db.query(models.InventoryItem).filter(models.InventoryItem.id == batch.inventory_item_id).first()
            if item:
                notification = models.Notification(
                    user_id=item.business_id,
                    message=f"CRITICAL: Batch {batch.batch_number} of '{item.name}' has expired.",
                    type="expiry_warning"
                )
                db.add(notification)
        
        # 2. Flag items that are near expiry (within 3 days)
        near_expiry_batches = db.query(models.InventoryBatch).filter(
            models.InventoryBatch.expiry_date >= today,
            models.InventoryBatch.expiry_date <= three_days_from_now,
            models.InventoryBatch.status == models.BatchStatus.active
        ).all()
        
        for batch in near_expiry_batches:
            batch.status = models.BatchStatus.near_expiry
            
            # Send notification alert to business user
            item = db.query(models.InventoryItem).filter(models.InventoryItem.id == batch.inventory_item_id).first()
            if item:
                notification = models.Notification(
                    user_id=item.business_id,
                    message=f"WARNING: Batch {batch.batch_number} of '{item.name}' is near expiry (Expires: {batch.expiry_date}). Consider donating it.",
                    type="expiry_warning"
                )
                db.add(notification)

        db.commit()
        return {
            "expired_flagged": len(expired_batches),
            "near_expiry_flagged": len(near_expiry_batches)
        }
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()

# Configure Celery periodic schedule (runs daily)
celery_app.conf.beat_schedule = {
    'daily-expiry-check': {
        'task': 'tasks.check_expiry_dates',
        'schedule': 86400.0, # Every 24 hours
    },
}
celery_app.conf.timezone = 'UTC'
