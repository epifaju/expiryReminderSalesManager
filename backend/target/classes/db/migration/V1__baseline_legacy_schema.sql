-- V1 : Schéma initial PostgreSQL (production).
-- Objectif: permettre un démarrage sur base vide (sans Hibernate ddl-auto) et laisser Flyway gérer V2+.

-- ============================================================================
-- USERS + ROLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(120) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'fr',
    preferred_currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    enabled BOOLEAN NOT NULL DEFAULT TRUE
);

-- ElementCollection(Role) -> table user_roles(user_id, roles)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    roles VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, roles),
    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ============================================================================
-- PRODUCTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    barcode VARCHAR(50) UNIQUE,
    purchase_price NUMERIC(10, 2) NOT NULL,
    selling_price NUMERIC(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER NOT NULL DEFAULT 5,
    expiry_date DATE,
    manufacturing_date DATE,
    category VARCHAR(50),
    unit VARCHAR(20) DEFAULT 'pcs',
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by BIGINT,
    CONSTRAINT fk_products_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- ============================================================================
-- SALES + SALE_ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS sales (
    id BIGSERIAL PRIMARY KEY,
    sale_number VARCHAR(255) UNIQUE,
    sale_date TIMESTAMP NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    final_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(255),
    customer_email VARCHAR(255),
    notes TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by BIGINT,
    CONSTRAINT fk_sales_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(10, 2) NOT NULL,
    product_name VARCHAR(255),
    product_barcode VARCHAR(50),
    product_purchase_price NUMERIC(10, 2),
    CONSTRAINT fk_sale_items_sale
        FOREIGN KEY (sale_id)
        REFERENCES sales(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_sale_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT
);

-- ============================================================================
-- RECEIPTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS receipts (
    id BIGSERIAL PRIMARY KEY,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    sale_id BIGINT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    final_amount NUMERIC(10, 2),
    payment_method VARCHAR(50),
    status VARCHAR(50),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(255),
    customer_email VARCHAR(255),
    company_name VARCHAR(255),
    company_address VARCHAR(255),
    company_phone VARCHAR(255),
    company_email VARCHAR(255),
    company_logo_url VARCHAR(255),
    notes TEXT,
    qr_code_data VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    downloaded_at TIMESTAMP,
    download_count INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fk_receipts_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_receipts_sale
        FOREIGN KEY (sale_id)
        REFERENCES sales(id)
        ON DELETE CASCADE
);

-- ============================================================================
-- STOCK_MOVEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS stock_movements (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    movement_type VARCHAR(50),
    reason VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- ============================================================================
-- SYNC_LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_logs (
    id BIGSERIAL PRIMARY KEY,
    sync_type VARCHAR(255) NOT NULL,
    device_id VARCHAR(255),
    operations_count INTEGER,
    success_count INTEGER,
    error_count INTEGER,
    conflict_count INTEGER,
    processing_time_ms BIGINT,
    timestamp TIMESTAMP NOT NULL,
    app_version VARCHAR(255),
    sync_session_id VARCHAR(255)
);
