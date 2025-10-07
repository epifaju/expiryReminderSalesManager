/**
 * Exemple d'utilisation du système de monitoring et d'observabilité
 * 
 * Démontre toutes les fonctionnalités :
 * - Collecte de métriques
 * - Logs structurés
 * - Traces distribuées
 * - Alertes
 * - Rapports
 * - Dashboard
 * 
 * @author Sales Manager Team
 * @version 1.0
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  ScrollView,
  StyleSheet,
  Alert as RNAlert,
} from 'react-native';
import MonitoringService from './src/services/monitoring/MonitoringService';
import ObservabilityService from './src/services/monitoring/ObservabilityService';
import {
  useMonitoring,
  useMetric,
  usePerformanceTracking,
  useTraceOperation,
  useActiveAlerts,
} from './src/hooks/useMonitoring';
import MonitoringDashboard from './src/components/MonitoringDashboard';
import {
  MetricType,
  MetricCategory,
  AlertType,
  AlertSeverity,
  ReportType,
  LogLevel,
  DEFAULT_MONITORING_CONFIG,
} from './src/types/monitoring';

/**
 * Composant principal d'exemple
 */
export const MonitoringExample: React.FC = () => {
  const [initialized, setInitialized] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [result, setResult] = useState<string>('');
  
  // Hook de monitoring
  const {
    stats,
    health,
    isHealthy,
    collectMetric,
    log,
    trace,
    generateReport,
    checkHealth,
  } = useMonitoring();
  
  // Hook d'alertes
  const { alerts, count: alertCount, hasCritical } = useActiveAlerts();
  
  // Hook de métrique personnalisée
  const userActionMetric = useMetric(
    'user.action',
    MetricType.COUNTER,
    MetricCategory.USER
  );
  
  // Hook de tracking de performance
  const { renderCount } = usePerformanceTracking('MonitoringExample');
  
  // Hook de trace d'opération
  const { execute: traceOperation } = useTraceOperation('example_operation');
  
  // Initialisation
  useEffect(() => {
    initializeMonitoring();
  }, []);
  
  const initializeMonitoring = async () => {
    try {
      // Initialiser le service de monitoring
      await MonitoringService.initialize({
        ...DEFAULT_MONITORING_CONFIG,
        enabled: true,
        collectInterval: 3000,
        enableAlerts: true,
        logLevel: LogLevel.DEBUG,
      }, {
        sessionId: `session-${Date.now()}`,
        userId: 'test-user-123',
        deviceId: 'test-device-456',
        appVersion: '1.0.0',
      });
      
      // Définir le contexte d'observabilité
      ObservabilityService.setContext({
        userId: 'test-user-123',
        sessionId: `session-${Date.now()}`,
      });
      
      // Ajouter des règles d'alerte
      MonitoringService.addAlertRule({
        id: 'rule-error-rate',
        name: 'Taux d\'erreur élevé',
        description: 'Alerte si le taux d\'erreur dépasse 10%',
        type: AlertType.THRESHOLD,
        severity: AlertSeverity.HIGH,
        metric: 'app.error.rate',
        condition: {
          operator: 'gt',
          threshold: 0.1,
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      setInitialized(true);
      log(LogLevel.INFO, 'Monitoring initialisé avec succès');
      setResult('✅ Monitoring initialisé');
      
    } catch (error) {
      console.error('Erreur initialisation:', error);
      setResult(`❌ Erreur: ${error}`);
    }
  };
  
  // ============================================================================
  // Tests de métriques
  // ============================================================================
  
  const testMetrics = () => {
    log(LogLevel.INFO, 'Test de collecte de métriques');
    
    // Métrique counter
    collectMetric({
      name: 'app.requests',
      type: MetricType.COUNTER,
      category: MetricCategory.PERFORMANCE,
      value: 1,
      tags: { endpoint: '/api/sync' },
    });
    
    // Métrique gauge
    collectMetric({
      name: 'app.memory.usage',
      type: MetricType.GAUGE,
      category: MetricCategory.SYSTEM,
      value: Math.random() * 100,
      unit: 'MB',
    });
    
    // Métrique timer
    const startTime = Date.now();
    setTimeout(() => {
      collectMetric({
        name: 'app.operation.duration',
        type: MetricType.TIMER,
        category: MetricCategory.PERFORMANCE,
        value: Date.now() - startTime,
        unit: 'ms',
      });
    }, 100);
    
    // Métrique utilisateur avec hook
    userActionMetric.collect(1, { action: 'button_click' });
    
    setResult('✅ Métriques collectées:\n- Counter (requests)\n- Gauge (memory)\n- Timer (duration)\n- User action');
  };
  
  // ============================================================================
  // Tests de logs
  // ============================================================================
  
  const testLogs = () => {
    log(LogLevel.TRACE, 'Message de trace pour debugging');
    log(LogLevel.DEBUG, 'Message de debug', { component: 'MonitoringExample' });
    log(LogLevel.INFO, 'Message d\'information', { action: 'test_logs' });
    log(LogLevel.WARN, 'Message d\'avertissement', { warning: 'low_storage' });
    log(LogLevel.ERROR, 'Message d\'erreur', { 
      error: 'Simulation d\'erreur',
      stack: 'at testLogs (example.tsx:123)'
    });
    
    setResult('✅ 5 logs enregistrés:\n- TRACE\n- DEBUG\n- INFO\n- WARN\n- ERROR');
  };
  
  // ============================================================================
  // Tests de traces
  // ============================================================================
  
  const testTraces = async () => {
    try {
      log(LogLevel.INFO, 'Démarrage test de traces');
      
      // Trace simple
      const result1 = await trace('Simple Operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return 'Opération réussie';
      });
      
      // Trace avec opération complexe
      const result2 = await traceOperation(async () => {
        const span1 = ObservabilityService.createSpan('Step 1');
        await new Promise(resolve => setTimeout(resolve, 100));
        ObservabilityService.endSpan(span1);
        
        const span2 = ObservabilityService.createSpan('Step 2');
        await new Promise(resolve => setTimeout(resolve, 150));
        ObservabilityService.endSpan(span2);
        
        return 'Opération complexe terminée';
      });
      
      const traces = ObservabilityService.getTraces(5);
      setResult(`✅ Traces créées:\n- ${result1}\n- ${result2}\n- Total traces: ${traces.length}`);
      
    } catch (error) {
      log(LogLevel.ERROR, 'Erreur test traces', { error });
      setResult(`❌ Erreur: ${error}`);
    }
  };
  
  // ============================================================================
  // Tests d'alertes
  // ============================================================================
  
  const testAlerts = () => {
    log(LogLevel.INFO, 'Test de génération d\'alertes');
    
    // Créer des alertes de différentes sévérités
    MonitoringService.createAlert({
      type: AlertType.THRESHOLD,
      severity: AlertSeverity.LOW,
      status: 'active',
      title: 'Alerte de test - Basse',
      description: 'Ceci est une alerte de test de sévérité basse',
    });
    
    MonitoringService.createAlert({
      type: AlertType.ANOMALY,
      severity: AlertSeverity.MEDIUM,
      status: 'active',
      title: 'Alerte de test - Moyenne',
      description: 'Anomalie détectée dans les métriques',
      metric: 'app.response.time',
      currentValue: 1500,
      threshold: 1000,
    });
    
    MonitoringService.createAlert({
      type: AlertType.ERROR_RATE,
      severity: AlertSeverity.HIGH,
      status: 'active',
      title: 'Alerte de test - Haute',
      description: 'Taux d\'erreur élevé détecté',
      metric: 'app.error.rate',
      currentValue: 0.15,
      threshold: 0.1,
    });
    
    // Générer une métrique qui déclenche une alerte
    collectMetric({
      name: 'app.error.rate',
      type: MetricType.GAUGE,
      category: MetricCategory.ERROR,
      value: 0.12, // Dépasse le seuil de 0.1
    });
    
    setResult(`✅ Alertes générées:\n- LOW: 1\n- MEDIUM: 1\n- HIGH: 1\n- Total actives: ${alerts.length + 3}`);
  };
  
  // ============================================================================
  // Tests de rapports
  // ============================================================================
  
  const testReports = async () => {
    try {
      log(LogLevel.INFO, 'Génération de rapport');
      
      const period = {
        start: new Date(Date.now() - 3600000).toISOString(), // Dernière heure
        end: new Date().toISOString(),
        duration: 3600000,
        label: '1h',
      };
      
      const report = await generateReport(ReportType.PERFORMANCE, period);
      
      setResult(`✅ Rapport généré:\n` +
        `- Type: ${report.type}\n` +
        `- Période: ${report.period.label}\n` +
        `- Métriques: ${report.metrics.length}\n` +
        `- Alertes: ${report.alerts?.length || 0}\n` +
        `- Score santé: ${report.summary.healthScore}/100\n` +
        `- Recommandations: ${report.recommendations?.length || 0}`
      );
      
    } catch (error) {
      log(LogLevel.ERROR, 'Erreur génération rapport', { error });
      setResult(`❌ Erreur: ${error}`);
    }
  };
  
  // ============================================================================
  // Tests de santé
  // ============================================================================
  
  const testHealthCheck = async () => {
    try {
      log(LogLevel.INFO, 'Vérification de santé');
      
      const healthCheck = await checkHealth();
      
      const checksStatus = healthCheck.checks.map(c => 
        `  - ${c.name}: ${c.status}`
      ).join('\n');
      
      setResult(`✅ Health Check:\n` +
        `- Statut global: ${healthCheck.status}\n` +
        `- Timestamp: ${new Date(healthCheck.timestamp).toLocaleTimeString()}\n` +
        `\nComposants:\n${checksStatus}`
      );
      
    } catch (error) {
      log(LogLevel.ERROR, 'Erreur health check', { error });
      setResult(`❌ Erreur: ${error}`);
    }
  };
  
  // ============================================================================
  // Tests de performance
  // ============================================================================
  
  const testPerformance = async () => {
    log(LogLevel.INFO, 'Test de performance avec traces');
    
    const operations = [];
    for (let i = 0; i < 10; i++) {
      operations.push(
        trace(`Performance Test ${i + 1}`, async () => {
          const delay = Math.random() * 100;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          collectMetric({
            name: 'test.operation.duration',
            type: MetricType.TIMER,
            category: MetricCategory.PERFORMANCE,
            value: delay,
            unit: 'ms',
          });
          
          return delay;
        })
      );
    }
    
    const results = await Promise.all(operations);
    const avgDuration = results.reduce((a, b) => a + b, 0) / results.length;
    
    setResult(`✅ Test de performance:\n` +
      `- Opérations: 10\n` +
      `- Durée moyenne: ${avgDuration.toFixed(2)}ms\n` +
      `- Durée min: ${Math.min(...results).toFixed(2)}ms\n` +
      `- Durée max: ${Math.max(...results).toFixed(2)}ms`
    );
  };
  
  // ============================================================================
  // Export de données
  // ============================================================================
  
  const testExport = async () => {
    try {
      log(LogLevel.INFO, 'Export des données d\'observabilité');
      
      const jsonData = await ObservabilityService.exportData('json');
      const textData = await ObservabilityService.exportData('text');
      
      console.log('=== JSON EXPORT ===');
      console.log(jsonData.substring(0, 500) + '...');
      console.log('\n=== TEXT EXPORT ===');
      console.log(textData.substring(0, 500) + '...');
      
      setResult(`✅ Export réussi:\n` +
        `- Format JSON: ${(jsonData.length / 1024).toFixed(2)} KB\n` +
        `- Format TEXT: ${(textData.length / 1024).toFixed(2)} KB\n` +
        `\n📋 Données exportées dans la console`
      );
      
    } catch (error) {
      log(LogLevel.ERROR, 'Erreur export', { error });
      setResult(`❌ Erreur: ${error}`);
    }
  };
  
  // ============================================================================
  // Rendu
  // ============================================================================
  
  if (!initialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Initialisation du monitoring...</Text>
      </View>
    );
  }
  
  if (showDashboard) {
    return (
      <View style={styles.container}>
        <MonitoringDashboard />
        <View style={styles.dashboardActions}>
          <Button title="← Retour aux tests" onPress={() => setShowDashboard(false)} />
        </View>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Monitoring & Observabilité</Text>
        <Text style={styles.subtitle}>Exemples d'utilisation</Text>
      </View>
      
      {/* Statut */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>État du système</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Santé:</Text>
          <Text style={[styles.statusValue, { color: isHealthy ? '#10B981' : '#EF4444' }]}>
            {isHealthy ? '✅ Healthy' : '⚠️ Issues'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Alertes actives:</Text>
          <Text style={[styles.statusValue, { color: hasCritical ? '#EF4444' : '#3B82F6' }]}>
            {alertCount}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Métriques collectées:</Text>
          <Text style={styles.statusValue}>{stats?.totalMetrics || 0}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Renders du composant:</Text>
          <Text style={styles.statusValue}>{renderCount}</Text>
        </View>
      </View>
      
      {/* Tests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tests disponibles</Text>
        
        <View style={styles.buttonGroup}>
          <Button title="📊 Test Métriques" onPress={testMetrics} color="#3B82F6" />
        </View>
        
        <View style={styles.buttonGroup}>
          <Button title="📝 Test Logs" onPress={testLogs} color="#10B981" />
        </View>
        
        <View style={styles.buttonGroup}>
          <Button title="🔗 Test Traces" onPress={testTraces} color="#8B5CF6" />
        </View>
        
        <View style={styles.buttonGroup}>
          <Button title="⚠️ Test Alertes" onPress={testAlerts} color="#F59E0B" />
        </View>
        
        <View style={styles.buttonGroup}>
          <Button title="📈 Test Rapports" onPress={testReports} color="#06B6D4" />
        </View>
        
        <View style={styles.buttonGroup}>
          <Button title="💚 Test Health Check" onPress={testHealthCheck} color="#10B981" />
        </View>
        
        <View style={styles.buttonGroup}>
          <Button title="⚡ Test Performance" onPress={testPerformance} color="#EF4444" />
        </View>
        
        <View style={styles.buttonGroup}>
          <Button title="💾 Export Données" onPress={testExport} color="#6B7280" />
        </View>
      </View>
      
      {/* Dashboard */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dashboard</Text>
        <Button 
          title="📊 Afficher le Dashboard Complet" 
          onPress={() => setShowDashboard(true)}
          color="#3B82F6"
        />
      </View>
      
      {/* Résultats */}
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Résultat du dernier test:</Text>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      )}
    </ScrollView>
  );
};

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  buttonGroup: {
    marginBottom: 8,
  },
  resultCard: {
    backgroundColor: '#F3F4F6',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 13,
    color: '#1F2937',
    fontFamily: 'monospace',
  },
  dashboardActions: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});

export default MonitoringExample;

