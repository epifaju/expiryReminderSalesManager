/**
 * Service de synchronisation bidirectionnelle
 * Gère la communication avec les endpoints backend de synchronisation
 */

import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkService } from '../network';
import apiClient from '../apiClient';
import {
  SyncBatchRequest,
  SyncBatchResponse,
  SyncDeltaRequest,
  SyncDeltaResponse,
  SyncStatus,
  SyncResult,
  SyncOptions,
  SyncEvent,
  SyncEventListener,
  SyncState,
  SyncProgress,
  SyncConfig,
  SyncMetadata,
  EntityType,
  OperationType,
  SyncOperation
} from '../../types/sync';

/**
 * Service de synchronisation singleton
 * Gère la synchronisation bidirectionnelle entre le mobile et le serveur
 */
class SyncService {
  private static instance: SyncService;
  private isInitialized = false;
  private currentState: SyncState = SyncState.IDLE;
  private syncProgress: SyncProgress = {
    state: SyncState.IDLE,
    currentOperation: '',
    progress: 0,
    totalOperations: 0,
    completedOperations: 0,
    errors: 0,
    conflicts: 0
  };
  private eventListeners: SyncEventListener[] = [];
  private syncConfig: SyncConfig = {
    batchSize: 50,
    maxRetries: 3,
    retryDelayMs: 1000,
    timeoutMs: 30000,
    enableDeltaSync: true,
    enableBatchSync: true,
    syncIntervalMs: 300000 // 5 minutes
  };
  private syncMetadata: SyncMetadata | null = null;
  private deviceId: string = '';
  private appVersion: string = '1.0.0';

  /**
   * Constructeur privé pour le pattern singleton
   */
  private constructor() {}

  /**
   * Obtient l'instance singleton du service
   */
  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Initialise le service de synchronisation
   */
  public async initialize(deviceId: string, appVersion: string): Promise<void> {
    if (this.isInitialized) {
      console.log('[SYNC_SERVICE] Service déjà initialisé');
      return;
    }

    console.log('[SYNC_SERVICE] Initialisation du service de synchronisation...');
    
    this.deviceId = deviceId;
    this.appVersion = appVersion;

    try {
      // Charger les métadonnées de synchronisation
      await this.loadSyncMetadata();
      
      // Charger la configuration depuis AsyncStorage
      await this.loadConfig();
      
      this.isInitialized = true;
      
      console.log('[SYNC_SERVICE] Service initialisé avec succès');
      console.log('[SYNC_SERVICE] Dernière sync:', this.syncMetadata?.lastSyncTimestamp || 'Jamais');
      
      this.emitEvent({
        type: 'sync_started',
        timestamp: new Date().toISOString(),
        message: 'Service de synchronisation initialisé'
      });
      
    } catch (error) {
      console.error('[SYNC_SERVICE] Erreur initialisation:', error);
      throw error;
    }
  }

  /**
   * Synchronisation batch - Envoie les opérations locales vers le serveur
   */
  public async syncBatch(operations: SyncOperation[], options: SyncOptions = {}): Promise<SyncResult> {
    if (!this.isInitialized) {
      throw new Error('Service de synchronisation non initialisé');
    }

    if (!NetworkService.getInstance().isOnline()) {
      throw new Error('Pas de connexion réseau');
    }

    console.log(`[SYNC_SERVICE] Début synchronisation batch: ${operations.length} opérations`);
    
    this.updateState(SyncState.SYNCING, 'Synchronisation batch en cours...', 0, operations.length);

    try {
      const request: SyncBatchRequest = {
        operations,
        clientTimestamp: new Date().toISOString(),
        deviceId: this.deviceId,
        appVersion: this.appVersion,
        syncSessionId: uuidv4()
      };

      const response = await this.makeRequest<SyncBatchResponse>(
        'POST',
        '/api/sync/batch',
        request,
        options.timeoutMs || this.syncConfig.timeoutMs
      );

      const result: SyncResult = {
        success: response.successCount > 0,
        totalProcessed: response.totalProcessed,
        successCount: response.successCount,
        errorCount: response.errorCount,
        conflictCount: response.conflictCount,
        processingTimeMs: response.processingTimeMs,
        errors: response.errors,
        conflicts: response.conflicts,
        nextSyncTimestamp: response.serverTimestamp
      };

      // Mettre à jour les métadonnées
      await this.updateSyncMetadata('batch', result.success ? 'success' : 'error', result);

      console.log(`[SYNC_SERVICE] Synchronisation batch terminée: ${result.successCount} succès, ${result.errorCount} erreurs, ${result.conflictCount} conflits`);
      
      this.updateState(SyncState.COMPLETED, 'Synchronisation batch terminée', 100, operations.length, operations.length, result.errorCount, result.conflictCount);

      this.emitEvent({
        type: 'sync_completed',
        timestamp: new Date().toISOString(),
        data: result,
        message: `Synchronisation batch: ${result.successCount} succès, ${result.errorCount} erreurs, ${result.conflictCount} conflits`
      });

      return result;

    } catch (error) {
      console.error('[SYNC_SERVICE] Erreur synchronisation batch:', error);
      
      this.updateState(SyncState.ERROR, 'Erreur synchronisation batch', 0, operations.length, 0, 1);
      
      await this.updateSyncMetadata('batch', 'error', null, error instanceof Error ? error.message : 'Erreur inconnue');

      this.emitEvent({
        type: 'sync_error',
        timestamp: new Date().toISOString(),
        data: { error },
        message: 'Erreur lors de la synchronisation batch'
      });

      throw error;
    }
  }

