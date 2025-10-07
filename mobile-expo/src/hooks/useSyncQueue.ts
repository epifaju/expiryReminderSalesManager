/**
 * Hook React personnalisé pour utiliser le SyncQueueService
 * Fournit l'état de la queue et les fonctions de synchronisation
 */

import { useState, useEffect, useCallback } from 'react';
import SyncQueueService, { SyncResult, QueueStats, SyncOptions } from '../services/sync/SyncQueueService';
import { SyncQueueItem, SyncOperation, EntityType } from '../types/models';

/**
 * Interface pour le retour du hook
 */
export interface UseSyncQueueReturn {
  /** Statistiques de la queue */
  queueStats: QueueStats;
  /** Nombre d'éléments en attente */
  pendingCount: number;
  /** Indique si une synchronisation est en cours */
  isSyncing: boolean;
  /** Indique si le service est initialisé */
  isInitialized: boolean;
  /** Fonction pour déclencher la synchronisation manuelle */
  triggerSync: (options?: SyncOptions) => Promise<SyncResult>;
  /** Fonction pour ajouter un élément à la queue */
  addToQueue: (entityType: EntityType, operation: SyncOperation, entityId: string, entityData: any, options?: SyncOptions) => Promise<SyncQueueItem>;
  /** Fonction pour vider la queue */
  clearQueue: (status?: 'pending' | 'synced' | 'conflict' | 'failed') => Promise<number>;
  /** Fonction pour rafraîchir les statistiques */
  refreshStats: () => Promise<void>;
  /** Dernière erreur de synchronisation */
  lastError: string | null;
}

/**
 * Hook pour utiliser la queue de synchronisation
 * @returns Objet avec toutes les informations et fonctions de la queue
 */
export const useSyncQueue = (): UseSyncQueueReturn => {
  const [queueStats, setQueueStats] = useState<QueueStats>({
    pendingCount: 0,
    byEntityType: { product: 0, sale: 0, stock_movement: 0 },
    byOperation: { create: 0, update: 0, delete: 0 },
    byPriority: {},
    lastSyncTime: null,
    nextRetryTime: null
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  /**
   * Rafraîchit les statistiques de la queue
   */
  const refreshStats = useCallback(async (): Promise<void> => {
    try {
      const stats = await SyncQueueService.getQueueStats();
      setQueueStats(stats);
      setLastError(null);
    } catch (error) {
      console.error('[useSyncQueue] Erreur lors du rafraîchissement des statistiques:', error);
      setLastError(error.message);
    }
  }, []);

  /**
   * Initialise le service et charge les statistiques initiales
   */
  useEffect(() => {
    let isMounted = true;

    const initializeService = async () => {
      try {
        if (!SyncQueueService.isServiceInitialized()) {
          await SyncQueueService.initialize();
        }

        if (isMounted) {
          setIsInitialized(true);
          await refreshStats();
        }
      } catch (error) {
        console.error('[useSyncQueue] Erreur lors de l\'initialisation:', error);
        if (isMounted) {
          setLastError(error.message);
        }
      }
    };

    initializeService();

    // Rafraîchir les statistiques périodiquement
    const interval = setInterval(() => {
      if (isMounted && isInitialized) {
        refreshStats();
      }
    }, 30000); // Toutes les 30 secondes

    // Cleanup function
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [refreshStats, isInitialized]);

  /**
   * Déclenche la synchronisation manuelle
   */
  const triggerSync = useCallback(async (options?: SyncOptions): Promise<SyncResult> => {
    try {
      setIsSyncing(true);
      setLastError(null);
      
      const result = await SyncQueueService.triggerManualSync(options);
      
      // Rafraîchir les statistiques après synchronisation
      await refreshStats();
      
      return result;
    } catch (error) {
      console.error('[useSyncQueue] Erreur lors de la synchronisation:', error);
      setLastError(error.message);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [refreshStats]);

  /**
   * Ajoute un élément à la queue
   */
  const addToQueue = useCallback(async (
    entityType: EntityType,
    operation: SyncOperation,
    entityId: string,
    entityData: any,
    options?: SyncOptions
  ): Promise<SyncQueueItem> => {
    try {
      setLastError(null);
      
      const item = await SyncQueueService.addToQueue(
        entityType,
        operation,
        entityId,
        entityData,
        options
      );
      
      // Rafraîchir les statistiques après ajout
      await refreshStats();
      
      return item;
    } catch (error) {
      console.error('[useSyncQueue] Erreur lors de l\'ajout à la queue:', error);
      setLastError(error.message);
      throw error;
    }
  }, [refreshStats]);

  /**
   * Vide la queue
   */
  const clearQueue = useCallback(async (status?: 'pending' | 'synced' | 'conflict' | 'failed'): Promise<number> => {
    try {
      setLastError(null);
      
      const deletedCount = await SyncQueueService.clearQueue(status);
      
      // Rafraîchir les statistiques après vidage
      await refreshStats();
      
      return deletedCount;
    } catch (error) {
      console.error('[useSyncQueue] Erreur lors du vidage de la queue:', error);
      setLastError(error.message);
      throw error;
    }
  }, [refreshStats]);

  return {
    queueStats,
    pendingCount: queueStats.pendingCount,
    isSyncing,
    isInitialized,
    triggerSync,
    addToQueue,
    clearQueue,
    refreshStats,
    lastError
  };
};

/**
 * Hook simplifié pour vérifier uniquement le nombre d'éléments en attente
 * @returns Nombre d'éléments en attente de synchronisation
 */
export const usePendingSyncCount = (): number => {
  const { pendingCount } = useSyncQueue();
  return pendingCount;
};

/**
 * Hook pour vérifier si une synchronisation est en cours
 * @returns true si une synchronisation est en cours, false sinon
 */
export const useIsSyncing = (): boolean => {
  const { isSyncing } = useSyncQueue();
  return isSyncing;
};

/**
 * Hook pour obtenir les statistiques détaillées de la queue
 * @returns Statistiques complètes de la queue
 */
export const useQueueStats = () => {
  const { queueStats, refreshStats } = useSyncQueue();
  
  return {
    ...queueStats,
    refreshStats
  };
};

