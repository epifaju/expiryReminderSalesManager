/**
 * Hook React pour utiliser le service de retry
 * Fournit une interface simple pour les composants React
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import RetryService from '../services/retry/RetryService';
import {
  RetryResult,
  RetryOptions,
  RetryConfig,
  RetryStats,
  RetryHistory,
  RetryEvent,
  RetryEventListener,
  RetryAttempt,
  RetryReason
} from '../types/retry';

/**
 * Interface du hook useRetry
 */
export interface UseRetryReturn {
  // État du retry
  isRetrying: boolean;
  currentAttempt: number;
  totalAttempts: number;
  lastError: Error | null;
  lastResult: RetryResult<any> | null;
  
  // Actions de retry
  executeWithRetry: <T>(operation: () => Promise<T>, options?: RetryOptions) => Promise<RetryResult<T>>;
  executeSyncWithRetry: <T>(operation: () => Promise<T>, options?: RetryOptions) => Promise<RetryResult<T>>;
  executeNetworkWithRetry: <T>(operation: () => Promise<T>, options?: RetryOptions) => Promise<RetryResult<T>>;
  executeCriticalWithRetry: <T>(operation: () => Promise<T>, options?: RetryOptions) => Promise<RetryResult<T>>;
  
  // Statistiques et historique
  stats: RetryStats;
  history: RetryHistory | null;
  refreshStats: () => void;
  refreshHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
  
  // Utilitaires
  isInitialized: boolean;
  hasErrors: boolean;
  recentAttempts: RetryAttempt[];
}

/**
 * Hook pour utiliser le service de retry
 */
export const useRetry = (): UseRetryReturn => {
  // États locaux
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [lastResult, setLastResult] = useState<RetryResult<any> | null>(null);
  const [stats, setStats] = useState<RetryStats>(RetryService.getStats());
  const [history, setHistory] = useState<RetryHistory | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Référence pour éviter les re-renders inutiles
  const eventListenerRef = useRef<RetryEventListener | null>(null);

  // Initialisation du listener d'événements
  useEffect(() => {
    if (!eventListenerRef.current) {
      eventListenerRef.current = (event: RetryEvent) => {
        switch (event.type) {
          case 'retry_started':
            setIsRetrying(true);
            setCurrentAttempt(0);
            setLastError(null);
            break;
            
          case 'retry_attempt':
            setCurrentAttempt(event.attemptNumber);
            setLastError(event.error || null);
            break;
            
          case 'retry_success':
            setIsRetrying(false);
            setCurrentAttempt(event.attemptNumber);
            setLastError(null);
            setTotalAttempts(prev => prev + 1);
            break;
            
          case 'retry_failed':
          case 'retry_gave_up':
            setIsRetrying(false);
            setCurrentAttempt(event.attemptNumber);
            setLastError(event.error || null);
            setTotalAttempts(prev => prev + 1);
            break;
        }
      };

      RetryService.addEventListener(eventListenerRef.current);
    }

    return () => {
      if (eventListenerRef.current) {
        RetryService.removeEventListener(eventListenerRef.current);
        eventListenerRef.current = null;
      }
    };
  }, []);

  // Initialisation du service
  useEffect(() => {
    const initializeService = async () => {
      try {
        await RetryService.initialize();
        setIsInitialized(true);
        setStats(RetryService.getStats());
        await refreshHistory();
      } catch (error) {
        console.error('Erreur initialisation RetryService:', error);
      }
    };

    initializeService();
  }, []);

  // Actions de retry avec gestion d'erreurs
  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> => {
    try {
      setLastError(null);
      const result = await RetryService.executeWithRetry(operation, options);
      setLastResult(result);
      setStats(RetryService.getStats());
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erreur de retry');
      setLastError(err);
      throw err;
    }
  }, []);

  const executeSyncWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> => {
    try {
      setLastError(null);
      const result = await RetryService.executeSyncWithRetry(operation, options);
      setLastResult(result);
      setStats(RetryService.getStats());
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erreur de retry sync');
      setLastError(err);
      throw err;
    }
  }, []);

  const executeNetworkWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> => {
    try {
      setLastError(null);
      const result = await RetryService.executeNetworkWithRetry(operation, options);
      setLastResult(result);
      setStats(RetryService.getStats());
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erreur de retry réseau');
      setLastError(err);
      throw err;
    }
  }, []);

  const executeCriticalWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> => {
    try {
      setLastError(null);
      const result = await RetryService.executeCriticalWithRetry(operation, options);
      setLastResult(result);
      setStats(RetryService.getStats());
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erreur de retry critique');
      setLastError(err);
      throw err;
    }
  }, []);

  // Actions pour les statistiques et l'historique
  const refreshStats = useCallback(() => {
    setStats(RetryService.getStats());
  }, []);

  const refreshHistory = useCallback(async () => {
    try {
      const historyData = await RetryService.getHistory();
      setHistory(historyData);
    } catch (error) {
      console.error('Erreur chargement historique retry:', error);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      await RetryService.clearHistory();
      setHistory(null);
      setStats(RetryService.getStats());
    } catch (error) {
      console.error('Erreur nettoyage historique retry:', error);
    }
  }, []);

  // Propriétés calculées
  const hasErrors = lastError !== null || (lastResult && !lastResult.success);
  const recentAttempts = stats.recentAttempts;

  return {
    // État du retry
    isRetrying,
    currentAttempt,
    totalAttempts,
    lastError,
    lastResult,
    
    // Actions de retry
    executeWithRetry,
    executeSyncWithRetry,
    executeNetworkWithRetry,
    executeCriticalWithRetry,
    
    // Statistiques et historique
    stats,
    history,
    refreshStats,
    refreshHistory,
    clearHistory,
    
    // Utilitaires
    isInitialized,
    hasErrors,
    recentAttempts
  };
};

