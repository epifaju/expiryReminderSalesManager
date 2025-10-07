/**
 * Types TypeScript pour la résolution automatique de conflits
 * Gestion des conflits de données lors de la synchronisation
 */

// ===== TYPES DE BASE =====

export enum ConflictType {
  UPDATE_UPDATE = 'update_update',           // Même entité modifiée côté client et serveur
  UPDATE_DELETE = 'update_delete',           // Entité modifiée côté client, supprimée côté serveur
  DELETE_UPDATE = 'delete_update',           // Entité supprimée côté client, modifiée côté serveur
  CREATE_CREATE = 'create_create',           // Même entité créée côté client et serveur
  VERSION_CONFLICT = 'version_conflict',     // Conflit de version entre client et serveur
  CONSTRAINT_VIOLATION = 'constraint_violation', // Violation de contraintes métier
  DATA_INCONSISTENCY = 'data_inconsistency'  // Incohérence dans les données
}

export enum ConflictResolutionStrategy {
  LAST_WRITE_WINS = 'last_write_wins',       // Dernière écriture gagne (par défaut)
  CLIENT_WINS = 'client_wins',               // Client gagne toujours
  SERVER_WINS = 'server_wins',               // Serveur gagne toujours
  MANUAL_RESOLUTION = 'manual_resolution',   // Résolution manuelle requise
  MERGE_STRATEGY = 'merge_strategy',         // Fusion intelligente des données
  BUSINESS_RULES = 'business_rules',         // Règles métier spécifiques
  AUTOMATIC_MERGE = 'automatic_merge',       // Fusion automatique quand possible
  REJECT_CHANGES = 'reject_changes'          // Rejeter les changements
}

export enum ConflictStatus {
  PENDING = 'pending',                       // Conflit en attente de résolution
  RESOLVED = 'resolved',                     // Conflit résolu
  IGNORED = 'ignored',                       // Conflit ignoré
  ESCALATED = 'escalated',                   // Conflit escaladé pour résolution manuelle
  FAILED = 'failed'                          // Échec de la résolution
}

export enum ConflictSeverity {
  LOW = 'low',                               // Conflit mineur, résolution automatique possible
  MEDIUM = 'medium',                         // Conflit modéré, résolution semi-automatique
  HIGH = 'high',                             // Conflit majeur, résolution manuelle requise
  CRITICAL = 'critical'                      // Conflit critique, intervention immédiate
}

// ===== TYPES DE CONFLIT =====

export interface Conflict {
  id: string;                                // ID unique du conflit
  entityType: string;                        // Type d'entité (product, sale, stock_movement)
  entityId: string;                          // ID de l'entité en conflit
  conflictType: ConflictType;                // Type de conflit
  severity: ConflictSeverity;                // Gravité du conflit
  status: ConflictStatus;                    // Statut de résolution
  createdAt: string;                         // ISO 8601 - Date de création
  resolvedAt?: string;                       // ISO 8601 - Date de résolution
  resolvedBy?: string;                       // Qui a résolu (user_id ou 'system')
  
  // Données du conflit
  clientData?: any;                          // Données côté client
  serverData?: any;                          // Données côté serveur
  clientVersion?: number;                    // Version côté client
  serverVersion?: number;                    // Version côté serveur
  clientTimestamp: string;                   // ISO 8601 - Timestamp côté client
  serverTimestamp: string;                   // ISO 8601 - Timestamp côté serveur
  
  // Métadonnées
  operationType: string;                     // Type d'opération (create, update, delete)
  conflictReason: string;                    // Raison du conflit
  resolutionStrategy?: ConflictResolutionStrategy; // Stratégie de résolution appliquée
  resolutionData?: any;                      // Données de résolution
  resolutionNotes?: string;                  // Notes de résolution
  
  // Contexte
  userId?: string;                           // Utilisateur concerné
  deviceId?: string;                         // Device concerné
  syncSessionId?: string;                    // Session de sync
}

