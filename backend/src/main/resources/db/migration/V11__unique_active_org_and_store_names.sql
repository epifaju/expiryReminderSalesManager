-- V11: Contraintes d'unicité pour Option A (admin org/store).
-- Objectif: empêcher les doublons "visibles" (actifs), tout en gardant la possibilité
-- d'archiver (soft delete) puis recréer avec le même nom.

-- Organisations: nom unique (case-insensitive) parmi les organisations actives
CREATE UNIQUE INDEX IF NOT EXISTS idx_organisations_name_active_unique
    ON organisations (lower(name))
    WHERE is_active IS TRUE;

-- Stores: nom unique (case-insensitive) par organisation parmi les stores actifs
CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_org_name_active_unique
    ON stores (organisation_id, lower(name))
    WHERE is_active IS TRUE;

