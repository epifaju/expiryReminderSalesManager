/**
 * Tests unitaires pour MonitoringService
 * 
 * @author Sales Manager Team
 * @version 1.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import MonitoringService from '../../src/services/monitoring/MonitoringService';
import {
  MetricType,
  MetricCategory,
  AlertType,
  AlertSeverity,
  AlertStatus,
  ReportType,
  HealthStatus,
} from '../../src/types/monitoring';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('MonitoringService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });
  
  // ============================================================================
  // Tests d'initialisation
  // ============================================================================
  
  describe('Initialisation', () => {
    it('devrait initialiser le service avec une configuration par défaut', async () => {
      await MonitoringService.initialize();
      
      const stats = MonitoringService.getStats();
      expect(stats).toBeDefined();
      expect(stats.totalMetrics).toBe(0);
    });
    
    it('devrait initialiser avec une configuration personnalisée', async () => {
      await MonitoringService.initialize({
        enabled: true,
        collectInterval: 10000,
        retentionDays: 14,
      });
      
      const stats = MonitoringService.getStats();
      expect(stats).toBeDefined();
    });
    
    it('devrait charger les données depuis AsyncStorage', async () => {
      const mockMetrics = JSON.stringify([
        {
          id: '1',
          name: 'test.metric',
          type: MetricType.COUNTER,
          category: MetricCategory.SYSTEM,
          value: 10,
          timestamp: new Date().toISOString(),
        },
      ]);
      
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(mockMetrics);
      
      await MonitoringService.initialize();
      
      expect(AsyncStorage.getItem).toHaveBeenCalled();
    });
  });
  
  // ============================================================================
  // Tests de collecte de métriques
  // ============================================================================
  
  describe('Collecte de métriques', () => {
    beforeEach(async () => {
      await MonitoringService.initialize({ enabled: true });
    });
    
    it('devrait collecter une métrique counter', () => {
      MonitoringService.collectMetric({
        name: 'test.counter',
        type: MetricType.COUNTER,
        category: MetricCategory.PERFORMANCE,
        value: 1,
      });
      
      const stats = MonitoringService.getStats();
      expect(stats.totalMetrics).toBeGreaterThan(0);
    });
    
    it('devrait collecter une métrique gauge', () => {
      MonitoringService.collectMetric({
        name: 'test.gauge',
        type: MetricType.GAUGE,
        category: MetricCategory.SYSTEM,
        value: 75.5,
        unit: '%',
      });
      
      const stats = MonitoringService.getStats();
      expect(stats.totalMetrics).toBeGreaterThan(0);
    });
    
    it('devrait collecter une métrique timer', () => {
      MonitoringService.collectMetric({
        name: 'test.timer',
        type: MetricType.TIMER,
        category: MetricCategory.PERFORMANCE,
        value: 250,
        unit: 'ms',
        tags: { operation: 'api_call' },
      });
      
      const stats = MonitoringService.getStats();
      expect(stats.totalMetrics).toBeGreaterThan(0);
    });
    
    it('ne devrait pas collecter si le service est désactivé', async () => {
      await MonitoringService.initialize({ enabled: false });
      
      const statsBefore = MonitoringService.getStats();
      const countBefore = statsBefore.totalMetrics;
      
      MonitoringService.collectMetric({
        name: 'test.metric',
        type: MetricType.COUNTER,
        category: MetricCategory.SYSTEM,
        value: 1,
      });
      
      const statsAfter = MonitoringService.getStats();
      expect(statsAfter.totalMetrics).toBe(countBefore);
    });
    
    it('devrait appliquer le taux d\'échantillonnage', async () => {
      await MonitoringService.initialize({ 
        enabled: true,
        samplingRate: 0, // Aucune métrique collectée
      });
      
      const statsBefore = MonitoringService.getStats();
      
      MonitoringService.collectMetric({
        name: 'test.sampled',
        type: MetricType.COUNTER,
        category: MetricCategory.SYSTEM,
        value: 1,
      });
      
      const statsAfter = MonitoringService.getStats();
      expect(statsAfter.totalMetrics).toBe(statsBefore.totalMetrics);
    });
  });
  
  // ============================================================================
  // Tests de requête de métriques
  // ============================================================================
  
  describe('Requête de métriques', () => {
    beforeEach(async () => {
      await MonitoringService.initialize({ enabled: true });
      
      // Ajouter des métriques de test
      for (let i = 0; i < 10; i++) {
        MonitoringService.collectMetric({
          name: `test.metric.${i}`,
          type: MetricType.COUNTER,
          category: i % 2 === 0 ? MetricCategory.PERFORMANCE : MetricCategory.SYSTEM,
          value: i,
        });
      }
    });
    
    it('devrait récupérer toutes les métriques', async () => {
      const result = await MonitoringService.getMetrics();
      
      expect(result.data).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
    });
    
    it('devrait appliquer la pagination', async () => {
      const result = await MonitoringService.getMetrics({
        limit: 5,
        offset: 0,
      });
      
      expect(result.data.length).toBeLessThanOrEqual(5);
      expect(result.hasMore).toBeDefined();
    });
    
    it('devrait filtrer par catégorie', async () => {
      const result = await MonitoringService.getMetrics({
        filter: {
          categories: [MetricCategory.PERFORMANCE],
        },
      });
      
      result.data.forEach(metric => {
        expect(metric.category).toBe(MetricCategory.PERFORMANCE);
      });
    });
    
    it('devrait trier les métriques', async () => {
      const result = await MonitoringService.getMetrics({
        sortBy: 'value',
        sortOrder: 'desc',
      });
      
      if (result.data.length > 1) {
        expect(result.data[0].value).toBeGreaterThanOrEqual(result.data[1].value);
      }
    });
  });
  
  // ============================================================================
  // Tests d'agrégation
  // ============================================================================
  
  describe('Agrégation de métriques', () => {
    beforeEach(async () => {
      await MonitoringService.initialize({ enabled: true });
    });
    
    it('devrait agréger les métriques sur une période', async () => {
      // Collecter plusieurs métriques avec le même nom
      for (let i = 0; i < 10; i++) {
        MonitoringService.collectMetric({
          name: 'test.aggregated',
          type: MetricType.GAUGE,
          category: MetricCategory.PERFORMANCE,
          value: i * 10,
        });
      }
      
      const period = {
        start: new Date(Date.now() - 3600000).toISOString(),
        end: new Date().toISOString(),
        duration: 3600000,
        label: '1h',
      };
      
      const aggregated = await MonitoringService.getAggregatedMetrics(period);
      
      expect(aggregated.length).toBeGreaterThan(0);
      const metric = aggregated.find(m => m.name === 'test.aggregated');
      
      if (metric) {
        expect(metric.count).toBe(10);
        expect(metric.min).toBe(0);
        expect(metric.max).toBe(90);
        expect(metric.avg).toBe(45);
      }
    });
    
    it('devrait calculer les percentiles', async () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      
      values.forEach(value => {
        MonitoringService.collectMetric({
          name: 'test.percentiles',
          type: MetricType.TIMER,
          category: MetricCategory.PERFORMANCE,
          value,
          unit: 'ms',
        });
      });
      
      const period = {
        start: new Date(Date.now() - 3600000).toISOString(),
        end: new Date().toISOString(),
        duration: 3600000,
      };
      
      const aggregated = await MonitoringService.getAggregatedMetrics(period);
      const metric = aggregated.find(m => m.name === 'test.percentiles');
      
      if (metric) {
        expect(metric.p50).toBeDefined();
        expect(metric.p95).toBeDefined();
        expect(metric.p99).toBeDefined();
      }
    });
  });
  
  // ============================================================================
  // Tests d'alertes
  // ============================================================================
  
  describe('Alertes', () => {
    beforeEach(async () => {
      await MonitoringService.initialize({ enabled: true, enableAlerts: true });
    });
    
    it('devrait créer une alerte', () => {
      const alert = MonitoringService.createAlert({
        type: AlertType.THRESHOLD,
        severity: AlertSeverity.HIGH,
        status: AlertStatus.ACTIVE,
        title: 'Test Alert',
        description: 'Ceci est une alerte de test',
      });
      
      expect(alert).toBeDefined();
      expect(alert.id).toBeDefined();
      expect(alert.triggeredAt).toBeDefined();
    });
    
    it('devrait récupérer les alertes par statut', () => {
      MonitoringService.createAlert({
        type: AlertType.ANOMALY,
        severity: AlertSeverity.MEDIUM,
        status: AlertStatus.ACTIVE,
        title: 'Active Alert',
        description: 'Alerte active',
      });
      
      MonitoringService.createAlert({
        type: AlertType.ERROR_RATE,
        severity: AlertSeverity.LOW,
        status: AlertStatus.RESOLVED,
        title: 'Resolved Alert',
        description: 'Alerte résolue',
      });
      
      const activeAlerts = MonitoringService.getAlerts(AlertStatus.ACTIVE);
      const resolvedAlerts = MonitoringService.getAlerts(AlertStatus.RESOLVED);
      
      expect(activeAlerts.length).toBeGreaterThan(0);
      expect(resolvedAlerts.length).toBeGreaterThan(0);
    });
    
    it('devrait ajouter et supprimer des règles d\'alerte', () => {
      const rule = {
        id: 'test-rule-1',
        name: 'Test Rule',
        description: 'Règle de test',
        type: AlertType.THRESHOLD,
        severity: AlertSeverity.HIGH,
        metric: 'test.metric',
        condition: {
          operator: 'gt' as const,
          threshold: 100,
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      MonitoringService.addAlertRule(rule);
      
      // Vérifier que la règle déclenche une alerte
      MonitoringService.collectMetric({
        name: 'test.metric',
        type: MetricType.GAUGE,
        category: MetricCategory.SYSTEM,
        value: 150, // Dépasse le seuil
      });
      
      const alerts = MonitoringService.getAlerts(AlertStatus.ACTIVE);
      expect(alerts.length).toBeGreaterThan(0);
      
      MonitoringService.removeAlertRule('test-rule-1');
    });
  });
  
  // ============================================================================
  // Tests de génération de rapports
  // ============================================================================
  
  describe('Génération de rapports', () => {
    beforeEach(async () => {
      await MonitoringService.initialize({ enabled: true });
      
      // Ajouter des métriques pour le rapport
      for (let i = 0; i < 5; i++) {
        MonitoringService.collectMetric({
          name: 'report.test.metric',
          type: MetricType.COUNTER,
          category: MetricCategory.PERFORMANCE,
          value: i,
        });
      }
    });
    
    it('devrait générer un rapport de performance', async () => {
      const period = {
        start: new Date(Date.now() - 3600000).toISOString(),
        end: new Date().toISOString(),
        duration: 3600000,
        label: '1h',
      };
      
      const report = await MonitoringService.generateReport(ReportType.PERFORMANCE, period);
      
      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
      expect(report.type).toBe(ReportType.PERFORMANCE);
      expect(report.summary).toBeDefined();
      expect(report.summary.healthScore).toBeGreaterThanOrEqual(0);
      expect(report.summary.healthScore).toBeLessThanOrEqual(100);
    });
    
    it('devrait inclure des recommandations dans le rapport', async () => {
      // Créer une alerte critique
      MonitoringService.createAlert({
        type: AlertType.THRESHOLD,
        severity: AlertSeverity.CRITICAL,
        status: AlertStatus.ACTIVE,
        title: 'Critical Issue',
        description: 'Problème critique',
      });
      
      const period = {
        start: new Date(Date.now() - 3600000).toISOString(),
        end: new Date().toISOString(),
        duration: 3600000,
      };
      
      const report = await MonitoringService.generateReport(ReportType.HEALTH, period);
      
      expect(report.recommendations).toBeDefined();
      expect(report.recommendations!.length).toBeGreaterThan(0);
    });
  });
  
  // ============================================================================
  // Tests de health check
  // ============================================================================
  
  describe('Health Check', () => {
    beforeEach(async () => {
      await MonitoringService.initialize({ enabled: true });
    });
    
    it('devrait effectuer un health check', async () => {
      const health = await MonitoringService.healthCheck();
      
      expect(health).toBeDefined();
      expect(health.service).toBe('MonitoringService');
      expect(health.status).toBeDefined();
      expect(health.checks).toBeDefined();
      expect(health.checks.length).toBeGreaterThan(0);
    });
    
    it('devrait retourner un statut healthy si tout va bien', async () => {
      const health = await MonitoringService.healthCheck();
      
      expect(health.status).toBe(HealthStatus.HEALTHY);
    });
    
    it('devrait détecter les composants dégradés', async () => {
      await MonitoringService.initialize({ enabled: true, enableAlerts: false });
      
      const health = await MonitoringService.healthCheck();
      
      const alertSystemCheck = health.checks.find(c => c.name === 'Alert System');
      expect(alertSystemCheck?.status).toBe(HealthStatus.DEGRADED);
    });
  });
  
  // ============================================================================
  // Tests de nettoyage
  // ============================================================================
  
  describe('Nettoyage', () => {
    beforeEach(async () => {
      await MonitoringService.initialize({ enabled: true, retentionDays: 7 });
    });
    
    it('devrait nettoyer les anciennes métriques', async () => {
      const statsBefore = MonitoringService.getStats();
      
      await MonitoringService.cleanup();
      
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });
  
  // ============================================================================
  // Tests d'événements
  // ============================================================================
  
  describe('Événements', () => {
    beforeEach(async () => {
      await MonitoringService.initialize({ enabled: true });
    });
    
    it('devrait émettre un événement lors de la collecte de métrique', () => {
      const listener = jest.fn();
      MonitoringService.addEventListener(listener);
      
      MonitoringService.collectMetric({
        name: 'test.event',
        type: MetricType.COUNTER,
        category: MetricCategory.SYSTEM,
        value: 1,
      });
      
      expect(listener).toHaveBeenCalled();
      
      MonitoringService.removeEventListener(listener);
    });
    
    it('devrait permettre de supprimer un listener', () => {
      const listener = jest.fn();
      MonitoringService.addEventListener(listener);
      MonitoringService.removeEventListener(listener);
      
      MonitoringService.collectMetric({
        name: 'test.event.removed',
        type: MetricType.COUNTER,
        category: MetricCategory.SYSTEM,
        value: 1,
      });
      
      expect(listener).not.toHaveBeenCalled();
    });
  });
});

