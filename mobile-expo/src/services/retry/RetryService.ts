/**
 * Service de retry avec backoff exponentiel
 * Gère les tentatives de retry avec différentes stratégies
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  RetryConfig,
  RetryResult,
  RetryAttempt,
  RetryReason,
  RetryStrategy,
  RetryEvent,
  RetryEventListener,
  RetryOptions,
  RetryContext,
  RetryMetrics,
  RetryStats,
  RetrySession,
  RetryHistory,
  RetryableError,
  NetworkError,
  ServerError,
  RateLimitError,
  DEFAULT_RETRY_CONFIG,
  AGGRESSIVE_RETRY_CONFIG,
  CONSERVATIVE_RETRY_CONFIG,
  SYNC_RETRY_CONFIG
} from '../../types/retry';

/**
 * Service de retry singleton
 * Gère les tentatives de retry avec backoff exponentiel et différentes stratégies
 */
class RetryService {
  private static instance: RetryService;
  private isInitialized = false;
  private eventListeners: RetryEventListener[] = [];
  private activeSessions: Map<string, RetrySession> = new Map();
  private metrics: RetryMetrics = {
    totalAttempts: 0,
    successfulAttempts: 0,
    failedAttempts: 0,
    averageDelayMs: 0,
    totalTimeMs: 0,
    mostCommonReason: RetryReason.UNKNOWN,
    successRate: 0
  };

  /**
   * Constructeur privé pour le pattern singleton
   */
  private constructor() {}

  /**
   * Obtient l'instance singleton du service
   */
  public static getInstance(): RetryService {
    if (!RetryService.instance) {
      RetryService.instance = new RetryService();
    }
    return RetryService.instance;
  }

  /**
   * Initialise le service de retry
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[RETRY_SERVICE] Service déjà initialisé');
      return;
    }

    console.log('[RETRY_SERVICE] Initialisation du service de retry...');
    
    try {
      // Charger les métriques depuis AsyncStorage
      await this.loadMetrics();
      
      this.isInitialized = true;
      
      console.log('[RETRY_SERVICE] Service initialisé avec succès');
      console.log('[RETRY_SERVICE] Métriques chargées:', this.metrics);
      
      this.emitEvent({
        type: 'retry_started',
        timestamp: new Date().toISOString(),
        attemptNumber: 0,
        reason: RetryReason.UNKNOWN,
        delayMs: 0,
        data: { action: 'service_initialized' }
      });
      
    } catch (error) {
      console.error('[RETRY_SERVICE] Erreur initialisation:', error);
      throw error;
    }
  }

  /**
   * Exécute une opération avec retry automatique
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    if (!this.isInitialized) {
      throw new Error('Service de retry non initialisé');
    }

    const config = this.mergeConfig(options.config);
    const context: RetryContext = {
      operation: options.config?.retryableErrors ? 'custom_operation' : 'default_operation',
      startTime: Date.now(),
      attempts: [],
      config,
      abortSignal: options.abortSignal
    };

    const sessionId = this.generateSessionId();
    const session: RetrySession = {
      sessionId,
      startTime: new Date().toISOString(),
      operation: context.operation,
      config,
      attempts: [],
      status: 'active'
    };

    this.activeSessions.set(sessionId, session);

    console.log(`[RETRY_SERVICE] Début retry pour opération: ${context.operation}`);
    console.log(`[RETRY_SERVICE] Configuration:`, config);

    try {
      const result = await this.executeWithRetryInternal(operation, context, options);
      
      // Mise à jour de la session
      session.status = 'completed';
      session.endTime = new Date().toISOString();
      session.result = result;
      session.attempts = context.attempts;

      // Mise à jour des métriques
      await this.updateMetrics(result, context.attempts);

      // Sauvegarde de la session
      await this.saveSession(session);

      console.log(`[RETRY_SERVICE] Retry réussi après ${context.attempts.length} tentatives`);
      return result;

    } catch (error) {
      // Mise à jour de la session en cas d'échec
      session.status = 'failed';
      session.endTime = new Date().toISOString();
      session.attempts = context.attempts;

      // Mise à jour des métriques
      await this.updateMetrics(null, context.attempts);

      // Sauvegarde de la session
      await this.saveSession(session);

      console.error(`[RETRY_SERVICE] Retry échoué après ${context.attempts.length} tentatives:`, error);
      throw error;
    } finally {
      this.activeSessions.delete(sessionId);
    }
  }

  /**
   * Exécute une opération de synchronisation avec retry spécialisé
   */
  public async executeSyncWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const syncOptions: RetryOptions = {
      ...options,
      config: {
        ...SYNC_RETRY_CONFIG,
        ...options.config
      }
    };

