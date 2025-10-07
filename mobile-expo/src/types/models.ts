/**
 * Modèles de données TypeScript pour le mode offline
 * Correspondance exacte avec les schémas SQL du PRD
 */

// =============================================================================
// TYPES DE BASE
// =============================================================================

/**
 * Statut de synchronisation des entités
 */
export type SyncStatus = 'pending' | 'synced' | 'conflict';

/**
 * Types d'opérations de synchronisation
 */
export type SyncOperation = 'create' | 'update' | 'delete';

/**
 * Types d'entités synchronisables
 */
export type EntityType = 'product' | 'sale' | 'stock_movement';

/**
 * Types de mouvements de stock
 */
export type MovementType = 'in' | 'out' | 'adjustment';

// =============================================================================
// INTERFACE PRODUIT
// =============================================================================

/**
 * Interface principale pour les produits
 * Correspond exactement au schéma SQL de la table products
 */
export interface Product {
  /** UUID généré localement (clé primaire) */
  id: string;
  
  /** ID du serveur après synchronisation (nullable) */
  server_id?: number;
  
  /** Nom du produit */
  name: string;
  
  /** Prix unitaire en centimes */
  price: number;
  
  /** Quantité en stock */
  stock_quantity: number;
  
  /** Date d'expiration (format ISO 8601, nullable) */
  expiration_date?: string;
  
  /** Date de création (format ISO 8601) */
  created_at: string;
  
  /** Date de dernière modification (format ISO 8601) */
  updated_at: string;
  
  /** Indicateur de suppression logique (0 = actif, 1 = supprimé) */
  is_deleted: number;
  
  /** Statut de synchronisation */
  sync_status: SyncStatus;
  
  /** ID de l'utilisateur propriétaire */
  user_id: string;
}

/**
 * DTO pour créer un nouveau produit
 */
export interface CreateProductDTO {
  name: string;
  price: number;
  stock_quantity: number;
  expiration_date?: string;
  user_id: string;
}

/**
 * DTO pour mettre à jour un produit existant
 */
export interface UpdateProductDTO {
  id: string;
  name?: string;
  price?: number;
  stock_quantity?: number;
  expiration_date?: string;
  server_id?: number;
  sync_status?: SyncStatus;
}

/**
 * DTO pour les produits avec mapping serveur
 */
export interface ProductWithServerMapping extends Product {
  server_id: number; // Non-nullable quand synchronisé
}

// =============================================================================
// INTERFACE VENTE
// =============================================================================

/**
 * Interface principale pour les ventes
 * Correspond exactement au schéma SQL de la table sales
 */
export interface Sale {
  /** UUID généré localement (clé primaire) */
  id: string;
  
  /** ID du serveur après synchronisation (nullable) */
  server_id?: number;
  
  /** ID local du produit vendu */
  product_id: string;
  
  /** ID serveur du produit (nullable) */
  product_server_id?: number;
  
  /** Quantité vendue */
  quantity: number;
  
  /** Prix unitaire au moment de la vente */
  unit_price: number;
  
  /** Montant total de la vente */
  total_amount: number;
  
  /** Date et heure de la vente (format ISO 8601) */
  sale_date: string;
  
  /** Date de création (format ISO 8601) */
  created_at: string;
  
  /** Date de dernière modification (format ISO 8601) */
  updated_at: string;
  
  /** Indicateur de suppression logique (0 = actif, 1 = supprimé) */
  is_deleted: number;
  
  /** Statut de synchronisation */
  sync_status: SyncStatus;
  
  /** ID de l'utilisateur propriétaire */
  user_id: string;
}

/**
 * DTO pour créer une nouvelle vente
 */
export interface CreateSaleDTO {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  sale_date: string;
  user_id: string;
}

/**
 * DTO pour mettre à jour une vente existante
 */
export interface UpdateSaleDTO {
  id: string;
  product_id?: string;
  quantity?: number;
  unit_price?: number;
  total_amount?: number;
  server_id?: number;
  product_server_id?: number;
  sync_status?: SyncStatus;
}

/**
 * Vente avec informations du produit
 */
export interface SaleWithProduct extends Sale {
  product_name: string;
  product_price: number;
}

// =============================================================================
// INTERFACE MOUVEMENT DE STOCK
// =============================================================================

/**
 * Interface principale pour les mouvements de stock
 * Correspond exactement au schéma SQL de la table stock_movements
 */
export interface StockMovement {
  /** UUID généré localement (clé primaire) */
  id: string;
  
