-- Migration V4: Ajout d'index pour optimisation des performances
-- Améliore les performances des requêtes de synchronisation et de reporting

-- ============================================================================
-- INDEX SUR TABLE PRODUCTS
-- ============================================================================

-- Index composite pour les requêtes de synchronisation delta
-- Utilisé par: findByUpdatedAtAfter(), findBySyncStatusAndUpdatedAtAfter()
CREATE INDEX IF NOT EXISTS idx_products_sync_updated 
    ON products(updated_at DESC, is_active) 
    WHERE is_active = true;

-- Index pour recherche rapide par barcode (unique déjà existant mais optimisé)
CREATE INDEX IF NOT EXISTS idx_products_barcode 
    ON products(barcode) 
    WHERE barcode IS NOT NULL;

-- Index pour les produits en stock faible
CREATE INDEX IF NOT EXISTS idx_products_low_stock 
    ON products(stock_quantity, min_stock_level) 
    WHERE stock_quantity <= min_stock_level AND is_active = true;

-- Index pour les produits expirant bientôt
CREATE INDEX IF NOT EXISTS idx_products_expiry 
    ON products(expiry_date) 
    WHERE expiry_date IS NOT NULL AND is_active = true;

-- Index pour recherche par catégorie
CREATE INDEX IF NOT EXISTS idx_products_category 
    ON products(category, is_active) 
    WHERE is_active = true;

-- Index pour le créateur (pour filtrer par utilisateur)
CREATE INDEX IF NOT EXISTS idx_products_created_by 
    ON products(created_by, created_at DESC);

-- ============================================================================
-- INDEX SUR TABLE SALES
-- ============================================================================

-- Index composite pour les requêtes de synchronisation
-- Utilisé par: findByUserIdAndUpdatedAtAfter()
CREATE INDEX IF NOT EXISTS idx_sales_user_updated 
    ON sales(created_by, updated_at DESC);

-- Index pour les ventes par date
CREATE INDEX IF NOT EXISTS idx_sales_date 
    ON sales(sale_date DESC, created_by);

-- Index pour les ventes par statut
CREATE INDEX IF NOT EXISTS idx_sales_status 
    ON sales(status, sale_date DESC);

-- Index pour recherche par numéro de vente
CREATE INDEX IF NOT EXISTS idx_sales_number 
    ON sales(sale_number);

-- Index pour les ventes par méthode de paiement
CREATE INDEX IF NOT EXISTS idx_sales_payment 
    ON sales(payment_method, sale_date DESC);

-- Index pour les rapports (montant total par période)
CREATE INDEX IF NOT EXISTS idx_sales_amount_date 
    ON sales(final_amount, sale_date DESC);

-- ============================================================================
-- INDEX SUR TABLE SALE_ITEMS
-- ============================================================================

-- Index pour récupérer les items d'une vente
CREATE INDEX IF NOT EXISTS idx_sale_items_sale 
    ON sale_items(sale_id);

-- Index pour tracking des produits vendus
CREATE INDEX IF NOT EXISTS idx_sale_items_product 
    ON sale_items(product_id, created_at DESC);

-- ============================================================================
-- INDEX SUR TABLE STOCK_MOVEMENTS
-- ============================================================================

-- Index composite pour synchronisation
CREATE INDEX IF NOT EXISTS idx_stock_movements_updated 
    ON stock_movements(updated_at DESC, product_id);

-- Index pour les mouvements par produit
CREATE INDEX IF NOT EXISTS idx_stock_movements_product 
    ON stock_movements(product_id, created_at DESC);

-- Index pour les mouvements par type
CREATE INDEX IF NOT EXISTS idx_stock_movements_type 
    ON stock_movements(movement_type, created_at DESC);

-- ============================================================================
-- INDEX SUR TABLE SYNC_LOGS
-- ============================================================================

-- Index pour les logs de synchronisation par date (déjà présent mais amélioré)
CREATE INDEX IF NOT EXISTS idx_sync_logs_timestamp 
    ON sync_logs(timestamp DESC);

-- Index pour les logs par type de sync
CREATE INDEX IF NOT EXISTS idx_sync_logs_type 
    ON sync_logs(sync_type, timestamp DESC);

-- Index pour les logs par device
CREATE INDEX IF NOT EXISTS idx_sync_logs_device 
    ON sync_logs(device_id, timestamp DESC);

-- Index pour les logs avec erreurs
CREATE INDEX IF NOT EXISTS idx_sync_logs_errors 
    ON sync_logs(error_count, timestamp DESC) 
    WHERE error_count > 0;

-- ============================================================================
-- INDEX SUR TABLE USERS (Si nécessaire)
-- ============================================================================

-- Index pour recherche par email (si pas déjà unique)
CREATE INDEX IF NOT EXISTS idx_users_email 
    ON users(email);

-- Index pour utilisateurs actifs
CREATE INDEX IF NOT EXISTS idx_users_active 
    ON users(is_active, created_at DESC) 
    WHERE is_active = true;

-- ============================================================================
-- INDEX SUR TABLE RECEIPTS (Si existe)
-- ============================================================================

-- Index pour les reçus par vente
CREATE INDEX IF NOT EXISTS idx_receipts_sale 
    ON receipts(sale_id);

-- Index pour les reçus par date
CREATE INDEX IF NOT EXISTS idx_receipts_date 
    ON receipts(created_at DESC);

-- ============================================================================
-- STATISTIQUES ET ANALYSE
-- ============================================================================

-- Mettre à jour les statistiques des tables pour l'optimiseur
ANALYZE products;
ANALYZE sales;
ANALYZE sale_items;
ANALYZE stock_movements;
ANALYZE sync_logs;
ANALYZE sync_conflicts;

-- ============================================================================
-- COMMENTAIRES POUR DOCUMENTATION
-- ============================================================================

COMMENT ON INDEX idx_products_sync_updated IS 'Index composite pour synchronisation delta - améliore findByUpdatedAtAfter()';
COMMENT ON INDEX idx_products_low_stock IS 'Index partiel pour alertes de stock faible - uniquement produits actifs';
COMMENT ON INDEX idx_sales_user_updated IS 'Index composite pour sync des ventes par utilisateur';
COMMENT ON INDEX idx_sync_logs_errors IS 'Index partiel pour logs avec erreurs uniquement';

-- ============================================================================
-- VÉRIFICATION DES INDEX CRÉÉS
-- ============================================================================

-- Pour vérifier les index créés, exécuter :
-- SELECT tablename, indexname, indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, indexname;

