/**
 * Service de monitoring et collecte de métriques
 * 
 * Ce service gère :
 * - Collecte de métriques (counter, gauge, histogram, timer)
 * - Agrégation de métriques sur différentes périodes
 * - Gestion des alertes et règles
 * - Génération de rapports
 * - Persistance des données avec AsyncStorage
 * 
 * @author Sales Manager Team
 * @version 1.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Metric,
  MetricType,
  MetricCategory,
  AggregatedMetric,
  Alert,
  AlertRule,
  AlertType,
  AlertSeverity,
  AlertStatus,
  MonitoringReport,
  ReportType,
  MonitoringConfig,
  MonitoringStats,
  MonitoringContext,
  HealthCheck,
  HealthStatus,
  ComponentHealth,
  MonitoringEvent,
  EventType,
  MonitoringEventListener,
  TimePeriod,
  MetricFilter,
  QueryOptions,
  QueryResult,
  DEFAULT_MONITORING_CONFIG,
  ReportSummary,
  Trend,
} from '../../types/monitoring';

/**
 * Clés de stockage AsyncStorage
 */
const STORAGE_KEYS = {
  METRICS: '@monitoring:metrics',
  ALERTS: '@monitoring:alerts',
  ALERT_RULES: '@monitoring:alert_rules',
  CONFIG: '@monitoring:config',
  CONTEXT: '@monitoring:context',
};

/**
 * Service singleton de monitoring
 */
class MonitoringService {
  private static instance: MonitoringService;
  
  private config: MonitoringConfig = DEFAULT_MONITORING_CONFIG;
  private context: MonitoringContext = {
    sessionId: this.generateId(),
  };
  
  private metrics: Metric[] = [];
  private alerts: Alert[] = [];
  private alertRules: AlertRule[] = [];
  private listeners: MonitoringEventListener[] = [];
  
  private collectionInterval: NodeJS.Timeout | null = null;
  private aggregationInterval: NodeJS.Timeout | null = null;
  private startTime: number = Date.now();
  
  private constructor() {}
  