  /** ID du serveur après synchronisation (nullable) */
  server_id?: number;
  
  /** ID du produit concerné */
  product_id: string;
  
  /** Type de mouvement */
  movement_type: MovementType;
  
  /** Quantité du mouvement (positive pour entrée, négative pour sortie) */
  quantity: number;
  
  /** Raison du mouvement (nullable) */
  reason?: string;
  
  /** Date du mouvement (format ISO 8601) */
  movement_date: string;
  
  /** Date de création (format ISO 8601) */
  created_at: string;
  
  /** Date de dernière modification (format ISO 8601) */
  updated_at: string;
  
  /** Indicateur de suppression logique (0 = actif, 1 = supprimé) */
  is_deleted: number;
  
  /** Statut de synchronisation */
  sync_status: SyncStatus;
  
  /** ID de l'utilisateur propriétaire */
  user_id: string;
}

/**
 * DTO pour créer un nouveau mouvement de stock
 */
export interface CreateStockMovementDTO {
  product_id: string;
  movement_type: MovementType;
  quantity: number;
  reason?: string;
  movement_date: string;
  user_id: string;
}

/**
 * DTO pour mettre à jour un mouvement de stock existant
 */
export interface UpdateStockMovementDTO {
  id: string;
  movement_type?: MovementType;
  quantity?: number;
  reason?: string;
  server_id?: number;
  sync_status?: SyncStatus;
}

// =============================================================================
// INTERFACE QUEUE DE SYNCHRONISATION
// =============================================================================

/**
 * Interface pour les éléments de la queue de synchronisation
 * Correspond exactement au schéma SQL de la table sync_queue
 */
export interface SyncQueueItem {
  /** ID auto-incrémenté (clé primaire) */
  id: number;
  
  /** Type d'entité concernée */
  entity_type: EntityType;
  
  /** ID local de l'entité */
  entity_id: string;
  
  /** Type d'opération à synchroniser */
  operation: SyncOperation;
  
  /** Données JSON sérialisées de l'entité */
  payload: string;
  
  /** Nombre de tentatives de synchronisation */
  retry_count: number;
  
  /** Nombre maximum de tentatives autorisées */
  max_retries: number;
  
  /** Date de création de l'opération (format ISO 8601) */
  created_at: string;
  
  /** Date de dernière tentative (format ISO 8601, nullable) */
  last_attempt_at?: string;
  
  /** Message d'erreur de la dernière tentative (nullable) */
  error_message?: string;
}

/**
 * DTO pour ajouter un élément à la queue de synchronisation
 */
export interface CreateSyncQueueItemDTO {
  entity_type: EntityType;
  entity_id: string;
  operation: SyncOperation;
  payload: any; // Objet qui sera sérialisé en JSON
}

/**
 * DTO pour mettre à jour un élément de la queue
 */
export interface UpdateSyncQueueItemDTO {
  id: number;
  retry_count?: number;
  last_attempt_at?: string;
  error_message?: string;
}

// =============================================================================
// INTERFACE MÉTADONNÉES DE SYNCHRONISATION
// =============================================================================

/**
 * Interface pour les métadonnées de synchronisation
 * Correspond exactement au schéma SQL de la table sync_metadata
 */
export interface SyncMetadata {
  /** ID auto-incrémenté (clé primaire) */
  id: number;
  
  /** Date de la dernière synchronisation (format ISO 8601, nullable) */
  last_sync_at?: string;
  
  /** Date de la dernière synchronisation réussie (format ISO 8601, nullable) */
  last_successful_sync_at?: string;
  
  /** Nombre d'opérations en attente de synchronisation */
  pending_operations_count: number;
  
  /** ID de l'utilisateur */
  user_id: string;
}

/**
 * DTO pour créer les métadonnées de synchronisation
 */
export interface CreateSyncMetadataDTO {
  user_id: string;
}

/**
 * DTO pour mettre à jour les métadonnées de synchronisation
 */
export interface UpdateSyncMetadataDTO {
  id: number;
  last_sync_at?: string;
  last_successful_sync_at?: string;
  pending_operations_count?: number;
}

// =============================================================================
// TYPES UTILITAIRES POUR LA SYNCHRONISATION
// =============================================================================

/**
 * Résultat d'une opération de synchronisation
 */
export interface SyncResult {
  status: 'success' | 'failed' | 'partial';
  synced: number;
  failed: number;
  conflicts: number;
  error?: string;
}

/**
 * Mapping entre ID local et ID serveur
 */
export interface IdMapping {
  localId: string;
  serverId: number;
}

