from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from models import UserRole, BusinessType, BatchStatus, HistoryAction

# --- Authentication & Users ---
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    role: UserRole = UserRole.business
    business_type: Optional[BusinessType] = None
    address: str = Field(..., min_length=5)
    phone: str = Field(..., min_length=5, max_length=20)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    business_type: Optional[BusinessType]
    address: str
    phone: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

# --- Categories ---
class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None

class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

# --- Suppliers ---
class SupplierCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    contact_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class SupplierResponse(BaseModel):
    id: int
    name: str
    contact_name: Optional[str]
    email: Optional[EmailStr]
    phone: Optional[str]
    address: Optional[str]
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

# --- Inventory Batches ---
class InventoryBatchCreate(BaseModel):
    batch_number: str = Field(..., min_length=1)
    quantity: Decimal = Field(..., gt=0)
    expiry_date: date

class InventoryBatchUpdate(BaseModel):
    quantity: Optional[Decimal] = Field(None, ge=0)
    status: Optional[BatchStatus] = None

class InventoryBatchResponse(BaseModel):
    id: int
    inventory_item_id: int
    batch_number: str
    quantity: Decimal
    expiry_date: date
    status: BatchStatus
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

# --- Inventory Items ---
class InventoryItemCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    category_id: Optional[int] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    barcode: Optional[str] = None
    qr_code: Optional[str] = None
    image_url: Optional[str] = None
    unit: str = "pcs"
    storage_recommendation: Optional[str] = None
    batches: List[InventoryBatchCreate] = []

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    barcode: Optional[str] = None
    qr_code: Optional[str] = None
    image_url: Optional[str] = None
    unit: Optional[str] = None
    storage_recommendation: Optional[str] = None

class InventoryItemResponse(BaseModel):
    id: int
    business_id: int
    category_id: Optional[int]
    category: Optional[CategoryResponse] = None
    name: str
    sku: Optional[str]
    description: Optional[str]
    barcode: Optional[str]
    qr_code: Optional[str]
    image_url: Optional[str]
    unit: str
    storage_recommendation: Optional[str]
    batches: List[InventoryBatchResponse] = []
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

# --- History Logs ---
class InventoryHistoryResponse(BaseModel):
    id: int
    inventory_item_id: int
    batch_id: Optional[int]
    change_type: HistoryAction
    quantity_changed: Decimal
    notes: Optional[str]
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

# --- Notifications ---
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    message: str
    is_read: bool
    type: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

# --- Analytics Response ---
class DashboardStats(BaseModel):
    total_items: int
    total_batches: int
    total_active_qty: Decimal
    expired_batches_count: int
    near_expiry_batches_count: int
    waste_percentage: float
    total_donations_count: int = 0
    total_food_rescued_kg: float = 0.0
    total_meals_saved: int = 0
    total_co2_prevented_kg: float = 0.0

# --- Donation Listings ---
class DonationListingCreate(BaseModel):
    inventory_batch_id: Optional[int] = None
    category_id: Optional[int] = None
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    quantity: Decimal = Field(..., gt=0)
    unit: str = "kg"
    dietary_tags: Optional[str] = "Vegetarian" # Comma separated
    storage_condition: str = "ambient" # ambient, chilled, frozen
    urgency: str = "medium" # low, medium, high, critical
    pickup_address: str = Field(..., min_length=5)
    pickup_window_start: datetime
    pickup_window_end: datetime
    expiry_date: date
    contact_phone: Optional[str] = None

class DonationListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[Decimal] = None
    status: Optional[str] = None
    pickup_window_start: Optional[datetime] = None
    pickup_window_end: Optional[datetime] = None

class DonationListingResponse(BaseModel):
    id: int
    donor_id: int
    donor: Optional[UserResponse] = None
    inventory_batch_id: Optional[int] = None
    category_id: Optional[int] = None
    category: Optional[CategoryResponse] = None
    title: str
    description: Optional[str]
    quantity: Decimal
    unit: str
    dietary_tags: Optional[str]
    storage_condition: str
    urgency: str
    pickup_address: str
    pickup_window_start: datetime
    pickup_window_end: datetime
    expiry_date: date
    contact_phone: Optional[str]
    status: str
    created_at: datetime
    claims: List["DonationClaimResponse"] = []

    model_config = {
        "from_attributes": True
    }

# --- Donation Claims ---
class DonationClaimCreate(BaseModel):
    pickup_time: datetime
    beneficiary_count: int = Field(10, gt=0)
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    notes: Optional[str] = None

class DonationClaimVerify(BaseModel):
    verification_code: str = Field(..., min_length=4, max_length=10)

class DonationClaimResponse(BaseModel):
    id: int
    donation_id: int
    ngo_id: int
    ngo: Optional[UserResponse] = None
    pickup_time: datetime
    beneficiary_count: int
    driver_name: Optional[str]
    driver_phone: Optional[str]
    notes: Optional[str]
    verification_code: Optional[str] = None
    status: str
    claimed_at: datetime
    completed_at: Optional[datetime]

    model_config = {
        "from_attributes": True
    }

# --- Impact Metrics ---
class ImpactMetricResponse(BaseModel):
    id: int
    donation_id: Optional[int]
    donor_id: int
    ngo_id: Optional[int]
    food_rescued_kg: Decimal
    meals_served: int
    co2_diverted_kg: Decimal
    cost_saved_estimated: Decimal
    recorded_at: datetime

    model_config = {
        "from_attributes": True
    }

class ImpactSummary(BaseModel):
    total_food_rescued_kg: float
    total_meals_served: int
    total_co2_diverted_kg: float
    total_cost_saved: float
    donations_completed: int
    beneficiaries_reached: int
    recent_rescues: List[ImpactMetricResponse] = []

# --- AI Prediction & Recommendation Schemas ---
class WasteRiskItem(BaseModel):
    item_id: int
    batch_id: int
    name: str
    category: str
    batch_number: str
    quantity: float
    unit: str
    expiry_date: str
    days_to_expiry: int
    risk_score: float # 0 to 100
    risk_level: str # Low, Medium, High, Critical
    urgency_recommendation: str
    recommended_action: str # "Monitor", "Discount 20%", "Donate Immediately", "Discard safely"

class ReorderRecommendation(BaseModel):
    item_id: int
    name: str
    category: str
    current_stock: float
    unit: str
    daily_consumption_avg: float
    days_of_stock_left: float
    recommended_order_quantity: float
    reorder_urgency: str # "Normal", "Soon", "Urgent"
    reasoning: str

# Rebuild models with forward references
DonationListingResponse.model_rebuild()
