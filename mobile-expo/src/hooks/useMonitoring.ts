/**
 * Hook React pour le monitoring et l'observabilité
 * 
 * Facilite l'utilisation des services de monitoring dans les composants React
 * 
 * @author Sales Manager Team
 * @version 1.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import MonitoringService from '../services/monitoring/MonitoringService';
import ObservabilityService from '../services/monitoring/ObservabilityService';
import {
  Metric,
  MetricType,
  MetricCategory,
  Alert,
  AlertStatus,
  MonitoringStats,
  MonitoringReport,
  ReportType,
  TimePeriod,
  HealthCheck,
  LogLevel,
  LogEntry,
  Trace,
  MonitoringEventListener,
  MonitoringConfig,
  LogContext,
} from '../types/monitoring';

/**
 * Interface de retour du hook principal
 */
export interface UseMonitoringReturn {
  // État
  stats: MonitoringStats | null;
  health: HealthCheck | null;
  alerts: Alert[];
  isHealthy: boolean;
  
  // Métriques
  collectMetric: (metric: Omit<Metric, 'id' | 'timestamp'>) => void;
  getStats: () => MonitoringStats;
  
  // Alertes
  getAlerts: (status?: AlertStatus) => Alert[];
  activeAlertsCount: number;
  
  // Rapports
  generateReport: (type: ReportType, period: TimePeriod) => Promise<MonitoringReport>;
  
  // Santé
  checkHealth: () => Promise<HealthCheck>;
  
  // Logs
  log: (level: LogLevel, message: string, metadata?: Record<string, any>) => void;
  getLogs: (level?: LogLevel, limit?: number) => LogEntry[];
  
  // Traces
  trace: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
  getTraces: (limit?: number) => Trace[];
  
  // Utilitaires
  cleanup: () => Promise<void>;
  refresh: () => void;
}

/**
 * Hook principal de monitoring
 */
export function useMonitoring(): UseMonitoringReturn {
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Calculer si le système est en bonne santé
  const isHealthy = health?.status === 'healthy';
  const activeAlertsCount = alerts.filter(a => a.status === AlertStatus.ACTIVE).length;
  
  // Collecter une métrique
  const collectMetric = useCallback((metric: Omit<Metric, 'id' | 'timestamp'>) => {
    MonitoringService.collectMetric(metric);
  }, []);
  
  // Obtenir les statistiques
  const getStats = useCallback(() => {
    return MonitoringService.getStats();
  }, []);
  
  // Obtenir les alertes
  const getAlerts = useCallback((status?: AlertStatus) => {
    return MonitoringService.getAlerts(status);
  }, []);
  
  // Générer un rapport
  const generateReport = useCallback(async (type: ReportType, period: TimePeriod) => {
    return await MonitoringService.generateReport(type, period);
  }, []);
  
  // Vérifier la santé
  const checkHealth = useCallback(async () => {
    const healthCheck = await MonitoringService.healthCheck();
    setHealth(healthCheck);
    return healthCheck;
  }, []);
  
  // Logger
  const log = useCallback((level: LogLevel, message: string, metadata?: Record<string, any>) => {
    ObservabilityService.log(level, message, undefined, metadata);
  }, []);
  
  // Obtenir les logs
  const getLogs = useCallback((level?: LogLevel, limit: number = 100) => {
    return ObservabilityService.getLogs(level, limit);
  }, []);
  
  // Tracer une opération
  const trace = useCallback(async <T,>(name: string, fn: () => Promise<T>) => {
    return await ObservabilityService.trace(name, fn);
  }, []);
  
  // Obtenir les traces
  const getTraces = useCallback((limit: number = 50) => {
    return ObservabilityService.getTraces(limit);
  }, []);
  
  // Nettoyer
  const cleanup = useCallback(async () => {
    await MonitoringService.cleanup();
    await ObservabilityService.cleanup();
  }, []);
  
  // Rafraîchir les données
  const refresh = useCallback(() => {
    setStats(MonitoringService.getStats());
    setAlerts(MonitoringService.getAlerts());
    checkHealth();
  }, [checkHealth]);
  
  // Initialisation et rafraîchissement automatique
  useEffect(() => {
    // Charger les données initiales
    refresh();
    
    // Rafraîchir toutes les 5 secondes
    refreshInterval.current = setInterval(refresh, 5000);
    
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [refresh]);
  
  return {
    stats,
    health,
    alerts,
    isHealthy,
    collectMetric,
    getStats,
    getAlerts,
    activeAlertsCount,
    generateReport,
    checkHealth,
    log,
    getLogs,
    trace,
    getTraces,
    cleanup,
    refresh,
  };
}

/**
 * Hook pour surveiller les métriques spécifiques
 */
export function useMetric(
  name: string,
  type: MetricType,
  category: MetricCategory
) {
  const collect = useCallback((value: number, tags?: Record<string, string>) => {
    MonitoringService.collectMetric({
      name,
      type,
      category,
      value,
      tags,
    });
  }, [name, type, category]);
  
  return { collect };
}

/**
 * Hook pour tracker les performances d'un composant
 */
export function usePerformanceTracking(componentName: string) {
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());
  
  useEffect(() => {
    renderCount.current += 1;
    
    // Collecter métrique de render
    MonitoringService.collectMetric({
      name: 'component.render',
      type: MetricType.COUNTER,
      category: MetricCategory.PERFORMANCE,
      value: 1,
      tags: { component: componentName },
    });
    
    // Collecter temps de montage au premier render
    if (renderCount.current === 1) {
      const mountDuration = Date.now() - mountTime.current;
      MonitoringService.collectMetric({
        name: 'component.mount.duration',
        type: MetricType.TIMER,
        category: MetricCategory.PERFORMANCE,
        value: mountDuration,
        unit: 'ms',
        tags: { component: componentName },
      });
    }
  });
  
  return {
    renderCount: renderCount.current,
  };
}

