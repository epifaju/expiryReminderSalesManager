-- V10: Rend l'isolation tenant "enforced" tout en restant compatible avec le code actuel.
-- Stratégie: on impose NOT NULL mais avec DEFAULT = org DEFAULT, donc l'app continue à fonctionner
-- même sans contexte tenant dans le JWT pour l'instant.

-- Defaults "compat" (DEFAULT org/store)
ALTER TABLE products
    ALTER COLUMN organisation_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;

ALTER TABLE sales
    ALTER COLUMN organisation_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    ALTER COLUMN store_id SET DEFAULT '00000000-0000-0000-0000-000000000002'::uuid;

ALTER TABLE sale_items
    ALTER COLUMN organisation_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;

ALTER TABLE receipts
    ALTER COLUMN organisation_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    ALTER COLUMN store_id SET DEFAULT '00000000-0000-0000-0000-000000000002'::uuid;

-- Backfill final sécurité
UPDATE products SET organisation_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organisation_id IS NULL;
UPDATE sales SET organisation_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organisation_id IS NULL;
UPDATE sale_items SET organisation_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organisation_id IS NULL;
UPDATE receipts SET organisation_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organisation_id IS NULL;

-- NOT NULL enforced
ALTER TABLE products
    ALTER COLUMN organisation_id SET NOT NULL;

ALTER TABLE sales
    ALTER COLUMN organisation_id SET NOT NULL;

ALTER TABLE sale_items
    ALTER COLUMN organisation_id SET NOT NULL;

ALTER TABLE receipts
    ALTER COLUMN organisation_id SET NOT NULL;

-- Barcode unique par organisation: on supprime les uniques existants sur barcode et on recrée une unique composite.
-- 1) Drop de l'index V5 si présent
DROP INDEX IF EXISTS idx_products_barcode_unique;

-- 2) Drop de la contrainte UNIQUE sur products(barcode) créée par V1 (nom auto, typiquement products_barcode_key)
DO $$
DECLARE
    c RECORD;
BEGIN
    FOR c IN
        SELECT conname, conkey
        FROM pg_constraint
        WHERE conrelid = 'products'::regclass
          AND contype = 'u'
    LOOP
        -- On ne supprime que les uniques qui portent uniquement sur la colonne "barcode"
        IF (
            SELECT array_agg(att.attname::text ORDER BY att.attname::text)
            FROM unnest(c.conkey) AS k(attnum)
            JOIN pg_attribute att ON att.attrelid = 'products'::regclass AND att.attnum = k.attnum
        ) = ARRAY['barcode']::text[] THEN
            EXECUTE format('ALTER TABLE products DROP CONSTRAINT IF EXISTS %I', c.conname);
        END IF;
    END LOOP;
END $$;

-- 3) Création de la contrainte unique tenant-scoped (index unique partiel)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_org_barcode_unique
    ON products(organisation_id, barcode)
    WHERE barcode IS NOT NULL;

-- Index perfs
CREATE INDEX IF NOT EXISTS idx_products_org_updated_at ON products(organisation_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_sales_org_sale_date ON sales(organisation_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_receipts_org_created_at ON receipts(organisation_id, created_at);