export interface ConflictResolution {
  conflictId: string;                        // ID du conflit à résoudre
  strategy: ConflictResolutionStrategy;      // Stratégie choisie
  resolvedData: any;                         // Données résolues
  resolutionNotes?: string;                  // Notes de résolution
  resolvedBy: string;                        // Qui résout ('system' ou user_id)
  resolvedAt: string;                        // ISO 8601 - Date de résolution
  confidence?: number;                       // Confiance en la résolution (0-1)
  requiresApproval?: boolean;                // Nécessite approbation manuelle
}

export interface ConflictAnalysis {
  conflictId: string;
  analysisType: string;                      // Type d'analyse
  confidence: number;                        // Confiance (0-1)
  suggestedStrategy: ConflictResolutionStrategy;
  suggestedData: any;                        // Données suggérées
  reasoning: string[];                       // Raisons de la suggestion
  risks: string[];                           // Risques identifiés
  alternatives: ConflictResolution[];        // Alternatives possibles
  metadata: Record<string, any>;             // Métadonnées d'analyse
}

// ===== TYPES POUR LA RÉSOLUTION =====

export interface ConflictResolver {
  name: string;                              // Nom du résolveur
  version: string;                           // Version du résolveur
  supportedTypes: ConflictType[];            // Types de conflits supportés
  supportedEntities: string[];               // Types d'entités supportés
  strategies: ConflictResolutionStrategy[];  // Stratégies supportées
  priority: number;                          // Priorité (plus élevé = plus prioritaire)
  isEnabled: boolean;                        // Actif ou non
}

export interface ConflictResolutionRule {
  id: string;
  name: string;
  description: string;
  entityType: string;                        // Type d'entité concerné
  conflictType: ConflictType;                // Type de conflit concerné
  condition: ConflictCondition;              // Condition d'application
  strategy: ConflictResolutionStrategy;      // Stratégie à appliquer
  priority: number;                          // Priorité de la règle
  isActive: boolean;                         // Règle active
  createdAt: string;                         // ISO 8601
  updatedAt: string;                         // ISO 8601
}

export interface ConflictCondition {
  field?: string;                            // Champ concerné
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;                                // Valeur de comparaison
  logicalOperator?: 'AND' | 'OR';            // Opérateur logique avec condition précédente
}

// ===== TYPES POUR LES STRATÉGIES DE RÉSOLUTION =====

export interface LastWriteWinsStrategy {
  strategy: ConflictResolutionStrategy.LAST_WRITE_WINS;
  useTimestamp: boolean;                     // Utiliser timestamp au lieu de version
  timestampField: string;                    // Champ timestamp à utiliser
  fallbackStrategy: ConflictResolutionStrategy; // Stratégie de fallback
}

export interface MergeStrategy {
  strategy: ConflictResolutionStrategy.MERGE_STRATEGY;
  mergeFields: MergeFieldConfig[];           // Configuration des champs à fusionner
  conflictResolution: 'client' | 'server' | 'custom'; // Résolution des conflits de champs
  customMerger?: string;                     // Nom du mergeur personnalisé
}

export interface MergeFieldConfig {
  fieldName: string;                         // Nom du champ
  mergeType: 'client' | 'server' | 'merge' | 'custom'; // Type de fusion
  customMerger?: string;                     // Mergeur personnalisé pour ce champ
  priority?: number;                         // Priorité en cas de conflit
  isRequired?: boolean;                      // Champ requis
}

export interface BusinessRulesStrategy {
  strategy: ConflictResolutionStrategy.BUSINESS_RULES;
  rules: BusinessRule[];                     // Règles métier
  fallbackStrategy: ConflictResolutionStrategy; // Stratégie de fallback
}

export interface BusinessRule {
  id: string;
  name: string;
  condition: ConflictCondition;              // Condition d'application
  action: 'client_wins' | 'server_wins' | 'merge' | 'reject'; // Action à effectuer
  priority: number;                          // Priorité de la règle
  description: string;                       // Description de la règle
}

// ===== TYPES POUR LES MÉTRIQUES ET STATISTIQUES =====

export interface ConflictMetrics {
  totalConflicts: number;                    // Nombre total de conflits
  resolvedConflicts: number;                 // Conflits résolus
  pendingConflicts: number;                  // Conflits en attente
  escalatedConflicts: number;                // Conflits escaladés
  failedResolutions: number;                 // Résolutions échouées
  