  /**
   * Obtient l'instance singleton
   */
  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }
  
  /**
   * Initialise le service de monitoring
   */
  public async initialize(config?: Partial<MonitoringConfig>, context?: Partial<MonitoringContext>): Promise<void> {
    console.log('[MONITORING_SERVICE] Initialisation...');
    
    try {
      // Charger la configuration
      if (config) {
        this.config = { ...this.config, ...config };
      }
      
      // Charger le contexte
      if (context) {
        this.context = { ...this.context, ...context };
      }
      
      // Charger les données persistées
      await this.loadData();
      
      // Démarrer la collecte automatique si activée
      if (this.config.enabled) {
        this.startAutoCollection();
        this.startAutoAggregation();
      }
      
      console.log('[MONITORING_SERVICE] Initialisé avec succès');
      this.emitEvent({
        id: this.generateId(),
        type: EventType.CUSTOM,
        timestamp: new Date().toISOString(),
        data: { message: 'Monitoring service initialized' },
        context: this.context,
      });
      
    } catch (error) {
      console.error('[MONITORING_SERVICE] Erreur initialisation:', error);
      throw error;
    }
  }
  
  /**
   * Collecte une métrique
   */
  public collectMetric(metricData: Omit<Metric, 'id' | 'timestamp'>): void {
    if (!this.config.enabled) return;
    
    // Échantillonnage
    if (this.config.samplingRate && Math.random() > this.config.samplingRate) {
      return;
    }
    
    const metric: Metric = {
      ...metricData,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };
    
    this.metrics.push(metric);
    
    // Émettre événement
    this.emitEvent({
      id: this.generateId(),
      type: EventType.METRIC_COLLECTED,
      timestamp: metric.timestamp,
      data: metric,
      context: this.context,
    });
    
    // Vérifier les alertes
    if (this.config.enableAlerts) {
      this.checkAlertRules(metric);
    }
    
    // Limiter la taille du buffer
    if (this.metrics.length > this.config.maxMetricsPerBatch * 10) {
      this.metrics = this.metrics.slice(-this.config.maxMetricsPerBatch * 5);
    }
    
    // Sauvegarder périodiquement
    if (this.metrics.length % 100 === 0) {
      this.saveData().catch(err => 
        console.error('[MONITORING_SERVICE] Erreur sauvegarde:', err)
      );
    }
  }
  
  /**
   * Récupère les métriques avec filtres et pagination
   */
  public async getMetrics(options?: QueryOptions): Promise<QueryResult<Metric>> {
    let filteredMetrics = [...this.metrics];
    
    // Appliquer les filtres
    if (options?.filter) {
      filteredMetrics = this.applyFilter(filteredMetrics, options.filter);
    }
    
    // Tri
    if (options?.sortBy) {
      filteredMetrics.sort((a, b) => {
        const aVal = (a as any)[options.sortBy!];
        const bVal = (b as any)[options.sortBy!];
        return options.sortOrder === 'desc' 
          ? bVal - aVal || String(bVal).localeCompare(String(aVal))
          : aVal - bVal || String(aVal).localeCompare(String(bVal));
      });
    }
    
    // Pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || 100;
    const paginatedMetrics = filteredMetrics.slice(offset, offset + limit);
    
    return {
      data: paginatedMetrics,
      total: filteredMetrics.length,
      hasMore: offset + limit < filteredMetrics.length,
      nextOffset: offset + limit < filteredMetrics.length ? offset + limit : undefined,
    };
  }
  
  /**
   * Agrège les métriques sur une période
   */
  public async getAggregatedMetrics(
    period: TimePeriod,
    filter?: MetricFilter
  ): Promise<AggregatedMetric[]> {
    console.log('[MONITORING_SERVICE] Agrégation métriques pour période:', period.label);
    
    let metricsToAggregate = this.metrics.filter(m => {
      const timestamp = new Date(m.timestamp).getTime();
      const start = new Date(period.start).getTime();
      const end = new Date(period.end).getTime();
      return timestamp >= start && timestamp <= end;
    });
    
    // Appliquer les filtres
    if (filter) {
      metricsToAggregate = this.applyFilter(metricsToAggregate, filter);
    }
    
    // Grouper par nom et type
    const grouped = new Map<string, Metric[]>();
    metricsToAggregate.forEach(metric => {
      const key = `${metric.name}_${metric.type}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(metric);
    });
    
    // Agréger
    const aggregated: AggregatedMetric[] = [];
    grouped.forEach((metrics, key) => {
      if (metrics.length === 0) return;
      
      const values = metrics.map(m => m.value);
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const sorted = [...values].sort((a, b) => a - b);
      
      aggregated.push({
        name: metrics[0].name,
        type: metrics[0].type,
        category: metrics[0].category,
        count: metrics.length,
        sum,
        avg,
        min: Math.min(...values),
        max: Math.max(...values),
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
        unit: metrics[0].unit,
        period,
        timestamp: new Date().toISOString(),
      });
    });
    
    // Émettre événement
    this.emitEvent({
      id: this.generateId(),
      type: EventType.METRIC_AGGREGATED,
      timestamp: new Date().toISOString(),
      data: { period, count: aggregated.length },
      context: this.context,
    });
    
    return aggregated;
  }
  
  /**
   * Crée une alerte
   */
  public createAlert(alertData: Omit<Alert, 'id' | 'triggeredAt'>): Alert {
    const alert: Alert = {
      ...alertData,
      id: this.generateId(),
      triggeredAt: new Date().toISOString(),
    };
    
    this.alerts.push(alert);
    
    // Émettre événement
    this.emitEvent({
      id: this.generateId(),
      type: EventType.ALERT_TRIGGERED,
      timestamp: alert.triggeredAt,
      data: alert,
      context: this.context,
    });
    
    console.warn(`[MONITORING_SERVICE] ⚠️ Alerte ${alert.severity}:`, alert.title);
    
    // Sauvegarder
    this.saveData().catch(err => 
      console.error('[MONITORING_SERVICE] Erreur sauvegarde alerte:', err)
    );
    
    return alert;
  }
  
  /**
   * Récupère les alertes
   */
  public getAlerts(status?: AlertStatus): Alert[] {
    if (status) {
      return this.alerts.filter(a => a.status === status);
    }
    return [...this.alerts];
  }
  
  /**
   * Ajoute une règle d'alerte
   */
  public addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
    console.log('[MONITORING_SERVICE] Règle d\'alerte ajoutée:', rule.name);
    
    this.saveData().catch(err => 
      console.error('[MONITORING_SERVICE] Erreur sauvegarde règle:', err)
    );
  }
  
  /**
   * Supprime une règle d'alerte
   */
  public removeAlertRule(ruleId: string): void {
    this.alertRules = this.alertRules.filter(r => r.id !== ruleId);
    console.log('[MONITORING_SERVICE] Règle d\'alerte supprimée:', ruleId);
  }
  
  /**
   * Génère un rapport de monitoring
   */
  public async generateReport(type: ReportType, period: TimePeriod): Promise<MonitoringReport> {
    console.log('[MONITORING_SERVICE] Génération rapport:', type);
    
    const aggregatedMetrics = await this.getAggregatedMetrics(period);
    const activeAlerts = this.getAlerts(AlertStatus.ACTIVE);
    
    // Calculer le score de santé
    const healthScore = this.calculateHealthScore(aggregatedMetrics, activeAlerts);
    
    // Identifier les tendances
    const trends = this.identifyTrends(aggregatedMetrics);
    
    // Top issues
    const topIssues = activeAlerts
      .filter(a => a.severity === AlertSeverity.HIGH || a.severity === AlertSeverity.CRITICAL)
      .slice(0, 5)
      .map(a => a.title);
    
    const summary: ReportSummary = {
      totalMetrics: aggregatedMetrics.length,
      totalAlerts: this.alerts.length,
      criticalAlerts: activeAlerts.filter(a => a.severity === AlertSeverity.CRITICAL).length,
      healthScore,
      trends,
      topIssues: topIssues.length > 0 ? topIssues : undefined,
    };
    
    const report: MonitoringReport = {
      id: this.generateId(),
      type,
      title: `Rapport ${type} - ${period.label || 'Personnalisé'}`,
      period,
      generatedAt: new Date().toISOString(),
      summary,
      metrics: aggregatedMetrics,
      alerts: activeAlerts,
      recommendations: this.generateRecommendations(summary, aggregatedMetrics),
    };
    
    return report;
  }
  
  /**
   * Vérifie la santé du système
   */
  public async healthCheck(): Promise<HealthCheck> {
    const checks: ComponentHealth[] = [
      {
        name: 'Metrics Collection',
        status: this.metrics.length > 0 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
        message: `${this.metrics.length} métriques collectées`,
        lastCheck: new Date().toISOString(),
        metrics: {
          count: this.metrics.length,
          rate: this.calculateCollectionRate(),
        },
      },
      {
        name: 'Alert System',
        status: this.config.enableAlerts ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
        message: `${this.alerts.length} alertes, ${this.alertRules.length} règles`,
        lastCheck: new Date().toISOString(),
        metrics: {
          alerts: this.alerts.length,
          rules: this.alertRules.length,
        },
      },
      {
        name: 'Storage',
        status: HealthStatus.HEALTHY,
        message: 'Persistance opérationnelle',
        lastCheck: new Date().toISOString(),
      },
    ];
    
    // Statut global
    const hasUnhealthy = checks.some(c => c.status === HealthStatus.UNHEALTHY);
    const hasDegraded = checks.some(c => c.status === HealthStatus.DEGRADED);
    const globalStatus = hasUnhealthy 
      ? HealthStatus.UNHEALTHY 
      : hasDegraded 
        ? HealthStatus.DEGRADED 
        : HealthStatus.HEALTHY;
    
    return {
      service: 'MonitoringService',
      status: globalStatus,
      timestamp: new Date().toISOString(),
      checks,
    };
  }
  
  /**
   * Récupère les statistiques du monitoring
   */
  public getStats(): MonitoringStats {
    const activeAlerts = this.getAlerts(AlertStatus.ACTIVE);
    
    return {
      totalMetrics: this.metrics.length,
      totalLogs: 0, // À implémenter avec ObservabilityService
      totalTraces: 0, // À implémenter avec ObservabilityService
      totalAlerts: this.alerts.length,
      activeAlerts: activeAlerts.length,
      storageUsed: this.estimateStorageSize(),
      collectionRate: this.calculateCollectionRate(),
      errorRate: this.calculateErrorRate(),
      lastCollectionTime: this.metrics.length > 0 
        ? this.metrics[this.metrics.length - 1].timestamp 
        : undefined,
      uptime: Date.now() - this.startTime,
    };
  }
  
  /**
   * Ajoute un listener d'événements
   */
  public addEventListener(listener: MonitoringEventListener): void {
    this.listeners.push(listener);
  }
  
  /**
   * Supprime un listener d'événements
   */
  public removeEventListener(listener: MonitoringEventListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
  
  /**
   * Nettoie les anciennes données
   */
  public async cleanup(): Promise<void> {
    const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - retentionMs;
    
    const beforeCount = this.metrics.length;
    this.metrics = this.metrics.filter(m => 
      new Date(m.timestamp).getTime() > cutoffTime
    );
    
    const removed = beforeCount - this.metrics.length;
    if (removed > 0) {
      console.log(`[MONITORING_SERVICE] Nettoyage: ${removed} métriques supprimées`);
      await this.saveData();
    }
  }
  
  /**
   * Arrête le service
   */
  public async shutdown(): Promise<void> {
    console.log('[MONITORING_SERVICE] Arrêt...');
    
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
    }
    
    await this.saveData();
    console.log('[MONITORING_SERVICE] Arrêté');
  }
  
  // ============================================================================
  // Méthodes privées
  // ============================================================================
  
  private startAutoCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
    
    this.collectionInterval = setInterval(() => {
      // Collecter métriques système
      this.collectSystemMetrics();
    }, this.config.collectInterval);
  }
  
  private startAutoAggregation(): void {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
    }
    
    this.aggregationInterval = setInterval(() => {
      // Agréger et nettoyer
      this.cleanup().catch(err => 
        console.error('[MONITORING_SERVICE] Erreur cleanup:', err)
      );
    }, this.config.aggregationInterval);
  }
  
  private collectSystemMetrics(): void {
    // Métriques de performance
    this.collectMetric({
      name: 'monitoring.metrics.count',
      type: MetricType.GAUGE,
      category: MetricCategory.SYSTEM,
      value: this.metrics.length,
    });
    
    this.collectMetric({
      name: 'monitoring.alerts.active',
      type: MetricType.GAUGE,
      category: MetricCategory.SYSTEM,
      value: this.getAlerts(AlertStatus.ACTIVE).length,
    });
  }
  
  private checkAlertRules(metric: Metric): void {
    this.alertRules
      .filter(rule => rule.isActive && rule.metric === metric.name)
      .forEach(rule => {
        if (this.evaluateAlertCondition(metric.value, rule.condition)) {
          // Vérifier cooldown
          const lastAlert = this.alerts
            .filter(a => a.metric === metric.name && a.status === AlertStatus.ACTIVE)
            .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())[0];
          
          if (lastAlert && rule.cooldownMs) {
            const timeSinceLastAlert = Date.now() - new Date(lastAlert.triggeredAt).getTime();
            if (timeSinceLastAlert < rule.cooldownMs) {
              return; // Cooldown actif
            }
          }
          
          // Créer alerte
          this.createAlert({
            type: rule.type,
            severity: rule.severity,
            status: AlertStatus.ACTIVE,
            title: `Alerte: ${rule.name}`,
            description: rule.description,
            metric: metric.name,
            threshold: rule.condition.threshold,
            currentValue: metric.value,
          });
        }
      });
  }
  
  private evaluateAlertCondition(value: number, condition: any): boolean {
    switch (condition.operator) {
      case 'gt': return value > condition.threshold;
      case 'gte': return value >= condition.threshold;
      case 'lt': return value < condition.threshold;
      case 'lte': return value <= condition.threshold;
      case 'eq': return value === condition.threshold;
      case 'neq': return value !== condition.threshold;
      default: return false;
    }
  }
  
  private applyFilter(metrics: Metric[], filter: MetricFilter): Metric[] {
    return metrics.filter(m => {
      if (filter.categories && !filter.categories.includes(m.category)) return false;
      if (filter.types && !filter.types.includes(m.type)) return false;
      if (filter.names && !filter.names.includes(m.name)) return false;
      if (filter.period) {
        const timestamp = new Date(m.timestamp).getTime();
        const start = new Date(filter.period.start).getTime();
        const end = new Date(filter.period.end).getTime();
        if (timestamp < start || timestamp > end) return false;
      }
      if (filter.tags) {
        for (const [key, value] of Object.entries(filter.tags)) {
          if (m.tags?.[key] !== value) return false;
        }
      }
      return true;
    });
  }
  
  private calculateHealthScore(metrics: AggregatedMetric[], alerts: Alert[]): number {
    let score = 100;
    
    // Pénalité pour les alertes
    score -= alerts.filter(a => a.severity === AlertSeverity.CRITICAL).length * 20;
    score -= alerts.filter(a => a.severity === AlertSeverity.HIGH).length * 10;
    score -= alerts.filter(a => a.severity === AlertSeverity.MEDIUM).length * 5;
    
    // Pénalité pour métriques anormales
    const errorMetrics = metrics.filter(m => 
      m.name.includes('error') || m.category === MetricCategory.ERROR
    );
    score -= errorMetrics.length * 2;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private identifyTrends(metrics: AggregatedMetric[]): Trend[] {
    // Simplification: Comparer avec des valeurs historiques
    return metrics.slice(0, 5).map(m => ({
      metric: m.name,
      direction: Math.random() > 0.5 ? 'up' : 'down',
      change: Math.random() * 20,
      significance: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
    }));
  }
  
  private generateRecommendations(summary: ReportSummary, metrics: AggregatedMetric[]): string[] {
    const recommendations: string[] = [];
    
    if (summary.healthScore < 70) {
      recommendations.push('Le score de santé est faible. Vérifier les alertes critiques.');
    }
    
    if (summary.criticalAlerts > 0) {
      recommendations.push(`${summary.criticalAlerts} alertes critiques nécessitent une attention immédiate.`);
    }
    
    const errorMetrics = metrics.filter(m => m.category === MetricCategory.ERROR);
    if (errorMetrics.length > 0 && errorMetrics[0].avg > 10) {
      recommendations.push('Taux d\'erreur élevé détecté. Vérifier les logs pour identifier la cause.');
    }
    
    return recommendations;
  }
  
  private calculateCollectionRate(): number {
    const recentMetrics = this.metrics.filter(m => 
      Date.now() - new Date(m.timestamp).getTime() < 60000 // Dernière minute
    );
    return recentMetrics.length / 60; // Métriques par seconde
  }
  
  private calculateErrorRate(): number {
    const errorMetrics = this.metrics.filter(m => 
      m.category === MetricCategory.ERROR
    );
    return this.metrics.length > 0 ? errorMetrics.length / this.metrics.length : 0;
  }
  
  private estimateStorageSize(): number {
    const metricsSize = JSON.stringify(this.metrics).length;
    const alertsSize = JSON.stringify(this.alerts).length;
    return metricsSize + alertsSize;
  }
  
  private emitEvent(event: MonitoringEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[MONITORING_SERVICE] Erreur listener:', error);
      }
    });
  }
  
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private async loadData(): Promise<void> {
    try {
      const [metricsData, alertsData, rulesData, configData, contextData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.METRICS),
        AsyncStorage.getItem(STORAGE_KEYS.ALERTS),
        AsyncStorage.getItem(STORAGE_KEYS.ALERT_RULES),
        AsyncStorage.getItem(STORAGE_KEYS.CONFIG),
        AsyncStorage.getItem(STORAGE_KEYS.CONTEXT),
      ]);
      
      if (metricsData) this.metrics = JSON.parse(metricsData);
      if (alertsData) this.alerts = JSON.parse(alertsData);
      if (rulesData) this.alertRules = JSON.parse(rulesData);
      if (configData) this.config = { ...this.config, ...JSON.parse(configData) };
      if (contextData) this.context = { ...this.context, ...JSON.parse(contextData) };
      
      console.log('[MONITORING_SERVICE] Données chargées');
    } catch (error) {
      console.error('[MONITORING_SERVICE] Erreur chargement:', error);
    }
  }
  
  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(this.metrics.slice(-1000))),
        AsyncStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(this.alerts)),
        AsyncStorage.setItem(STORAGE_KEYS.ALERT_RULES, JSON.stringify(this.alertRules)),
        AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config)),
        AsyncStorage.setItem(STORAGE_KEYS.CONTEXT, JSON.stringify(this.context)),
      ]);
    } catch (error) {
      console.error('[MONITORING_SERVICE] Erreur sauvegarde:', error);
    }
  }
}

export default MonitoringService.getInstance();