  /**
   * Synchronisation delta - Récupère les modifications serveur
   */
  public async syncDelta(options: SyncOptions = {}): Promise<SyncDeltaResponse> {
    if (!this.isInitialized) {
      throw new Error('Service de synchronisation non initialisé');
    }

    if (!NetworkService.getInstance().isOnline()) {
      throw new Error('Pas de connexion réseau');
    }

    const lastSyncTimestamp = this.syncMetadata?.lastSyncTimestamp || new Date(0).toISOString();
    
    console.log(`[SYNC_SERVICE] Début synchronisation delta depuis: ${lastSyncTimestamp}`);
    
    this.updateState(SyncState.SYNCING, 'Synchronisation delta en cours...', 0, 1);

    try {
      const request: SyncDeltaRequest = {
        lastSyncTimestamp,
        deviceId: this.deviceId,
        appVersion: this.appVersion,
        entityTypes: options.entityTypes,
        limit: this.syncConfig.batchSize,
        syncSessionId: uuidv4()
      };

      const response = await this.makeRequest<SyncDeltaResponse>(
        'GET',
        '/api/sync/delta',
        undefined,
        options.timeoutMs || this.syncConfig.timeoutMs,
        {
          lastSyncTimestamp: request.lastSyncTimestamp,
          deviceId: request.deviceId,
          appVersion: request.appVersion,
          entityTypes: request.entityTypes?.join(','),
          limit: request.limit?.toString()
        }
      );

      // Mettre à jour les métadonnées
      await this.updateSyncMetadata('delta', 'success', null, undefined, response.nextSyncTimestamp);

      console.log(`[SYNC_SERVICE] Synchronisation delta terminée: ${response.totalModified} entités modifiées, ${response.totalDeleted} supprimées`);
      
      this.updateState(SyncState.COMPLETED, 'Synchronisation delta terminée', 100, 1, 1);

      this.emitEvent({
        type: 'sync_completed',
        timestamp: new Date().toISOString(),
        data: response,
        message: `Synchronisation delta: ${response.totalModified} modifiées, ${response.totalDeleted} supprimées`
      });

      return response;

    } catch (error) {
      console.error('[SYNC_SERVICE] Erreur synchronisation delta:', error);
      
      this.updateState(SyncState.ERROR, 'Erreur synchronisation delta', 0, 1, 0, 1);
      
      await this.updateSyncMetadata('delta', 'error', null, error instanceof Error ? error.message : 'Erreur inconnue');

      this.emitEvent({
        type: 'sync_error',
        timestamp: new Date().toISOString(),
        data: { error },
        message: 'Erreur lors de la synchronisation delta'
      });

      throw error;
    }
  }

