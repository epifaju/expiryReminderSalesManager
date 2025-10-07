/**
 * Hook React pour utiliser le service de synchronisation
 * Fournit une interface simple pour les composants React
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import SyncService from '../services/sync/SyncService';
import {
  SyncState,
  SyncProgress,
  SyncResult,
  SyncDeltaResponse,
  SyncMetadata,
  SyncConfig,
  SyncOptions,
  SyncEvent,
  SyncEventListener,
  SyncOperation,
  EntityType
} from '../types/sync';

/**
 * Interface du hook useSyncService
 */
export interface UseSyncServiceReturn {
  // État de synchronisation
  syncState: SyncState;
  syncProgress: SyncProgress;
  syncMetadata: SyncMetadata | null;
  syncConfig: SyncConfig;
  
  // Actions de synchronisation
  syncBatch: (operations: SyncOperation[], options?: SyncOptions) => Promise<SyncResult>;
  syncDelta: (options?: SyncOptions) => Promise<SyncDeltaResponse>;
  syncAll: (options?: SyncOptions) => Promise<{ batch: SyncResult | null; delta: SyncDeltaResponse | null }>;
  forceSync: (options?: SyncOptions) => Promise<void>;
  getServerStatus: () => Promise<any>;
  
  // Gestion de la configuration
  updateConfig: (config: Partial<SyncConfig>) => Promise<void>;
  
  // Utilitaires
  isInitialized: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  hasErrors: boolean;
  hasConflicts: boolean;
  
  // Derniers résultats
  lastSyncResult: SyncResult | null;
  lastDeltaResponse: SyncDeltaResponse | null;
  lastError: Error | null;
}

/**
 * Hook pour utiliser le service de synchronisation
 */
