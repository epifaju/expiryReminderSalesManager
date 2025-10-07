/**
 * Types TypeScript pour le système de monitoring et d'observabilité
 * 
 * Ce fichier définit tous les types nécessaires pour :
 * - Collecte et agrégation de métriques
 * - Logs structurés et traces
 * - Alertes et notifications
 * - Rapports et tableaux de bord
 * - Observabilité distribuée
 */

// ============================================================================
// Types de base pour les métriques
// ============================================================================

/**
 * Types de métriques supportées
 */
export enum MetricType {
  COUNTER = 'counter',           // Compteur incrémental
  GAUGE = 'gauge',               // Valeur instantanée
  HISTOGRAM = 'histogram',       // Distribution de valeurs
  TIMER = 'timer',               // Mesure de temps
  RATE = 'rate',                 // Taux par unité de temps
  PERCENTAGE = 'percentage',     // Pourcentage
  CUSTOM = 'custom',             // Métrique personnalisée
}

/**
 * Catégories de métriques
 */
export enum MetricCategory {
  PERFORMANCE = 'performance',   // Performances système
  SYNC = 'sync',                 // Synchronisation
  NETWORK = 'network',           // Réseau
  STORAGE = 'storage',           // Stockage
  ERROR = 'error',               // Erreurs
  BUSINESS = 'business',         // Métriques métier
  USER = 'user',                 // Activité utilisateur
  SYSTEM = 'system',             // Système
}

/**
 * Niveaux de sévérité
 */
export enum SeverityLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Métrique de base
 */
export interface Metric {
  id: string;
  name: string;
  type: MetricType;
  category: MetricCategory;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Métrique agrégée
 */
export interface AggregatedMetric {
  name: string;
  type: MetricType;
  category: MetricCategory;
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  p50?: number;  // 50e percentile (médiane)
  p95?: number;  // 95e percentile
  p99?: number;  // 99e percentile
  unit?: string;
  period: TimePeriod;
  timestamp: string;
}

/**
 * Période de temps pour l'agrégation
 */
export interface TimePeriod {
  start: string;
  end: string;
  duration: number;  // en millisecondes
  label?: string;    // '1h', '24h', '7d', etc.
}

// ============================================================================
// Types pour l'observabilité
// ============================================================================

/**
 * Niveau de log
 */
export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Entrée de log structurée
 */
export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  context?: LogContext;
  error?: ErrorDetails;
  metadata?: Record<string, any>;
  tags?: string[];
}

/**
 * Contexte de log
 */
export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  deviceId?: string;
  operationId?: string;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
}

/**
 * Détails d'erreur
 */
export interface ErrorDetails {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  statusCode?: number;
  cause?: any;
}

/**
 * Trace distribuée
 */
export interface Trace {
  traceId: string;
  spans: Span[];
  duration: number;
  status: TraceStatus;
  startTime: string;
  endTime: string;
  metadata?: Record<string, any>;
}

/**
 * Span dans une trace
 */
export interface Span {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  name: string;
  service: string;
  operation: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: SpanStatus;
  tags?: Record<string, string>;
  logs?: SpanLog[];
  error?: ErrorDetails;
}

/**
 * Log dans un span
 */
export interface SpanLog {
  timestamp: string;
  fields: Record<string, any>;
}

/**
 * Statut d'une trace
 */
export enum TraceStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled',
}

/**
 * Statut d'un span
 */
export enum SpanStatus {
  OK = 'ok',
  ERROR = 'error',
  UNSET = 'unset',
}

// ============================================================================
// Types pour les alertes
// ============================================================================

/**
 * Type d'alerte
 */
export enum AlertType {
  THRESHOLD = 'threshold',       // Seuil dépassé
  ANOMALY = 'anomaly',           // Anomalie détectée
  ERROR_RATE = 'error_rate',     // Taux d'erreur élevé
  LATENCY = 'latency',           // Latence élevée
  CUSTOM = 'custom',             // Alerte personnalisée
}

/**
 * Sévérité d'alerte
 */
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Statut d'alerte
 */
export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  SUPPRESSED = 'suppressed',
}

/**
 * Alerte
 */
export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  metric?: string;
  threshold?: number;
  currentValue?: number;
  triggeredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  metadata?: Record<string, any>;
}

/**
 * Règle d'alerte
 */
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: AlertType;
  severity: AlertSeverity;
  metric: string;
  condition: AlertCondition;
  isActive: boolean;
  cooldownMs?: number;  // Délai avant réémission
  createdAt: string;
  updatedAt: string;
}