  byType: Record<ConflictType, number>;      // Conflits par type
  bySeverity: Record<ConflictSeverity, number>; // Conflits par gravité
  byEntityType: Record<string, number>;      // Conflits par type d'entité
  byStrategy: Record<ConflictResolutionStrategy, number>; // Résolutions par stratégie
  
  averageResolutionTime: number;             // Temps moyen de résolution (ms)
  resolutionSuccessRate: number;             // Taux de succès des résolutions
  automaticResolutionRate: number;           // Taux de résolution automatique
  
  lastUpdated: string;                       // ISO 8601 - Dernière mise à jour
}

export interface ConflictReport {
  period: {
    start: string;                           // ISO 8601
    end: string;                             // ISO 8601
  };
  summary: ConflictMetrics;                  // Résumé des métriques
  trends: {
    conflictsOverTime: Array<{ date: string; count: number }>;
    resolutionTimeOverTime: Array<{ date: string; avgTime: number }>;
    successRateOverTime: Array<{ date: string; rate: number }>;
  };
  topConflicts: {
    byEntityType: Array<{ entityType: string; count: number }>;
    byConflictType: Array<{ conflictType: ConflictType; count: number }>;
    bySeverity: Array<{ severity: ConflictSeverity; count: number }>;
  };
  recommendations: string[];                 // Recommandations d'amélioration
}

// ===== TYPES POUR LA GESTION DES CONFLITS =====

export interface ConflictManager {
  // Gestion des conflits
  detectConflicts(clientData: any, serverData: any, entityType: string): Conflict[];
  resolveConflict(conflict: Conflict, strategy: ConflictResolutionStrategy): ConflictResolution;
  resolveConflicts(conflicts: Conflict[]): ConflictResolution[];
  
  // Configuration
  addResolutionRule(rule: ConflictResolutionRule): void;
  removeResolutionRule(ruleId: string): void;
  updateResolutionRule(rule: ConflictResolutionRule): void;
  getResolutionRules(): ConflictResolutionRule[];
  
  // Métriques
  getMetrics(): ConflictMetrics;
  generateReport(period: { start: string; end: string }): ConflictReport;
  
  // Historique
  getConflictHistory(entityId: string): Conflict[];
  getResolvedConflicts(): Conflict[];
  getPendingConflicts(): Conflict[];
}

// ===== TYPES POUR LES ÉVÉNEMENTS =====

export interface ConflictEvent {
  type: 'conflict_detected' | 'conflict_resolved' | 'conflict_escalated' | 'conflict_failed';
  timestamp: string;                         // ISO 8601
  conflictId: string;
  entityType: string;
  entityId: string;
  conflictType: ConflictType;
  severity: ConflictSeverity;
  data?: any;                                // Données additionnelles
}

export type ConflictEventListener = (event: ConflictEvent) => void;

// ===== TYPES POUR LA CONFIGURATION =====

export interface ConflictConfig {
  // Stratégies par défaut
  defaultStrategy: ConflictResolutionStrategy;
  strategiesByType: Record<ConflictType, ConflictResolutionStrategy>;
  strategiesByEntity: Record<string, ConflictResolutionStrategy>;
  
  // Seuils et limites
  maxConflictsPerSync: number;               // Nombre max de conflits par sync
  conflictTimeout: number;                   // Timeout pour résolution (ms)
  escalationThreshold: number;               // Seuil d'escalade (nombre de conflits)
  
  // Auto-résolution
  enableAutoResolution: boolean;             // Activer la résolution automatique
  autoResolutionConfidence: number;          // Confiance minimale pour auto-résolution
  enableBusinessRules: boolean;              // Activer les règles métier
  
  // Notifications
  enableNotifications: boolean;              // Activer les notifications
  notifyOnEscalation: boolean;               // Notifier en cas d'escalade
  notifyOnFailure: boolean;                  // Notifier en cas d'échec
  
  // Persistance
  persistConflicts: boolean;                 // Persister les conflits
  conflictRetentionDays: number;             // Rétention des conflits (jours)
  enableConflictHistory: boolean;            // Activer l'historique
}