    return this.executeWithRetry(operation, syncOptions);
  }

  /**
   * Exécute une opération réseau avec retry agressif
   */
  public async executeNetworkWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const networkOptions: RetryOptions = {
      ...options,
      config: {
        ...AGGRESSIVE_RETRY_CONFIG,
        ...options.config
      }
    };

    return this.executeWithRetry(operation, networkOptions);
  }

  /**
   * Exécute une opération critique avec retry conservateur
   */
  public async executeCriticalWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const criticalOptions: RetryOptions = {
      ...options,
      config: {
        ...CONSERVATIVE_RETRY_CONFIG,
        ...options.config
      }
    };

    return this.executeWithRetry(operation, criticalOptions);
  }

  /**
   * Obtient les statistiques de retry
   */
  public getStats(): RetryStats {
    return {
      config: DEFAULT_RETRY_CONFIG,
      metrics: this.metrics,
      recentAttempts: this.getRecentAttempts(),
      isCurrentlyRetrying: this.activeSessions.size > 0
    };
  }

  /**
   * Obtient l'historique des retries
   */
  public async getHistory(): Promise<RetryHistory> {
    try {
      const data = await AsyncStorage.getItem('retry_history');
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('[RETRY_SERVICE] Erreur chargement historique:', error);
    }

    return {
      sessions: [],
      totalSessions: 0,
      successfulSessions: 0,
      failedSessions: 0,
      averageRetriesPerSession: 0
    };
  }

  /**
   * Nettoie l'historique des retries
   */
  public async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem('retry_history');
      await AsyncStorage.removeItem('retry_metrics');
      this.metrics = {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        averageDelayMs: 0,
        totalTimeMs: 0,
        mostCommonReason: RetryReason.UNKNOWN,
        successRate: 0
      };
      console.log('[RETRY_SERVICE] Historique nettoyé');
    } catch (error) {
      console.error('[RETRY_SERVICE] Erreur nettoyage historique:', error);
    }
  }

  /**
   * Ajoute un listener d'événements
   */
  public addEventListener(listener: RetryEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * Supprime un listener d'événements
   */
  public removeEventListener(listener: RetryEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Nettoie les ressources du service
   */
  public async cleanup(): Promise<void> {
    console.log('[RETRY_SERVICE] Nettoyage du service');
    this.eventListeners = [];
    this.activeSessions.clear();
    this.isInitialized = false;
  }

  // ===== MÉTHODES PRIVÉES =====

  /**
   * Exécute l'opération avec retry interne
   */
  private async executeWithRetryInternal<T>(
    operation: () => Promise<T>,
    context: RetryContext,
    options: RetryOptions
  ): Promise<RetryResult<T>> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= context.config.maxRetries; attempt++) {
      try {
        console.log(`[RETRY_SERVICE] Tentative ${attempt}/${context.config.maxRetries}`);

        // Vérifier si l'opération a été annulée
        if (context.abortSignal?.aborted) {
          throw new Error('Opération annulée par l\'utilisateur');
        }

        // Exécuter l'opération avec timeout
        const result = await this.executeWithTimeout(operation, context.config.timeoutMs);

        // Succès
        const totalTime = Date.now() - context.startTime;
        const retryResult: RetryResult<T> = {
          success: true,
          data: result,
          attempts: context.attempts,
          totalTimeMs: totalTime,
          finalAttempt: attempt,
          strategy: context.config.strategy
        };

        // Appel du callback de succès
        if (options.onSuccess) {
          options.onSuccess(result, context.attempts);
        }

        // Émission d'événement de succès
        this.emitEvent({
          type: 'retry_success',
          timestamp: new Date().toISOString(),
          attemptNumber: attempt,
          reason: RetryReason.UNKNOWN,
          delayMs: 0,
          data: result
        });

        return retryResult;

      } catch (error) {
        lastError = error as Error;
        console.error(`[RETRY_SERVICE] Tentative ${attempt} échouée:`, error);

        // Analyser l'erreur
        const retryReason = this.analyzeError(error as Error);
        const isRetryable = this.isRetryableError(error as Error, context.config);

        // Créer l'enregistrement de tentative
        const retryAttempt: RetryAttempt = {
          attemptNumber: attempt,
          timestamp: new Date().toISOString(),
          delayMs: 0,
          reason: retryReason,
          error: error as Error
        };

        // Ajouter à l'historique
        context.attempts.push(retryAttempt);

        // Appel du callback de tentative
        if (options.onAttempt) {
          options.onAttempt(retryAttempt);
        }

        // Émission d'événement de tentative
        this.emitEvent({
          type: 'retry_attempt',
          timestamp: new Date().toISOString(),
          attemptNumber: attempt,
          reason: retryReason,
          delayMs: 0,
          error: error as Error
        });

        // Vérifier si on peut retry
        if (!isRetryable || attempt === context.config.maxRetries) {
          // Dernière tentative ou erreur non retryable
          const totalTime = Date.now() - context.startTime;
          const retryResult: RetryResult<T> = {
            success: false,
            error: error as Error,
            attempts: context.attempts,
            totalTimeMs: totalTime,
            finalAttempt: attempt,
            strategy: context.config.strategy
          };

          // Appel du callback d'échec
          if (options.onFailure) {
            options.onFailure(error as Error, context.attempts);
          }

          // Émission d'événement d'échec
          this.emitEvent({
            type: 'retry_failed',
            timestamp: new Date().toISOString(),
            attemptNumber: attempt,
            reason: retryReason,
            delayMs: 0,
            error: error as Error
          });

          throw error;
        }

        // Calculer le délai pour la prochaine tentative
        const delayMs = this.calculateDelay(attempt, context.config, retryReason);
        retryAttempt.delayMs = delayMs;
        retryAttempt.nextAttemptAt = new Date(Date.now() + delayMs).toISOString();

        console.log(`[RETRY_SERVICE] Prochaine tentative dans ${delayMs}ms`);

        // Attendre le délai
        await this.delay(delayMs);
      }
    }

    // Ne devrait jamais arriver ici
    throw lastError || new Error('Erreur inconnue lors du retry');
  }

  /**
   * Exécute une opération avec timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs?: number
  ): Promise<T> {
    if (!timeoutMs) {
      return operation();
    }

    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Opération timeout après ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  }

  /**
   * Calcule le délai pour la prochaine tentative
   */
  private calculateDelay(attempt: number, config: RetryConfig, reason: RetryReason): number {
    let delayMs: number;

    switch (config.strategy) {
      case RetryStrategy.EXPONENTIAL:
        delayMs = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
        break;
      case RetryStrategy.LINEAR:
        delayMs = config.baseDelayMs * attempt;
        break;
      case RetryStrategy.FIXED:
        delayMs = config.baseDelayMs;
        break;
      case RetryStrategy.CUSTOM:
        delayMs = config.customDelays?.[attempt - 1] || config.baseDelayMs;
        break;
      default:
        delayMs = config.baseDelayMs;
    }

    // Appliquer la limite maximale
    delayMs = Math.min(delayMs, config.maxDelayMs);

    // Ajouter du jitter si activé
    if (config.jitter) {
      const jitterRange = delayMs * 0.1; // 10% de jitter
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delayMs = Math.max(0, delayMs + jitter);
    }

    // Gestion spéciale pour rate limiting
    if (reason === RetryReason.RATE_LIMIT) {
      // Utiliser le retry-after du serveur si disponible
      // Sinon utiliser un délai plus long
      delayMs = Math.max(delayMs, 5000);
    }

    return Math.round(delayMs);
  }

  /**
   * Analyse une erreur pour déterminer sa nature
   */
  private analyzeError(error: Error): RetryReason {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('connection')) {
      return RetryReason.NETWORK_ERROR;
    }

    if (message.includes('timeout')) {
      return RetryReason.TIMEOUT;
    }

    if (message.includes('rate limit') || message.includes('too many requests')) {
      return RetryReason.RATE_LIMIT;
    }

    if (message.includes('unauthorized') || message.includes('authentication')) {
      return RetryReason.AUTHENTICATION_ERROR;
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return RetryReason.VALIDATION_ERROR;
    }

    if (message.includes('conflict')) {
      return RetryReason.CONFLICT;
    }

    if (message.includes('server') || message.includes('internal')) {
      return RetryReason.SERVER_ERROR;
    }

    return RetryReason.UNKNOWN;
  }

  /**
   * Vérifie si une erreur est retryable
   */
  private isRetryableError(error: Error, config: RetryConfig): boolean {
    const reason = this.analyzeError(error);
    return config.retryableErrors.includes(reason);
  }

  /**
   * Fusionne une configuration avec la configuration par défaut
   */
  private mergeConfig(config?: Partial<RetryConfig>): RetryConfig {
    return {
      ...DEFAULT_RETRY_CONFIG,
      ...config
    };
  }

  /**
   * Génère un ID de session unique
   */
  private generateSessionId(): string {
    return `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Attendre un délai
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Émet un événement de retry
   */
  private emitEvent(event: RetryEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[RETRY_SERVICE] Erreur listener événement:', error);
      }
    });
  }

  /**
   * Obtient les tentatives récentes
   */
  private getRecentAttempts(): RetryAttempt[] {
    const allAttempts: RetryAttempt[] = [];
    this.activeSessions.forEach(session => {
      allAttempts.push(...session.attempts);
    });
    
    return allAttempts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10); // 10 tentatives les plus récentes
  }

  /**
   * Met à jour les métriques
   */
  private async updateMetrics(result: RetryResult<any> | null, attempts: RetryAttempt[]): Promise<void> {
    this.metrics.totalAttempts += attempts.length;
    
    if (result?.success) {
      this.metrics.successfulAttempts++;
    } else {
      this.metrics.failedAttempts++;
    }

    // Calculer le délai moyen
    const totalDelay = attempts.reduce((sum, attempt) => sum + attempt.delayMs, 0);
    this.metrics.averageDelayMs = totalDelay / attempts.length || 0;

    // Calculer le temps total
    this.metrics.totalTimeMs += result?.totalTimeMs || 0;

    // Trouver la raison la plus commune
    const reasonCounts = new Map<RetryReason, number>();
    attempts.forEach(attempt => {
      reasonCounts.set(attempt.reason, (reasonCounts.get(attempt.reason) || 0) + 1);
    });
    
    let mostCommonReason = RetryReason.UNKNOWN;
    let maxCount = 0;
    reasonCounts.forEach((count, reason) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonReason = reason;
      }
    });
    this.metrics.mostCommonReason = mostCommonReason;

    // Calculer le taux de succès
    this.metrics.successRate = this.metrics.totalAttempts > 0 
      ? (this.metrics.successfulAttempts / (this.metrics.successfulAttempts + this.metrics.failedAttempts)) * 100
      : 0;

    // Sauvegarder les métriques
    await this.saveMetrics();
  }

  /**
   * Charge les métriques depuis AsyncStorage
   */
  private async loadMetrics(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('retry_metrics');
      if (data) {
        this.metrics = { ...this.metrics, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('[RETRY_SERVICE] Erreur chargement métriques:', error);
    }
  }

  /**
   * Sauvegarde les métriques dans AsyncStorage
   */
  private async saveMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem('retry_metrics', JSON.stringify(this.metrics));
    } catch (error) {
      console.error('[RETRY_SERVICE] Erreur sauvegarde métriques:', error);
    }
  }

  /**
   * Sauvegarde une session de retry
   */
  private async saveSession(session: RetrySession): Promise<void> {
    try {
      const history = await this.getHistory();
      history.sessions.push(session);
      
      // Garder seulement les 100 dernières sessions
      if (history.sessions.length > 100) {
        history.sessions = history.sessions.slice(-100);
      }

      // Mettre à jour les statistiques
      history.totalSessions++;
      if (session.status === 'completed') {
        history.successfulSessions++;
      } else if (session.status === 'failed') {
        history.failedSessions++;
      }
      
      history.averageRetriesPerSession = history.sessions.reduce(
        (sum, s) => sum + s.attempts.length, 0
      ) / history.sessions.length;

      history.lastSessionAt = session.endTime || session.startTime;

      await AsyncStorage.setItem('retry_history', JSON.stringify(history));
    } catch (error) {
      console.error('[RETRY_SERVICE] Erreur sauvegarde session:', error);
    }
  }
}

// Export de l'instance singleton
export default RetryService.getInstance();