  /**
   * Synchronisation complète - Batch + Delta
   */
  public async syncAll(options: SyncOptions = {}): Promise<{ batch: SyncResult | null; delta: SyncDeltaResponse | null }> {
    if (!this.isInitialized) {
      throw new Error('Service de synchronisation non initialisé');
    }

    console.log('[SYNC_SERVICE] Début synchronisation complète');
    
    const result = {
      batch: null as SyncResult | null,
      delta: null as SyncDeltaResponse | null
    };

    try {
      // 1. Synchronisation batch (opérations locales vers serveur)
      if (this.syncConfig.enableBatchSync && !options.skipConflicts) {
        // Récupérer les opérations en attente depuis SyncQueueService
        const pendingOperations = await this.getPendingOperations();
        if (pendingOperations.length > 0) {
          result.batch = await this.syncBatch(pendingOperations, options);
        }
      }

      // 2. Synchronisation delta (modifications serveur vers local)
      if (this.syncConfig.enableDeltaSync) {
        result.delta = await this.syncDelta(options);
      }

      console.log('[SYNC_SERVICE] Synchronisation complète terminée');
      return result;

    } catch (error) {
      console.error('[SYNC_SERVICE] Erreur synchronisation complète:', error);
      throw error;
    }
  }

  /**
   * Obtient le statut de synchronisation du serveur
   */
  public async getServerStatus(): Promise<SyncStatus> {
    if (!this.isInitialized) {
      throw new Error('Service de synchronisation non initialisé');
    }

    try {
      const response = await this.makeRequest<SyncStatus>('GET', '/api/sync/status');
      return response;
    } catch (error) {
      console.error('[SYNC_SERVICE] Erreur récupération statut serveur:', error);
      throw error;
    }
  }

