-- Migration V5: Colonne barcode sur products (PRD scanner Bluetooth §14)
-- Idempotent : safe si la colonne ou l'index existent déjà (V4 partiel).

ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(50);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode_unique
    ON products(barcode)
    WHERE barcode IS NOT NULL;
