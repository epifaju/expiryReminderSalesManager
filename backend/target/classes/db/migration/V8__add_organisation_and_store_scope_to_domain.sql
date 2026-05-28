-- V8: Ajout des colonnes organisation_id et store_id (nullable) sur les tables métier.
-- Elles restent NULL à ce stade; le backfill est fait en V9.

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS organisation_id UUID;

ALTER TABLE sales
    ADD COLUMN IF NOT EXISTS organisation_id UUID;

ALTER TABLE sale_items
    ADD COLUMN IF NOT EXISTS organisation_id UUID;

ALTER TABLE receipts
    ADD COLUMN IF NOT EXISTS organisation_id UUID,
    ADD COLUMN IF NOT EXISTS store_id UUID;

ALTER TABLE sales
    ADD COLUMN IF NOT EXISTS store_id UUID;

-- FKs (créées séparément pour rester idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_organisation'
    ) THEN
        ALTER TABLE products
            ADD CONSTRAINT fk_products_organisation
            FOREIGN KEY (organisation_id)
            REFERENCES organisations(id)
            ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_sales_organisation'
    ) THEN
        ALTER TABLE sales
            ADD CONSTRAINT fk_sales_organisation
            FOREIGN KEY (organisation_id)
            REFERENCES organisations(id)
            ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_sale_items_organisation'
    ) THEN
        ALTER TABLE sale_items
            ADD CONSTRAINT fk_sale_items_organisation
            FOREIGN KEY (organisation_id)
            REFERENCES organisations(id)
            ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_receipts_organisation'
    ) THEN
        ALTER TABLE receipts
            ADD CONSTRAINT fk_receipts_organisation
            FOREIGN KEY (organisation_id)
            REFERENCES organisations(id)
            ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_sales_store'
    ) THEN
        ALTER TABLE sales
            ADD CONSTRAINT fk_sales_store
            FOREIGN KEY (store_id)
            REFERENCES stores(id)
            ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_receipts_store'
    ) THEN
        ALTER TABLE receipts
            ADD CONSTRAINT fk_receipts_store
            FOREIGN KEY (store_id)
            REFERENCES stores(id)
            ON DELETE SET NULL;
    END IF;
END $$;

