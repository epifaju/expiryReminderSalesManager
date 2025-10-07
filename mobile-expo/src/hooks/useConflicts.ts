/**
 * Hook React pour utiliser le service de résolution de conflits
 * Fournit une interface simple pour les composants React
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import ConflictService from '../services/conflicts/ConflictService';
import {
  Conflict,
  ConflictResolutionStrategy,
  ConflictStatus,
  ConflictSeverity,
  ConflictResolution,
  ConflictMetrics,
  ConflictReport,
  ConflictConfig,
  ConflictEvent,
  ConflictEventListener,
  ConflictContext,
  ConflictResolutionRule,
  ConflictResolutionResult
} from '../types/conflicts';

/**
 * Interface du hook useConflicts
 */
export interface UseConflictsReturn {
  // État des conflits
  conflicts: Conflict[];
  pendingConflicts: Conflict[];
  resolvedConflicts: Conflict[];
  isInitialized: boolean;
  
  // Actions de résolution
  detectConflicts: (clientData: any, serverData: any, entityType: string, context: ConflictContext) => Conflict[];
  resolveConflict: (conflict: Conflict, strategy?: ConflictResolutionStrategy) => Promise<ConflictResolutionResult>;
  resolveConflicts: (conflicts: Conflict[]) => Promise<ConflictResolutionResult[]>;
  
  // Gestion des règles
  addResolutionRule: (rule: ConflictResolutionRule) => void;
  removeResolutionRule: (ruleId: string) => void;
  getResolutionRules: () => ConflictResolutionRule[];
  
  // Métriques et rapports
  metrics: ConflictMetrics;
  generateReport: (period: { start: string; end: string }) => Promise<ConflictReport>;
  
  // Utilitaires
  hasConflicts: boolean;
  hasPendingConflicts: boolean;
  conflictCount: number;
  pendingCount: number;
}

/**
 * Hook pour utiliser le service de résolution de conflits
 */