/**
 * Hook simplifié pour vérifier si un retry est en cours
 */
export const useIsRetrying = (): boolean => {
  const { isRetrying } = useRetry();
  return isRetrying;
};

/**
 * Hook pour obtenir les statistiques de retry
 */
export const useRetryStats = (): RetryStats => {
  const { stats } = useRetry();
  return stats;
};

/**
 * Hook pour obtenir l'historique des retries
 */
export const useRetryHistory = (): RetryHistory | null => {
  const { history } = useRetry();
  return history;
};

/**
 * Hook pour exécuter une opération avec retry automatique
 */
export const useRetryOperation = <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
) => {
  const { executeWithRetry, isRetrying, lastError, lastResult } = useRetry();

  const execute = useCallback(async (): Promise<RetryResult<T>> => {
    return executeWithRetry(operation, options);
  }, [executeWithRetry, operation, options]);

  return {
    execute,
    isRetrying,
    lastError,
    lastResult,
    isSuccess: lastResult?.success || false,
    isError: hasErrors
  };
};

/**
 * Hook pour exécuter une opération de synchronisation avec retry
 */
export const useSyncRetry = <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
) => {
  const { executeSyncWithRetry, isRetrying, lastError, lastResult } = useRetry();

  const execute = useCallback(async (): Promise<RetryResult<T>> => {
    return executeSyncWithRetry(operation, options);
  }, [executeSyncWithRetry, operation, options]);

  return {
    execute,
    isRetrying,
    lastError,
    lastResult,
    isSuccess: lastResult?.success || false,
    isError: lastError !== null || (lastResult && !lastResult.success)
  };
};

/**
 * Hook pour exécuter une opération réseau avec retry agressif
 */
export const useNetworkRetry = <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
) => {
  const { executeNetworkWithRetry, isRetrying, lastError, lastResult } = useRetry();

  const execute = useCallback(async (): Promise<RetryResult<T>> => {
    return executeNetworkWithRetry(operation, options);
  }, [executeNetworkWithRetry, operation, options]);

  return {
    execute,
    isRetrying,
    lastError,
    lastResult,
    isSuccess: lastResult?.success || false,
    isError: lastError !== null || (lastResult && !lastResult.success)
  };
};