// ===== CONFIGURATIONS PRÉDÉFINIES =====

export const DEFAULT_CONFLICT_CONFIG: ConflictConfig = {
  defaultStrategy: ConflictResolutionStrategy.LAST_WRITE_WINS,
  strategiesByType: {
    [ConflictType.UPDATE_UPDATE]: ConflictResolutionStrategy.LAST_WRITE_WINS,
    [ConflictType.UPDATE_DELETE]: ConflictResolutionStrategy.MANUAL_RESOLUTION,
    [ConflictType.DELETE_UPDATE]: ConflictResolutionStrategy.MANUAL_RESOLUTION,
    [ConflictType.CREATE_CREATE]: ConflictResolutionStrategy.LAST_WRITE_WINS,
    [ConflictType.VERSION_CONFLICT]: ConflictResolutionStrategy.LAST_WRITE_WINS,
    [ConflictType.CONSTRAINT_VIOLATION]: ConflictResolutionStrategy.MANUAL_RESOLUTION,
    [ConflictType.DATA_INCONSISTENCY]: ConflictResolutionStrategy.MANUAL_RESOLUTION
  },
  strategiesByEntity: {
    'product': ConflictResolutionStrategy.LAST_WRITE_WINS,
    'sale': ConflictResolutionStrategy.LAST_WRITE_WINS,
    'stock_movement': ConflictResolutionStrategy.BUSINESS_RULES
  },
  maxConflictsPerSync: 50,
  conflictTimeout: 30000,                    // 30 secondes
  escalationThreshold: 10,
  enableAutoResolution: true,
  autoResolutionConfidence: 0.8,
  enableBusinessRules: true,
  enableNotifications: true,
  notifyOnEscalation: true,
  notifyOnFailure: true,
  persistConflicts: true,
  conflictRetentionDays: 30,
  enableConflictHistory: true
};

export const AGGRESSIVE_CONFLICT_CONFIG: ConflictConfig = {
  ...DEFAULT_CONFLICT_CONFIG,
  defaultStrategy: ConflictResolutionStrategy.CLIENT_WINS,
  enableAutoResolution: true,
  autoResolutionConfidence: 0.6,
  maxConflictsPerSync: 100
};

export const CONSERVATIVE_CONFLICT_CONFIG: ConflictConfig = {
  ...DEFAULT_CONFLICT_CONFIG,
  defaultStrategy: ConflictResolutionStrategy.MANUAL_RESOLUTION,
  enableAutoResolution: false,
  escalationThreshold: 5,
  maxConflictsPerSync: 20
};

// ===== TYPES UTILITAIRES =====

export interface ConflictContext {
  userId?: string;
  deviceId?: string;
  syncSessionId?: string;
  timestamp: string;                         // ISO 8601
  metadata: Record<string, any>;
}

export interface ConflictValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ConflictResolutionResult {
  success: boolean;
  resolution: ConflictResolution | null;
  error?: string;
  confidence: number;
  requiresApproval: boolean;
}

// ===== TYPES POUR LES MERGEURS PERSONNALISÉS =====

export interface CustomMerger {
  name: string;
  version: string;
  supportedFields: string[];
  merge(clientValue: any, serverValue: any, context: ConflictContext): any;
  validate(data: any): boolean;
  getConfidence(clientValue: any, serverValue: any): number;
}

export interface FieldMerger {
  fieldName: string;
  merger: CustomMerger;
  priority: number;
  isRequired: boolean;
}

// ===== TYPES POUR LA RÉSOLUTION INTELLIGENTE =====

export interface IntelligentResolver {
  name: string;
  version: string;
  analyze(conflict: Conflict): ConflictAnalysis;
  resolve(conflict: Conflict, analysis: ConflictAnalysis): ConflictResolutionResult;
  learn(resolution: ConflictResolution, feedback: 'success' | 'failure'): void;
  getConfidence(conflict: Conflict): number;
}

export interface ConflictLearningData {
  conflictId: string;
  resolution: ConflictResolution;
  feedback: 'success' | 'failure';
  timestamp: string;                         // ISO 8601
  context: ConflictContext;
}

