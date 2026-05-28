-- V9: Crée une organisation et une boutique par défaut + backfill des colonnes.
-- But: conserver le comportement actuel tant que le switch org/store n'est pas implémenté.

-- UUIDs constants pour pouvoir poser des DEFAULT en V10 sans dépendre d'un SELECT.
-- Choix volontairement "improbable" pour éviter collisions.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM organisations WHERE id = '00000000-0000-0000-0000-000000000001') THEN
        INSERT INTO organisations (id, name, is_active, created_at, updated_at)
        VALUES ('00000000-0000-0000-0000-000000000001', 'DEFAULT', TRUE, NOW(), NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM stores WHERE id = '00000000-0000-0000-0000-000000000002') THEN
        INSERT INTO stores (id, organisation_id, name, address, is_active, created_at, updated_at)
        VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'DEFAULT', NULL, TRUE, NOW(), NOW());
    END IF;
END $$;

-- Tous les users existants deviennent membres de DEFAULT (rôle simple).
INSERT INTO organisation_members (organisation_id, user_id, role, status, created_at, updated_at)
SELECT
    '00000000-0000-0000-0000-000000000001'::uuid,
    u.id,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = u.id AND ur.roles IN ('ROLE_ADMIN', 'ROLE_MANAGER')
        ) THEN 'ORG_ADMIN'
        ELSE 'ORG_USER'
    END AS role,
    'ACTIVE',
    NOW(),
    NOW()
FROM users u
ON CONFLICT (organisation_id, user_id) DO NOTHING;

-- Backfill des tables métier vers DEFAULT.
UPDATE products
SET organisation_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organisation_id IS NULL;

UPDATE sales
SET organisation_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organisation_id IS NULL;

UPDATE sale_items
SET organisation_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organisation_id IS NULL;

UPDATE receipts
SET organisation_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE organisation_id IS NULL;

-- Backfill store sur ventes / reçus (optionnel, nullable).
UPDATE sales
SET store_id = '00000000-0000-0000-0000-000000000002'::uuid
WHERE store_id IS NULL;

UPDATE receipts
SET store_id = '00000000-0000-0000-0000-000000000002'::uuid
WHERE store_id IS NULL;