  /**
   * Force une synchronisation complète
   */
  public async forceSync(options: SyncOptions = {}): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Service de synchronisation non initialisé');
    }

    console.log('[SYNC_SERVICE] Synchronisation forcée');
    
    try {
      await this.makeRequest('POST', '/api/sync/force');
      // Déclencher une synchronisation complète après la force sync
      await this.syncAll({ ...options, forceFullSync: true });
    } catch (error) {
      console.error('[SYNC_SERVICE] Erreur synchronisation forcée:', error);
      throw error;
    }
  }

  /**
   * Obtient l'état actuel de la synchronisation
   */
  public getCurrentState(): SyncState {
    return this.currentState;
  }

  /**
   * Obtient le progrès actuel de la synchronisation
   */
  public getProgress(): SyncProgress {
    return { ...this.syncProgress };
  }

  /**
   * Obtient les métadonnées de synchronisation
   */
  public getSyncMetadata(): SyncMetadata | null {
    return this.syncMetadata;
  }

  /**
   * Obtient la configuration de synchronisation
   */
  public getConfig(): SyncConfig {
    return { ...this.syncConfig };
  }

  /**
   * Met à jour la configuration de synchronisation
   */
  public async updateConfig(config: Partial<SyncConfig>): Promise<void> {
    this.syncConfig = { ...this.syncConfig, ...config };
    await this.saveConfig();
    console.log('[SYNC_SERVICE] Configuration mise à jour:', this.syncConfig);
  }

  /**
   * Ajoute un listener d'événements
   */
  public addEventListener(listener: SyncEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * Supprime un listener d'événements
   */
  public removeEventListener(listener: SyncEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Nettoie les ressources du service
   */
  public async cleanup(): Promise<void> {
    console.log('[SYNC_SERVICE] Nettoyage du service');
    this.eventListeners = [];
    this.isInitialized = false;
    this.currentState = SyncState.IDLE;
  }

  // ===== MÉTHODES PRIVÉES =====

  /**
   * Effectue une requête HTTP avec retry automatique
   */
  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: any,
    timeoutMs?: number,
    params?: Record<string, string>
  ): Promise<T> {
    const maxRetries = this.syncConfig.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[SYNC_SERVICE] Tentative ${attempt}/${maxRetries}: ${method} ${url}`);

        const config: any = {
          method,
          url,
          timeout: timeoutMs || this.syncConfig.timeoutMs
        };

        if (data) {
          config.data = data;
        }

        if (params) {
          config.params = params;
        }

        const response = await apiClient.request<T>(config);
        return response.data;

      } catch (error: any) {
        lastError = error;
        console.error(`[SYNC_SERVICE] Tentative ${attempt} échouée:`, error.message);

        if (attempt < maxRetries) {
          const delay = this.syncConfig.retryDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`[SYNC_SERVICE] Retry dans ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Échec de la requête après tous les retry');
  }

  /**
   * Met à jour l'état de synchronisation
   */
  private updateState(
    state: SyncState,
    currentOperation: string,
    progress: number,
    totalOperations: number,
    completedOperations: number = 0,
    errors: number = 0,
    conflicts: number = 0
  ): void {
    this.currentState = state;
    this.syncProgress = {
      state,
      currentOperation,
      progress,
      totalOperations,
      completedOperations,
      errors,
      conflicts,
      startTime: state === SyncState.SYNCING && this.syncProgress.state !== SyncState.SYNCING ? new Date().toISOString() : this.syncProgress.startTime,
      endTime: state === SyncState.COMPLETED || state === SyncState.ERROR ? new Date().toISOString() : undefined
    };

    this.emitEvent({
      type: 'sync_progress',
      timestamp: new Date().toISOString(),
      data: this.syncProgress,
      message: currentOperation
    });
  }

  /**
   * Émet un événement de synchronisation
   */
  private emitEvent(event: SyncEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[SYNC_SERVICE] Erreur listener événement:', error);
      }
    });
  }

  /**
   * Charge les métadonnées de synchronisation depuis AsyncStorage
   */
  private async loadSyncMetadata(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('sync_metadata');
      if (data) {
        this.syncMetadata = JSON.parse(data);
      } else {
        this.syncMetadata = {
          lastSyncTimestamp: new Date(0).toISOString(),
          lastSyncType: 'batch',
          lastSyncStatus: 'success',
          totalSyncCount: 0,
          successfulSyncCount: 0,
          failedSyncCount: 0,
          deviceId: this.deviceId,
          appVersion: this.appVersion
        };
      }
    } catch (error) {
      console.error('[SYNC_SERVICE] Erreur chargement métadonnées:', error);
      this.syncMetadata = {
        lastSyncTimestamp: new Date(0).toISOString(),
        lastSyncType: 'batch',
        lastSyncStatus: 'success',
        totalSyncCount: 0,
        successfulSyncCount: 0,
        failedSyncCount: 0,
        deviceId: this.deviceId,
        appVersion: this.appVersion
      };
    }
  }

  /**
   * Sauvegarde les métadonnées de synchronisation dans AsyncStorage
   */
  private async saveSyncMetadata(): Promise<void> {
    try {
      await AsyncStorage.setItem('sync_metadata', JSON.stringify(this.syncMetadata));
    } catch (error) {
      console.error('[SYNC_SERVICE] Erreur sauvegarde métadonnées:', error);
    }
  }

  /**
   * Met à jour les métadonnées de synchronisation
   */
  private async updateSyncMetadata(
    syncType: 'batch' | 'delta',
    status: 'success' | 'error' | 'conflict',
    result?: SyncResult | null,
    errorMessage?: string,
    nextSyncTimestamp?: string
  ): Promise<void> {
    if (!this.syncMetadata) return;

    this.syncMetadata.lastSyncTimestamp = nextSyncTimestamp || new Date().toISOString();
    this.syncMetadata.lastSyncType = syncType;
    this.syncMetadata.lastSyncStatus = status;
    this.syncMetadata.totalSyncCount++;
    
    if (status === 'success') {
      this.syncMetadata.successfulSyncCount++;
    } else {
      this.syncMetadata.failedSyncCount++;
      this.syncMetadata.lastError = errorMessage;
    }

    await this.saveSyncMetadata();
  }

  /**
   * Charge la configuration depuis AsyncStorage
   */
  private async loadConfig(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('sync_config');
      if (data) {
        const savedConfig = JSON.parse(data);
        this.syncConfig = { ...this.syncConfig, ...savedConfig };
      }
    } catch (error) {
      console.error('[SYNC_SERVICE] Erreur chargement configuration:', error);
    }
  }

  /**
   * Sauvegarde la configuration dans AsyncStorage
   */
  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem('sync_config', JSON.stringify(this.syncConfig));
    } catch (error) {
      console.error('[SYNC_SERVICE] Erreur sauvegarde configuration:', error);
    }
  }

  /**
   * Récupère les opérations en attente (à implémenter avec SyncQueueService)
   */
  private async getPendingOperations(): Promise<SyncOperation[]> {
    // TODO: Intégrer avec SyncQueueService pour récupérer les opérations en attente
    // Pour l'instant, retourner un tableau vide
    return [];
  }
}

// Export de l'instance singleton
export default SyncService.getInstance();

