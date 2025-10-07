-- Migration V3: Ajout de la table sync_conflicts pour la gestion des conflits de synchronisation

-- Création de la table sync_conflicts
CREATE TABLE IF NOT EXISTS sync_conflicts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    local_data TEXT NOT NULL,
    server_data TEXT NOT NULL,
    conflict_type VARCHAR(50),
    resolution_strategy VARCHAR(50),
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    local_version INTEGER,
    server_version INTEGER,
    conflict_details TEXT,
    
    CONSTRAINT fk_sync_conflicts_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_user_id 
    ON sync_conflicts(user_id);

CREATE INDEX IF NOT EXISTS idx_sync_conflicts_unresolved 
    ON sync_conflicts(user_id, resolved_at) 
    WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sync_conflicts_entity 
    ON sync_conflicts(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_sync_conflicts_created_at 
    ON sync_conflicts(created_at DESC);

-- Commentaires pour documentation
COMMENT ON TABLE sync_conflicts IS 'Table pour stocker les conflits de synchronisation détectés';
COMMENT ON COLUMN sync_conflicts.conflict_type IS 'Type de conflit: VERSION_MISMATCH, UPDATE_DELETE, DELETE_UPDATE, etc.';
COMMENT ON COLUMN sync_conflicts.resolution_strategy IS 'Stratégie de résolution: SERVER_WINS, CLIENT_WINS, MANUAL, MERGED';
COMMENT ON COLUMN sync_conflicts.local_data IS 'Données locales (client) au format JSON';
COMMENT ON COLUMN sync_conflicts.server_data IS 'Données serveur au format JSON';

