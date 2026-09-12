import enum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, DateTime, Boolean, Numeric, Enum as SqlEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class UserRole(str, enum.Enum):
    business = "business"
    ngo = "ngo"
    admin = "admin"

class BusinessType(str, enum.Enum):
    restaurant = "restaurant"
    hotel = "hotel"
    supermarket = "supermarket"
    grocery = "grocery"
    bakery = "bakery"
    manufacturer = "manufacturer"

class BatchStatus(str, enum.Enum):
    active = "active"
    expired = "expired"
    near_expiry = "near_expiry"
    donated = "donated"

class HistoryAction(str, enum.Enum):
    added = "added"
    removed = "removed"
    modified = "modified"
    expired = "expired"
    donated = "donated"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(SqlEnum(UserRole), nullable=False, default=UserRole.business)
    business_type = Column(SqlEnum(BusinessType), nullable=True)
    address = Column(Text, nullable=False)
    phone = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    inventory_items = relationship("InventoryItem", back_populates="business", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    donations_offered = relationship("DonationListing", back_populates="donor", foreign_keys="[DonationListing.donor_id]", cascade="all, delete-orphan")
    claims_made = relationship("DonationClaim", back_populates="ngo", foreign_keys="[DonationClaim.ngo_id]", cascade="all, delete-orphan")
    donor_impacts = relationship("ImpactMetric", back_populates="donor", foreign_keys="[ImpactMetric.donor_id]", cascade="all, delete-orphan")
    ngo_impacts = relationship("ImpactMetric", back_populates="ngo", foreign_keys="[ImpactMetric.ngo_id]")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    inventory_items = relationship("InventoryItem", back_populates="category")
    donations = relationship("DonationListing", back_populates="category")

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    contact_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=False)
    sku = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    barcode = Column(String(100), nullable=True)
    qr_code = Column(String(100), nullable=True)
    image_url = Column(Text, nullable=True)
    unit = Column(String(50), nullable=False, default="pcs")
    storage_recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    business = relationship("User", back_populates="inventory_items")
    category = relationship("Category", back_populates="inventory_items")
    batches = relationship("InventoryBatch", back_populates="inventory_item", cascade="all, delete-orphan")
    history = relationship("InventoryHistory", back_populates="inventory_item", cascade="all, delete-orphan")

class InventoryBatch(Base):
    __tablename__ = "inventory_batches"

    id = Column(Integer, primary_key=True, index=True)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    batch_number = Column(String(100), nullable=False)
    quantity = Column(Numeric(12, 2), nullable=False, default=0.00)
    expiry_date = Column(Date, nullable=False, index=True)
    status = Column(SqlEnum(BatchStatus), nullable=False, default=BatchStatus.active, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    inventory_item = relationship("InventoryItem", back_populates="batches")
    history = relationship("InventoryHistory", back_populates="batch")
    donation = relationship("DonationListing", back_populates="batch", uselist=False)

class InventoryHistory(Base):
    __tablename__ = "inventory_history"

    id = Column(Integer, primary_key=True, index=True)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=False)
    batch_id = Column(Integer, ForeignKey("inventory_batches.id", ondelete="SET NULL"), nullable=True)
    change_type = Column(SqlEnum(HistoryAction), nullable=False)
    quantity_changed = Column(Numeric(12, 2), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    inventory_item = relationship("InventoryItem", back_populates="history")
    batch = relationship("InventoryBatch", back_populates="history")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    type = Column(String(50), nullable=False) # 'expiry_warning', 'low_stock', 'donation_claimed', 'pickup_ready'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="notifications")

# --- DONATION & REDISTRIBUTION MODELS ---
class DonationStatus(str, enum.Enum):
    available = "available"
    claimed = "claimed"
    in_transit = "in_transit"
    completed = "completed"
    cancelled = "cancelled"

class StorageCondition(str, enum.Enum):
    ambient = "ambient"
    chilled = "chilled"
    frozen = "frozen"

class UrgencyLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class DonationListing(Base):
    __tablename__ = "donation_listings"

    id = Column(Integer, primary_key=True, index=True)
    donor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    inventory_batch_id = Column(Integer, ForeignKey("inventory_batches.id", ondelete="SET NULL"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    quantity = Column(Numeric(12, 2), nullable=False)
    unit = Column(String(50), nullable=False, default="kg")
    dietary_tags = Column(String(255), nullable=True) # e.g. "Vegetarian, Halal"
    storage_condition = Column(SqlEnum(StorageCondition), nullable=False, default=StorageCondition.ambient)
    urgency = Column(SqlEnum(UrgencyLevel), nullable=False, default=UrgencyLevel.medium)
    pickup_address = Column(Text, nullable=False)
    pickup_window_start = Column(DateTime(timezone=True), nullable=False)
    pickup_window_end = Column(DateTime(timezone=True), nullable=False)
    expiry_date = Column(Date, nullable=False)
    contact_phone = Column(String(50), nullable=True)
    status = Column(SqlEnum(DonationStatus), nullable=False, default=DonationStatus.available, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    donor = relationship("User", back_populates="donations_offered", foreign_keys=[donor_id])
    batch = relationship("InventoryBatch", back_populates="donation")
    category = relationship("Category", back_populates="donations")
    claims = relationship("DonationClaim", back_populates="donation", cascade="all, delete-orphan")
    impact_records = relationship("ImpactMetric", back_populates="donation")

class DonationClaim(Base):
    __tablename__ = "donation_claims"

    id = Column(Integer, primary_key=True, index=True)
    donation_id = Column(Integer, ForeignKey("donation_listings.id", ondelete="CASCADE"), nullable=False)
    ngo_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    pickup_time = Column(DateTime(timezone=True), nullable=False)
    beneficiary_count = Column(Integer, nullable=False, default=10)
    driver_name = Column(String(255), nullable=True)
    driver_phone = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    verification_code = Column(String(10), nullable=False) # 6-digit OTP code
    status = Column(String(50), nullable=False, default="claimed") # claimed, in_transit, completed, cancelled
    claimed_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    donation = relationship("DonationListing", back_populates="claims")
    ngo = relationship("User", back_populates="claims_made", foreign_keys=[ngo_id])

class ImpactMetric(Base):
    __tablename__ = "impact_metrics"

    id = Column(Integer, primary_key=True, index=True)
    donation_id = Column(Integer, ForeignKey("donation_listings.id", ondelete="SET NULL"), nullable=True)
    donor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ngo_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    food_rescued_kg = Column(Numeric(12, 2), nullable=False, default=0.00)
    meals_served = Column(Integer, nullable=False, default=0)
    co2_diverted_kg = Column(Numeric(12, 2), nullable=False, default=0.00)
    cost_saved_estimated = Column(Numeric(12, 2), nullable=False, default=0.00)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    donor = relationship("User", back_populates="donor_impacts", foreign_keys=[donor_id])
    ngo = relationship("User", back_populates="ngo_impacts", foreign_keys=[ngo_id])
    donation = relationship("DonationListing", back_populates="impact_records")