export const useConflicts = (): UseConflictsReturn => {
  // États locaux
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [pendingConflicts, setPendingConflicts] = useState<Conflict[]>([]);
  const [resolvedConflicts, setResolvedConflicts] = useState<Conflict[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [metrics, setMetrics] = useState<ConflictMetrics>(ConflictService.getMetrics());

  // Référence pour éviter les re-renders inutiles
  const eventListenerRef = useRef<ConflictEventListener | null>(null);

  // Initialisation du listener d'événements
  useEffect(() => {
    if (!eventListenerRef.current) {
      eventListenerRef.current = (event: ConflictEvent) => {
        // Mettre à jour les conflits selon le type d'événement
        switch (event.type) {
          case 'conflict_detected':
            refreshConflicts();
            break;
          case 'conflict_resolved':
            refreshConflicts();
            setMetrics(ConflictService.getMetrics());
            break;
          case 'conflict_escalated':
          case 'conflict_failed':
            refreshConflicts();
            setMetrics(ConflictService.getMetrics());
            break;
        }
      };

      ConflictService.addEventListener(eventListenerRef.current);
    }

    return () => {
      if (eventListenerRef.current) {
        ConflictService.removeEventListener(eventListenerRef.current);
        eventListenerRef.current = null;
      }
    };
  }, []);

  // Initialisation du service
  useEffect(() => {
    const initializeService = async () => {
      try {
        await ConflictService.initialize();
        setIsInitialized(true);
        refreshConflicts();
        setMetrics(ConflictService.getMetrics());
      } catch (error) {
        console.error('Erreur initialisation ConflictService:', error);
      }
    };

    initializeService();
  }, []);

  // Actualise la liste des conflits
  const refreshConflicts = useCallback(() => {
    const allConflicts = Array.from(ConflictService['conflicts'].values());
    setConflicts(allConflicts);
    setPendingConflicts(ConflictService.getPendingConflicts());
    setResolvedConflicts(ConflictService.getResolvedConflicts());
  }, []);

  // Actions de détection et résolution
  const detectConflicts = useCallback((
    clientData: any,
    serverData: any,
    entityType: string,
    context: ConflictContext
  ): Conflict[] => {
    try {
      const detectedConflicts = ConflictService.detectConflicts(clientData, serverData, entityType, context);
      refreshConflicts();
      setMetrics(ConflictService.getMetrics());
      return detectedConflicts;
    } catch (error) {
      console.error('Erreur détection conflits:', error);
      throw error;
    }
  }, [refreshConflicts]);

  const resolveConflict = useCallback(async (
    conflict: Conflict,
    strategy?: ConflictResolutionStrategy
  ): Promise<ConflictResolutionResult> => {
    try {
      const result = await ConflictService.resolveConflict(conflict, strategy);
      refreshConflicts();
      setMetrics(ConflictService.getMetrics());
      return result;
    } catch (error) {
      console.error('Erreur résolution conflit:', error);
      throw error;
    }
  }, [refreshConflicts]);

  const resolveConflicts = useCallback(async (
    conflicts: Conflict[]
  ): Promise<ConflictResolutionResult[]> => {
    try {
      const results = await ConflictService.resolveConflicts(conflicts);
      refreshConflicts();
      setMetrics(ConflictService.getMetrics());
      return results;
    } catch (error) {
      console.error('Erreur résolution conflits:', error);
      throw error;
    }
  }, [refreshConflicts]);

  // Gestion des règles
  const addResolutionRule = useCallback((rule: ConflictResolutionRule) => {
    ConflictService.addResolutionRule(rule);
  }, []);

  const removeResolutionRule = useCallback((ruleId: string) => {
    ConflictService.removeResolutionRule(ruleId);
  }, []);

  const getResolutionRules = useCallback((): ConflictResolutionRule[] => {
    return ConflictService.getResolutionRules();
  }, []);

  // Métriques et rapports
  const generateReport = useCallback(async (
    period: { start: string; end: string }
  ): Promise<ConflictReport> => {
    try {
      const report = await ConflictService.generateReport(period);
      return report;
    } catch (error) {
      console.error('Erreur génération rapport:', error);
      throw error;
    }
  }, []);

  // Propriétés calculées
  const hasConflicts = conflicts.length > 0;
  const hasPendingConflicts = pendingConflicts.length > 0;
  const conflictCount = conflicts.length;
  const pendingCount = pendingConflicts.length;

  return {
    // État des conflits
    conflicts,
    pendingConflicts,
    resolvedConflicts,
    isInitialized,
    
    // Actions de résolution
    detectConflicts,
    resolveConflict,
    resolveConflicts,
    
    // Gestion des règles
    addResolutionRule,
    removeResolutionRule,
    getResolutionRules,
    
    // Métriques et rapports
    metrics,
    generateReport,
    
    // Utilitaires
    hasConflicts,
    hasPendingConflicts,
    conflictCount,
    pendingCount
  };
};

/**
 * Hook simplifié pour vérifier s'il y a des conflits
 */
export const useHasConflicts = (): boolean => {
  const { hasConflicts } = useConflicts();
  return hasConflicts;
};

/**
 * Hook pour obtenir les conflits en attente
 */
export const usePendingConflicts = (): Conflict[] => {
  const { pendingConflicts } = useConflicts();
  return pendingConflicts;
};

/**
 * Hook pour obtenir les métriques de conflits
 */
export const useConflictMetrics = (): ConflictMetrics => {
  const { metrics } = useConflicts();
  return metrics;
};

/**
 * Hook pour résoudre un conflit spécifique
 */
export const useConflictResolution = (conflict: Conflict | null) => {
  const { resolveConflict } = useConflicts();
  const [isResolving, setIsResolving] = useState(false);
  const [result, setResult] = useState<ConflictResolutionResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const resolve = useCallback(async (strategy?: ConflictResolutionStrategy) => {
    if (!conflict) return;

    setIsResolving(true);
    setError(null);

    try {
      const resolutionResult = await resolveConflict(conflict, strategy);
      setResult(resolutionResult);
      return resolutionResult;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur de résolution');
      setError(error);
      throw error;
    } finally {
      setIsResolving(false);
    }
  }, [conflict, resolveConflict]);

  return {
    resolve,
    isResolving,
    result,
    error,
    isSuccess: result?.success || false,
    requiresApproval: result?.requiresApproval || false,
    confidence: result?.confidence || 0
  };
};

/**
 * Hook pour la détection automatique de conflits
 */
export const useConflictDetection = () => {
  const { detectConflicts } = useConflicts();
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedConflicts, setDetectedConflicts] = useState<Conflict[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const detect = useCallback(async (
    clientData: any,
    serverData: any,
    entityType: string,
    context: ConflictContext
  ) => {
    setIsDetecting(true);
    setError(null);

    try {
      const conflicts = detectConflicts(clientData, serverData, entityType, context);
      setDetectedConflicts(conflicts);
      return conflicts;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur de détection');
      setError(error);
      throw error;
    } finally {
      setIsDetecting(false);
    }
  }, [detectConflicts]);

  const clear = useCallback(() => {
    setDetectedConflicts([]);
    setError(null);
  }, []);

  return {
    detect,
    clear,
    isDetecting,
    detectedConflicts,
    error,
    hasConflicts: detectedConflicts.length > 0,
    conflictCount: detectedConflicts.length
  };
};

/**
 * Hook pour la résolution automatique de conflits
 */
export const useAutoConflictResolution = () => {
  const { resolveConflicts } = useConflicts();
  const [isResolving, setIsResolving] = useState(false);
  const [results, setResults] = useState<ConflictResolutionResult[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const resolveAll = useCallback(async (conflicts: Conflict[]) => {
    if (conflicts.length === 0) return [];

    setIsResolving(true);
    setError(null);

    try {
      const resolutionResults = await resolveConflicts(conflicts);
      setResults(resolutionResults);
      return resolutionResults;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur de résolution automatique');
      setError(error);
      throw error;
    } finally {
      setIsResolving(false);
    }
  }, [resolveConflicts]);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  const requiresApprovalCount = results.filter(r => r.requiresApproval).length;

  return {
    resolveAll,
    clear,
    isResolving,
    results,
    error,
    successCount,
    failureCount,
    requiresApprovalCount,
    totalProcessed: results.length,
    successRate: results.length > 0 ? successCount / results.length : 0
  };
};