/**
 * Réponse de synchronisation du serveur
 */
export interface SyncResponse {
  syncStatus: 'success' | 'partial' | 'failed';
  timestamp: string;
  processedOperations: number;
  conflicts: ConflictInfo[];
  mappings: IdMapping[];
  serverUpdates: ServerUpdate[];
}

/**
 * Information sur un conflit détecté
 */
export interface ConflictInfo {
  entityType: EntityType;
  entityId: string;
  localData: any;
  serverData: any;
  conflictType: 'version_mismatch' | 'concurrent_modification';
}

/**
 * Mise à jour du serveur à appliquer localement
 */
export interface ServerUpdate {
  entityType: EntityType;
  serverId: number;
  data: any;
  operation: SyncOperation;
}

/**
 * Réponse delta du serveur
 */
export interface DeltaSyncResponse {
  products: {
    updated: Product[];
    deleted: number[];
  };
  sales: {
    updated: Sale[];
    deleted: number[];
  };
  stock_movements: {
    updated: StockMovement[];
    deleted: number[];
  };
}

// =============================================================================
// TYPES POUR LES RECHERCHES ET FILTRES
// =============================================================================

/**
 * Critères de recherche pour les produits
 */
export interface ProductSearchCriteria {
  name?: string;
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  maxStock?: number;
  expirationDateBefore?: string;
  syncStatus?: SyncStatus;
  userId: string;
  limit?: number;
  offset?: number;
}

/**
 * Critères de recherche pour les ventes
 */
export interface SaleSearchCriteria {
  productId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  syncStatus?: SyncStatus;
  userId: string;
  limit?: number;
  offset?: number;
}

/**
 * Critères de recherche pour les mouvements de stock
 */
export interface StockMovementSearchCriteria {
  productId?: string;
  movementType?: MovementType;
  dateFrom?: string;
  dateTo?: string;
  syncStatus?: SyncStatus;
  userId: string;
  limit?: number;
  offset?: number;
}

// =============================================================================
// TYPES POUR LES RAPPORTS
// =============================================================================

/**
 * Résumé des ventes par période
 */
export interface SalesSummary {
  totalSales: number;
  totalAmount: number;
  averageAmount: number;
  productCount: number;
  dateFrom: string;
  dateTo: string;
}

/**
 * Top des produits vendus
 */
export interface TopProduct {
  product_id: string;
  product_name: string;
  totalQuantity: number;
  totalAmount: number;
  salesCount: number;
}

/**
 * Mouvements de stock par produit
 */
export interface StockMovementSummary {
  product_id: string;
  product_name: string;
  initialStock: number;
  finalStock: number;
  totalIn: number;
  totalOut: number;
  movements: StockMovement[];
}

// =============================================================================
// TYPES POUR LA GESTION DES ERREURS
// =============================================================================

/**
 * Erreur de base de données
 */
export interface DatabaseError {
  code: string;
  message: string;
  query?: string;
  params?: any[];
}

/**
 * Erreur de synchronisation
 */
export interface SyncError {
  type: 'network' | 'server' | 'conflict' | 'validation';
  message: string;
  entityType?: EntityType;
  entityId?: string;
  retryable: boolean;
}

// =============================================================================
// EXPORT DE TOUS LES TYPES
// =============================================================================

export type {
  // Types de base
  SyncStatus,
  SyncOperation,
  EntityType,
  MovementType,
  
  // Produits
  Product,
  CreateProductDTO,
  UpdateProductDTO,
  ProductWithServerMapping,
  
  // Ventes
  Sale,
  CreateSaleDTO,
  UpdateSaleDTO,
  SaleWithProduct,
  
  // Mouvements de stock
  StockMovement,
  CreateStockMovementDTO,
  UpdateStockMovementDTO,
  
  // Queue de synchronisation
  SyncQueueItem,
  CreateSyncQueueItemDTO,
  UpdateSyncQueueItemDTO,
  
  // Métadonnées de synchronisation
  SyncMetadata,
  CreateSyncMetadataDTO,
  UpdateSyncMetadataDTO,
  
  // Synchronisation
  SyncResult,
  IdMapping,
  SyncResponse,
  ConflictInfo,
  ServerUpdate,
  DeltaSyncResponse,
  
  // Recherches
  ProductSearchCriteria,
  SaleSearchCriteria,
  StockMovementSearchCriteria,
  
  // Rapports
  SalesSummary,
  TopProduct,
  StockMovementSummary,
  
  // Erreurs
  DatabaseError,
  SyncError,
};

