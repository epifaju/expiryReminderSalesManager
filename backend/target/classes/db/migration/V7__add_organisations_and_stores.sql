-- V7: Organisations (tenants), stores (points de vente) et memberships.
-- Objectif: préparer le multi-tenant sans impacter le fonctionnement actuel.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS organisations (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY,
    organisation_id UUID NOT NULL,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_stores_organisation
        FOREIGN KEY (organisation_id)
        REFERENCES organisations(id)
        ON DELETE CASCADE
);

-- Rôle par organisation (différent des rôles globaux Spring Security existants).
CREATE TABLE IF NOT EXISTS organisation_members (
    organisation_id UUID NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (organisation_id, user_id),
    CONSTRAINT fk_org_members_org
        FOREIGN KEY (organisation_id)
        REFERENCES organisations(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_org_members_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