export const useSyncService = (): UseSyncServiceReturn => {
  // États locaux
  const [syncState, setSyncState] = useState<SyncState>(SyncState.IDLE);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    state: SyncState.IDLE,
    currentOperation: '',
    progress: 0,
    totalOperations: 0,
    completedOperations: 0,
    errors: 0,
    conflicts: 0
  });
  const [syncMetadata, setSyncMetadata] = useState<SyncMetadata | null>(null);
  const [syncConfig, setSyncConfig] = useState<SyncConfig>(SyncService.getConfig());
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [lastDeltaResponse, setLastDeltaResponse] = useState<SyncDeltaResponse | null>(null);
  const [lastError, setLastError] = useState<Error | null>(null);

  // Référence pour éviter les re-renders inutiles
  const eventListenerRef = useRef<SyncEventListener | null>(null);

  // Initialisation du listener d'événements
  useEffect(() => {
    if (!eventListenerRef.current) {
      eventListenerRef.current = (event: SyncEvent) => {
        switch (event.type) {
          case 'sync_started':
            setSyncState(SyncState.SYNCING);
            setLastError(null);
            break;
            
          case 'sync_progress':
            setSyncProgress(event.data);
            setSyncState(event.data.state);
            break;
            
          case 'sync_completed':
            setSyncState(SyncState.COMPLETED);
            if (event.data && 'totalProcessed' in event.data) {
              // C'est un résultat de batch sync
              setLastSyncResult(event.data);
            } else if (event.data && 'totalModified' in event.data) {
              // C'est un résultat de delta sync
              setLastDeltaResponse(event.data);
            }
            break;
            
          case 'sync_error':
            setSyncState(SyncState.ERROR);
            setLastError(event.data?.error || new Error(event.message || 'Erreur inconnue'));
            break;
            
          case 'sync_conflict':
            // Gérer les conflits si nécessaire
            break;
        }
      };

      SyncService.addEventListener(eventListenerRef.current);
    }

    return () => {
      if (eventListenerRef.current) {
        SyncService.removeEventListener(eventListenerRef.current);
        eventListenerRef.current = null;
      }
    };
  }, []);

  // Charger les métadonnées au montage
  useEffect(() => {
    const loadMetadata = () => {
      setSyncMetadata(SyncService.getSyncMetadata());
    };
    
    loadMetadata();
  }, []);

  // Actions de synchronisation avec gestion d'erreurs
  const syncBatch = useCallback(async (operations: SyncOperation[], options?: SyncOptions): Promise<SyncResult> => {
    try {
      setLastError(null);
      const result = await SyncService.syncBatch(operations, options);
      setLastSyncResult(result);
      setSyncMetadata(SyncService.getSyncMetadata());
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erreur de synchronisation batch');
      setLastError(err);
      throw err;
    }
  }, []);

  const syncDelta = useCallback(async (options?: SyncOptions): Promise<SyncDeltaResponse> => {
    try {
      setLastError(null);
      const response = await SyncService.syncDelta(options);
      setLastDeltaResponse(response);
      setSyncMetadata(SyncService.getSyncMetadata());
      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erreur de synchronisation delta');
      setLastError(err);
      throw err;
    }
  }, []);

  const syncAll = useCallback(async (options?: SyncOptions) => {
    try {
      setLastError(null);
      const result = await SyncService.syncAll(options);
      if (result.batch) {
        setLastSyncResult(result.batch);
      }
      if (result.delta) {
        setLastDeltaResponse(result.delta);
      }
      setSyncMetadata(SyncService.getSyncMetadata());
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erreur de synchronisation complète');
      setLastError(err);
      throw err;
    }
  }, []);

  const forceSync = useCallback(async (options?: SyncOptions): Promise<void> => {
    try {
      setLastError(null);
      await SyncService.forceSync(options);
      setSyncMetadata(SyncService.getSyncMetadata());
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erreur de synchronisation forcée');
      setLastError(err);
      throw err;
    }
  }, []);

  const getServerStatus = useCallback(async () => {
    try {
      setLastError(null);
      return await SyncService.getServerStatus();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erreur récupération statut serveur');
      setLastError(err);
      throw err;
    }
  }, []);

  const updateConfig = useCallback(async (config: Partial<SyncConfig>): Promise<void> => {
    try {
      setLastError(null);
      await SyncService.updateConfig(config);
      setSyncConfig(SyncService.getConfig());
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erreur mise à jour configuration');
      setLastError(err);
      throw err;
    }
  }, []);

  // Propriétés calculées
  const isInitialized = SyncService.getCurrentState() !== SyncState.IDLE || syncMetadata !== null;
  const isOnline = true; // TODO: Intégrer avec NetworkService
  const isSyncing = syncState === SyncState.SYNCING;
  const hasErrors = syncState === SyncState.ERROR || lastError !== null || syncProgress.errors > 0;
  const hasConflicts = syncProgress.conflicts > 0;

  return {
    // État de synchronisation
    syncState,
    syncProgress,
    syncMetadata,
    syncConfig,
    
    // Actions de synchronisation
    syncBatch,
    syncDelta,
    syncAll,
    forceSync,
    getServerStatus,
    
    // Gestion de la configuration
    updateConfig,
    
    // Utilitaires
    isInitialized,
    isOnline,
    isSyncing,
    hasErrors,
    hasConflicts,
    
    // Derniers résultats
    lastSyncResult,
    lastDeltaResponse,
    lastError
  };
};

/**
 * Hook simplifié pour vérifier si une synchronisation est en cours
 */
export const useIsSyncing = (): boolean => {
  const { isSyncing } = useSyncService();
  return isSyncing;
};

/**
 * Hook pour obtenir les métadonnées de synchronisation
 */
export const useSyncMetadata = (): SyncMetadata | null => {
  const { syncMetadata } = useSyncService();
  return syncMetadata;
};

/**
 * Hook pour obtenir le progrès de synchronisation
 */
export const useSyncProgress = (): SyncProgress => {
  const { syncProgress } = useSyncService();
  return syncProgress;
};