/**
 * Condition d'alerte
 */
export interface AlertCondition {
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  threshold: number;
  window?: number;      // Fenêtre de temps en ms
  occurrences?: number; // Nombre d'occurrences
}

// ============================================================================
// Types pour les événements
// ============================================================================

/**
 * Type d'événement
 */
export enum EventType {
  METRIC_COLLECTED = 'metric_collected',
  METRIC_AGGREGATED = 'metric_aggregated',
  ALERT_TRIGGERED = 'alert_triggered',
  ALERT_RESOLVED = 'alert_resolved',
  TRACE_STARTED = 'trace_started',
  TRACE_COMPLETED = 'trace_completed',
  LOG_ENTRY = 'log_entry',
  HEALTH_CHECK = 'health_check',
  CUSTOM = 'custom',
}

/**
 * Événement de monitoring
 */
export interface MonitoringEvent {
  id: string;
  type: EventType;
  timestamp: string;
  data: any;
  context?: LogContext;
  metadata?: Record<string, any>;
}

/**
 * Listener d'événements
 */
export type MonitoringEventListener = (event: MonitoringEvent) => void;

// ============================================================================
// Types pour les rapports
// ============================================================================

/**
 * Type de rapport
 */
export enum ReportType {
  PERFORMANCE = 'performance',
  SYNC = 'sync',
  ERROR = 'error',
  HEALTH = 'health',
  CUSTOM = 'custom',
}

/**
 * Rapport de monitoring
 */
export interface MonitoringReport {
  id: string;
  type: ReportType;
  title: string;
  period: TimePeriod;
  generatedAt: string;
  summary: ReportSummary;
  metrics: AggregatedMetric[];
  alerts?: Alert[];
  recommendations?: string[];
  metadata?: Record<string, any>;
}

/**
 * Résumé de rapport
 */
export interface ReportSummary {
  totalMetrics: number;
  totalAlerts: number;
  criticalAlerts: number;
  healthScore: number;  // 0-100
  trends: Trend[];
  topIssues?: string[];
}

/**
 * Tendance
 */
export interface Trend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  change: number;       // Pourcentage de changement
  significance: 'high' | 'medium' | 'low';
}

// ============================================================================
// Types pour la santé du système
// ============================================================================

/**
 * Statut de santé
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown',
}

/**
 * Vérification de santé
 */
export interface HealthCheck {
  service: string;
  status: HealthStatus;
  timestamp: string;
  checks: ComponentHealth[];
  metadata?: Record<string, any>;
}

/**
 * Santé d'un composant
 */
export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  message?: string;
  metrics?: Record<string, number>;
  lastCheck: string;
}

// ============================================================================
// Types de configuration
// ============================================================================

/**
 * Configuration du monitoring
 */
export interface MonitoringConfig {
  enabled: boolean;
  collectInterval: number;         // Intervalle de collecte (ms)
  aggregationInterval: number;     // Intervalle d'agrégation (ms)
  retentionDays: number;           // Durée de rétention des données
  maxMetricsPerBatch: number;      // Nombre max de métriques par batch
  enableTracing: boolean;          // Activer les traces
  enableAlerts: boolean;           // Activer les alertes
  logLevel: LogLevel;              // Niveau de log minimum
  samplingRate?: number;           // Taux d'échantillonnage (0-1)
  exportEndpoint?: string;         // Endpoint pour export externe
}

/**
 * Statistiques de monitoring
 */
export interface MonitoringStats {
  totalMetrics: number;
  totalLogs: number;
  totalTraces: number;
  totalAlerts: number;
  activeAlerts: number;
  storageUsed: number;             // Octets utilisés
  collectionRate: number;          // Métriques/seconde
  errorRate: number;               // Taux d'erreur
  lastCollectionTime?: string;
  uptime: number;                  // Durée depuis démarrage (ms)
}

/**
 * Contexte de monitoring
 */
