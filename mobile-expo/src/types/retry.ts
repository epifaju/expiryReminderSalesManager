/**
 * Types TypeScript pour la logique de retry avec backoff exponentiel
 * Configuration et gestion des tentatives de retry
 */

// ===== TYPES DE BASE =====

export enum RetryStrategy {
  EXPONENTIAL = 'exponential',
  LINEAR = 'linear',
  FIXED = 'fixed',
  CUSTOM = 'custom'
}

export enum RetryReason {
  NETWORK_ERROR = 'network_error',
  SERVER_ERROR = 'server_error',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  AUTHENTICATION_ERROR = 'authentication_error',
  VALIDATION_ERROR = 'validation_error',
  CONFLICT = 'conflict',
  UNKNOWN = 'unknown'
}

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  strategy: RetryStrategy;
  jitter: boolean;
  backoffMultiplier: number;
  timeoutMs?: number;
  retryableErrors: RetryReason[];
  customDelays?: number[];
}

export interface RetryAttempt {
  attemptNumber: number;
  timestamp: string; // ISO 8601
  delayMs: number;
  reason: RetryReason;
  error: Error;
  nextAttemptAt?: string; // ISO 8601
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: RetryAttempt[];
  totalTimeMs: number;
  finalAttempt: number;
  strategy: RetryStrategy;
}

// ===== CONFIGURATIONS PRÉDÉFINIES =====

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  strategy: RetryStrategy.EXPONENTIAL,
  jitter: true,
  backoffMultiplier: 2,
  timeoutMs: 30000,
  retryableErrors: [
    RetryReason.NETWORK_ERROR,
    RetryReason.SERVER_ERROR,
    RetryReason.TIMEOUT,
    RetryReason.RATE_LIMIT
  ]
};

export const AGGRESSIVE_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelayMs: 500,
  maxDelayMs: 60000,
  strategy: RetryStrategy.EXPONENTIAL,
  jitter: true,
  backoffMultiplier: 2.5,
  timeoutMs: 60000,
  retryableErrors: [
    RetryReason.NETWORK_ERROR,
    RetryReason.SERVER_ERROR,
    RetryReason.TIMEOUT,
    RetryReason.RATE_LIMIT,
    RetryReason.AUTHENTICATION_ERROR
  ]
};

export const CONSERVATIVE_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelayMs: 2000,
  maxDelayMs: 15000,
  strategy: RetryStrategy.LINEAR,
  jitter: false,
  backoffMultiplier: 1.5,
  timeoutMs: 15000,
  retryableErrors: [
    RetryReason.NETWORK_ERROR,
    RetryReason.TIMEOUT
  ]
};

export const SYNC_RETRY_CONFIG: RetryConfig = {
  maxRetries: 4,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  strategy: RetryStrategy.EXPONENTIAL,
  jitter: true,
  backoffMultiplier: 2,
  timeoutMs: 30000,
  retryableErrors: [
    RetryReason.NETWORK_ERROR,
    RetryReason.SERVER_ERROR,
    RetryReason.TIMEOUT,
    RetryReason.RATE_LIMIT
  ]
};

// ===== TYPES POUR LA GESTION DES ERREURS =====

export interface RetryableError extends Error {
  retryable: boolean;
  reason: RetryReason;
  statusCode?: number;
  retryAfter?: number; // seconds
}

export interface NetworkError extends RetryableError {
  type: 'NETWORK_ERROR';
  isTimeout: boolean;
  isOffline: boolean;
}

export interface ServerError extends RetryableError {
  type: 'SERVER_ERROR';
  statusCode: number;
  response?: any;
}

export interface RateLimitError extends RetryableError {
  type: 'RATE_LIMIT';
  retryAfter: number;
  limit: number;
  remaining: number;
}

// ===== TYPES POUR LES MÉTRIQUES =====

export interface RetryMetrics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  averageDelayMs: number;
  totalTimeMs: number;
  mostCommonReason: RetryReason;
  successRate: number;
  lastRetryAt?: string; // ISO 8601
}

export interface RetryStats {
  config: RetryConfig;
  metrics: RetryMetrics;
  recentAttempts: RetryAttempt[];
  isCurrentlyRetrying: boolean;
}

// ===== TYPES POUR LES ÉVÉNEMENTS =====

export interface RetryEvent {
  type: 'retry_started' | 'retry_attempt' | 'retry_success' | 'retry_failed' | 'retry_gave_up';
  timestamp: string; // ISO 8601
  attemptNumber: number;
  reason: RetryReason;
  delayMs: number;
  error?: Error;
  data?: any;
}

export type RetryEventListener = (event: RetryEvent) => void;

// ===== TYPES POUR LA CONFIGURATION AVANCÉE =====

export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  recoveryTimeoutMs: number;
  monitoringPeriodMs: number;
}

export interface RetryPolicy {
  name: string;
  config: RetryConfig;
  circuitBreaker?: CircuitBreakerConfig;
  conditions?: RetryCondition[];
}

export interface RetryCondition {
  type: 'error_type' | 'status_code' | 'response_time' | 'custom';
  condition: any;
  action: 'retry' | 'skip' | 'abort';
}

// ===== TYPES POUR LA PERSISTANCE =====

export interface RetrySession {
  sessionId: string;
  startTime: string; // ISO 8601
  endTime?: string; // ISO 8601
  operation: string;
  config: RetryConfig;
  attempts: RetryAttempt[];
  result?: RetryResult<any>;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
}

export interface RetryHistory {
  sessions: RetrySession[];
  totalSessions: number;
  successfulSessions: number;
  failedSessions: number;
  averageRetriesPerSession: number;
  lastSessionAt?: string; // ISO 8601
}

// ===== TYPES UTILITAIRES =====

export interface RetryOptions {
  config?: Partial<RetryConfig>;
  timeout?: number;
  abortSignal?: AbortSignal;
  onAttempt?: (attempt: RetryAttempt) => void;
  onSuccess?: (result: any, attempts: RetryAttempt[]) => void;
  onFailure?: (error: Error, attempts: RetryAttempt[]) => void;
}

export interface RetryContext {
  operation: string;
  startTime: number;
  attempts: RetryAttempt[];
  config: RetryConfig;
  abortSignal?: AbortSignal;
}

// ===== TYPES POUR LA VALIDATION =====

export interface RetryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ===== TYPES POUR LA MONITORING =====

export interface RetryHealthCheck {
  isHealthy: boolean;
  lastSuccessAt?: string; // ISO 8601
  lastFailureAt?: string; // ISO 8601
  consecutiveFailures: number;
  averageRetryTime: number;
  errorRate: number;
  recommendations: string[];
}

export interface RetryReport {
  period: {
    start: string; // ISO 8601
    end: string; // ISO 8601
  };
  summary: {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    totalRetries: number;
    averageRetriesPerOperation: number;
    successRate: number;
  };
  breakdown: {
    byReason: Record<RetryReason, number>;
    byStrategy: Record<RetryStrategy, number>;
    byOperation: Record<string, number>;
  };
  trends: {
    successRateOverTime: Array<{ date: string; rate: number }>;
    retryCountOverTime: Array<{ date: string; count: number }>;
  };
}

