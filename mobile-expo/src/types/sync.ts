/**
 * Types TypeScript pour la synchronisation bidirectionnelle
 * Correspond aux DTOs backend Java
 */

// ===== TYPES DE BASE =====

export enum EntityType {
  PRODUCT = 'product',
  SALE = 'sale',
  STOCK_MOVEMENT = 'stock_movement'
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

export enum OperationStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  CONFLICT = 'conflict'
}

export enum ConflictType {
  UPDATE_CONFLICT = 'update_conflict',
  DELETE_CONFLICT = 'delete_conflict',
  CREATE_CONFLICT = 'create_conflict'
}

// ===== REQUÊTES DE SYNCHRONISATION =====

export interface SyncOperation {
  entityId: string;
  localId: string;
  entityType: EntityType;
  operationType: OperationType;
  entityData: Record<string, any>;
  timestamp: string; // ISO 8601
}

export interface SyncBatchRequest {
  operations: SyncOperation[];
  clientTimestamp: string; // ISO 8601
  deviceId: string;
  appVersion: string;
  syncSessionId?: string;
}

export interface SyncDeltaRequest {
  lastSyncTimestamp: string; // ISO 8601
  deviceId?: string;
  appVersion?: string;
  entityTypes?: EntityType[];
  limit?: number;
  syncSessionId?: string;
}

// ===== RÉPONSES DE SYNCHRONISATION =====

export interface OperationResult {
  entityId: string;
  localId: string;
  serverId?: string;
  entityType: string;
  operationType: string;
  status: OperationStatus;
  message?: string;
  timestamp: string; // ISO 8601
}

export interface SyncConflict {
  conflictId: string;
  entityId: string;
  entityType: string;
  conflictType: ConflictType;
  localData: Record<string, any>;
  serverData?: Record<string, any>;
  message: string;
  timestamp: string; // ISO 8601
}

export interface SyncError {
  entityId: string;
  entityType: string;
  operationType: string;
  errorCode: string;
  errorMessage: string;
  timestamp: string; // ISO 8601
}

export interface SyncStatistics {
  byEntityType: Record<string, number>;
  byOperationType: Record<string, number>;
  averageProcessingTimeMs: number;
}

export interface SyncBatchResponse {
  syncSessionId: string;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  conflictCount: number;
  processingTimeMs: number;
  results: OperationResult[];
  conflicts: SyncConflict[];
  errors: SyncError[];
  statistics: SyncStatistics;
  serverTimestamp: string; // ISO 8601
}

export interface ModifiedEntity {
  entityId: string;
  entityType: string;
  entityData: Record<string, any>;
  lastModified: string; // ISO 8601
  version: number;
  operationType: string;
}

export interface DeletedEntity {
  entityId: string;
  entityType: string;
  deletedAt: string; // ISO 8601
  version: number;
}

export interface DeltaStatistics {
  byEntityType: Record<string, number>;
  byOperationType: Record<string, number>;
  oldestModification?: string; // ISO 8601
  newestModification?: string; // ISO 8601
  totalDataSizeBytes: number;
}

export interface SyncDeltaResponse {
  modifiedEntities: ModifiedEntity[];
  deletedEntities: DeletedEntity[];
  totalModified: number;
  totalDeleted: number;
  serverTimestamp: string; // ISO 8601
  syncSessionId: string;
  hasMore: boolean;
  nextSyncTimestamp: string; // ISO 8601
  statistics: DeltaStatistics;
}

// ===== STATUT DE SYNCHRONISATION =====

export interface SyncStatus {
  serverTime: string; // ISO 8601
  status: string;
  version: string;
  entityCounts: Record<string, number>;
}

// ===== CONFIGURATION DE SYNCHRONISATION =====

export interface SyncConfig {
  batchSize: number;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
  enableDeltaSync: boolean;
  enableBatchSync: boolean;
  syncIntervalMs: number;
}

// ===== ÉTATS DE SYNCHRONISATION =====

export enum SyncState {
  IDLE = 'idle',
  SYNCING = 'syncing',
  PAUSED = 'paused',
  ERROR = 'error',
  COMPLETED = 'completed'
}

export interface SyncProgress {
  state: SyncState;
  currentOperation: string;
  progress: number; // 0-100
  totalOperations: number;
  completedOperations: number;
  errors: number;
  conflicts: number;
  startTime?: string; // ISO 8601
  endTime?: string; // ISO 8601
}

// ===== ÉVÉNEMENTS DE SYNCHRONISATION =====

export interface SyncEvent {
  type: 'sync_started' | 'sync_progress' | 'sync_completed' | 'sync_error' | 'sync_conflict';
  timestamp: string; // ISO 8601
  data?: any;
  message?: string;
}

export type SyncEventListener = (event: SyncEvent) => void;

// ===== OPTIONS DE SYNCHRONISATION =====

export interface SyncOptions {
  forceFullSync?: boolean;
  entityTypes?: EntityType[];
  skipConflicts?: boolean;
  maxRetries?: number;
  timeoutMs?: number;
}

// ===== RÉSULTATS DE SYNCHRONISATION =====

export interface SyncResult {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  conflictCount: number;
  processingTimeMs: number;
  errors: SyncError[];
  conflicts: SyncConflict[];
  nextSyncTimestamp?: string; // ISO 8601
}

// ===== MÉTADONNÉES DE SYNCHRONISATION =====

export interface SyncMetadata {
  lastSyncTimestamp: string; // ISO 8601
  lastSyncType: 'batch' | 'delta';
  lastSyncStatus: 'success' | 'error' | 'conflict';
  totalSyncCount: number;
  successfulSyncCount: number;
  failedSyncCount: number;
  lastError?: string;
  deviceId: string;
  appVersion: string;
}