export interface MonitoringContext {
  sessionId: string;
  userId?: string;
  deviceId?: string;
  appVersion?: string;
  environment?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Types pour le tableau de bord
// ============================================================================

/**
 * Configuration du tableau de bord
 */
export interface DashboardConfig {
  refreshInterval: number;         // Intervalle de rafraîchissement (ms)
  timeRange: TimePeriod;           // Plage de temps affichée
  widgets: DashboardWidget[];      // Widgets à afficher
}

/**
 * Type de widget
 */
export enum WidgetType {
  METRIC_CARD = 'metric_card',
  LINE_CHART = 'line_chart',
  BAR_CHART = 'bar_chart',
  PIE_CHART = 'pie_chart',
  TABLE = 'table',
  ALERT_LIST = 'alert_list',
  HEALTH_STATUS = 'health_status',
  CUSTOM = 'custom',
}

/**
 * Widget de tableau de bord
 */
export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  metrics: string[];               // Noms des métriques à afficher
  size: WidgetSize;
  position: WidgetPosition;
  config?: Record<string, any>;
}

/**
 * Taille de widget
 */
export interface WidgetSize {
  width: number;  // 1-12 (grid system)
  height: number; // en pixels ou grid units
}

/**
 * Position de widget
 */
export interface WidgetPosition {
  x: number;
  y: number;
}

// ============================================================================
// Types d'export
// ============================================================================

/**
 * Format d'export
 */
export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  PROMETHEUS = 'prometheus',
  OPENTELEMETRY = 'opentelemetry',
}

/**
 * Résultat d'export
 */
export interface ExportResult {
  success: boolean;
  format: ExportFormat;
  data?: any;
  error?: string;
  exportedAt: string;
  recordCount: number;
}

// ============================================================================
// Configurations prédéfinies
// ============================================================================

/**
 * Configuration par défaut
 */
export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  enabled: true,
  collectInterval: 5000,           // 5 secondes
  aggregationInterval: 60000,      // 1 minute
  retentionDays: 7,
  maxMetricsPerBatch: 100,
  enableTracing: true,
  enableAlerts: true,
  logLevel: LogLevel.INFO,
  samplingRate: 1.0,               // 100% par défaut
};

/**
 * Configuration de développement
 */
export const DEV_MONITORING_CONFIG: MonitoringConfig = {
  ...DEFAULT_MONITORING_CONFIG,
  collectInterval: 1000,           // 1 seconde (plus fréquent)
  logLevel: LogLevel.DEBUG,
  samplingRate: 1.0,               // Tout capturer en dev
};

/**
 * Configuration de production
 */
export const PROD_MONITORING_CONFIG: MonitoringConfig = {
  ...DEFAULT_MONITORING_CONFIG,
  collectInterval: 30000,          // 30 secondes
  retentionDays: 30,
  logLevel: LogLevel.WARN,
  samplingRate: 0.1,               // 10% en production
};

// ============================================================================
// Types utilitaires
// ============================================================================

/**
 * Filtre de métriques
 */
export interface MetricFilter {
  categories?: MetricCategory[];
  types?: MetricType[];
  names?: string[];
  period?: TimePeriod;
  tags?: Record<string, string>;
}

/**
 * Options de requête
 */
export interface QueryOptions {
  filter?: MetricFilter;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Résultat de requête
 */
export interface QueryResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
}

/**
 * Interface du service de monitoring
 */
export interface IMonitoringService {
  initialize(config?: Partial<MonitoringConfig>): Promise<void>;
  collectMetric(metric: Omit<Metric, 'id' | 'timestamp'>): void;
  getMetrics(options?: QueryOptions): Promise<QueryResult<Metric>>;
  getAggregatedMetrics(period: TimePeriod, filter?: MetricFilter): Promise<AggregatedMetric[]>;
  startTrace(name: string, context?: LogContext): Trace;
  endTrace(traceId: string): void;
  log(level: LogLevel, message: string, context?: LogContext, metadata?: Record<string, any>): void;
  createAlert(alert: Omit<Alert, 'id' | 'triggeredAt'>): Alert;
  getAlerts(status?: AlertStatus): Alert[];
  generateReport(type: ReportType, period: TimePeriod): Promise<MonitoringReport>;
  healthCheck(): Promise<HealthCheck>;
  getStats(): MonitoringStats;
}

/**
 * Interface du service d'observabilité
 */
export interface IObservabilityService {
  trace<T>(name: string, fn: () => Promise<T>, context?: LogContext): Promise<T>;
  log(level: LogLevel, message: string, context?: LogContext): void;
  setContext(context: Partial<LogContext>): void;
  getContext(): LogContext;
  createSpan(name: string, parentSpan?: Span): Span;
  endSpan(span: Span, status?: SpanStatus, error?: ErrorDetails): void;
}

