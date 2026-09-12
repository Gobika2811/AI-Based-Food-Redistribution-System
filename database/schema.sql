-- ==============================================================================
-- ResQFood Database Schema (PostgreSQL)
-- Module 1: Inventory Management & Expiry Tracking System
-- ==============================================================================

-- Create Enums
CREATE TYPE user_role_enum AS ENUM ('business', 'ngo', 'admin');
CREATE TYPE business_type_enum AS ENUM ('restaurant', 'hotel', 'supermarket', 'grocery', 'bakery', 'manufacturer');
CREATE TYPE batch_status_enum AS ENUM ('active', 'expired', 'near_expiry', 'donated');
CREATE TYPE history_action_enum AS ENUM ('added', 'removed', 'modified', 'expired', 'donated');

-- Users Table (Handles businesses, NGOs, and Admins)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'business',
    business_type business_type_enum,
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table (e.g. Dairy, Produce, Bakery, Meat, Canned Goods)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers Table (Suppliers providing goods to businesses)
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Items Table (Master item catalog per business)
CREATE TABLE inventory_items (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    description TEXT,
    barcode VARCHAR(100),
    qr_code VARCHAR(100),
    image_url TEXT,
    unit VARCHAR(50) NOT NULL DEFAULT 'pcs', -- e.g. kg, pcs, liters, boxes
    storage_recommendation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_business_sku UNIQUE (business_id, sku)
);

-- Inventory Batches Table (Tracks inventory at the batch & expiry level)
CREATE TABLE inventory_batches (
    id SERIAL PRIMARY KEY,
    inventory_item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    quantity DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    expiry_date DATE NOT NULL,
    status batch_status_enum NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory History (Audit trail of all item movements)
CREATE TABLE inventory_history (
    id SERIAL PRIMARY KEY,
    inventory_item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    batch_id INTEGER REFERENCES inventory_batches(id) ON DELETE SET NULL,
    change_type history_action_enum NOT NULL,
    quantity_changed DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications (System alerts, near-expiry alerts, low-stock warnings)
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    type VARCHAR(50) NOT NULL, -- 'expiry_warning', 'low_stock', 'system'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimizations
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_inventory_items_business ON inventory_items(business_id);
CREATE INDEX idx_inventory_batches_expiry ON inventory_batches(expiry_date);
CREATE INDEX idx_inventory_batches_status ON inventory_batches(status);
CREATE INDEX idx_inventory_history_item ON inventory_history(inventory_item_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;