/**
 * Hook pour les alertes actives
 */
export function useActiveAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  useEffect(() => {
    const updateAlerts = () => {
      setAlerts(MonitoringService.getAlerts(AlertStatus.ACTIVE));
    };
    
    updateAlerts();
    const interval = setInterval(updateAlerts, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    alerts,
    count: alerts.length,
    hasCritical: alerts.some(a => a.severity === 'critical'),
  };
}

/**
 * Hook pour les logs en temps réel
 */
export function useLogs(level?: LogLevel, limit: number = 50) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  useEffect(() => {
    const updateLogs = () => {
      setLogs(ObservabilityService.getLogs(level, limit));
    };
    
    updateLogs();
    const interval = setInterval(updateLogs, 2000);
    
    return () => clearInterval(interval);
  }, [level, limit]);
  
  return { logs };
}

/**
 * Hook pour tracer automatiquement une opération
 */
export function useTraceOperation(operationName: string) {
  const execute = useCallback(async <T,>(fn: () => Promise<T>) => {
    return await ObservabilityService.trace(operationName, fn);
  }, [operationName]);
  
  return { execute };
}

/**
 * Hook pour le contexte d'observabilité
 */
export function useObservabilityContext(initialContext?: Partial<LogContext>) {
  useEffect(() => {
    if (initialContext) {
      ObservabilityService.setContext(initialContext);
    }
  }, [initialContext]);
  
  const setContext = useCallback((context: Partial<LogContext>) => {
    ObservabilityService.setContext(context);
  }, []);
  
  const getContext = useCallback(() => {
    return ObservabilityService.getContext();
  }, []);
  
  return { setContext, getContext };
}

/**
 * Hook pour écouter les événements de monitoring
 */
export function useMonitoringEvents(listener: MonitoringEventListener) {
  useEffect(() => {
    MonitoringService.addEventListener(listener);
    
    return () => {
      MonitoringService.removeEventListener(listener);
    };
  }, [listener]);
}

/**
 * Hook pour mesurer le temps d'exécution
 */
export function useExecutionTimer(metricName: string, category: MetricCategory = MetricCategory.PERFORMANCE) {
  const startTimer = useCallback(() => {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      MonitoringService.collectMetric({
        name: metricName,
        type: MetricType.TIMER,
        category,
        value: duration,
        unit: 'ms',
      });
      return duration;
    };
  }, [metricName, category]);
  
  return { startTimer };
}

export default useMonitoring;

