/**
 * Dashboard de monitoring - Visualisation des métriques et alertes
 * 
 * Composant React Native pour afficher :
 * - Statistiques en temps réel
 * - État de santé du système
 * - Alertes actives
 * - Métriques clés
 * - Logs récents
 * 
 * @author Sales Manager Team
 * @version 1.0
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useMonitoring, useActiveAlerts, useLogs } from '../hooks/useMonitoring';
import { ReportType, LogLevel, AlertSeverity } from '../types/monitoring';

/**
 * Composant principal du Dashboard
 */
export const MonitoringDashboard: React.FC = () => {
  const {
    stats,
    health,
    isHealthy,
    activeAlertsCount,
    generateReport,
    refresh,
  } = useMonitoring();
  
  const { alerts } = useActiveAlerts();
  const { logs } = useLogs(undefined, 10);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'alerts' | 'logs'>('overview');
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };
  
  if (!stats || !health) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Chargement des métriques...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 Monitoring Dashboard</Text>
        <View style={styles.healthBadge}>
          <View style={[
            styles.healthDot,
            { backgroundColor: isHealthy ? '#10B981' : '#EF4444' }
          ]} />
          <Text style={styles.healthText}>
            {isHealthy ? 'Healthy' : 'Issues Detected'}
          </Text>
        </View>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.tabActive]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.tabTextActive]}>
            Vue d'ensemble
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'alerts' && styles.tabActive]}
          onPress={() => setSelectedTab('alerts')}
        >
          <Text style={[styles.tabText, selectedTab === 'alerts' && styles.tabTextActive]}>
            Alertes ({activeAlertsCount})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'logs' && styles.tabActive]}
          onPress={() => setSelectedTab('logs')}
        >
          <Text style={[styles.tabText, selectedTab === 'logs' && styles.tabTextActive]}>
            Logs
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {selectedTab === 'overview' && (
          <OverviewTab stats={stats} health={health} />
        )}
        
        {selectedTab === 'alerts' && (
          <AlertsTab alerts={alerts} />
        )}
        
        {selectedTab === 'logs' && (
          <LogsTab logs={logs} />
        )}
      </ScrollView>
    </View>
  );
};

/**
 * Onglet Vue d'ensemble
 */
const OverviewTab: React.FC<{ stats: any; health: any }> = ({ stats, health }) => {
  return (
    <View>
      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Métriques"
          value={stats.totalMetrics.toLocaleString()}
          icon="📈"
          trend="+12%"
        />
        <StatCard
          title="Alertes Actives"
          value={stats.activeAlerts.toString()}
          icon="⚠️"
          color={stats.activeAlerts > 0 ? '#EF4444' : '#10B981'}
        />
        <StatCard
          title="Taux Collection"
          value={`${stats.collectionRate.toFixed(1)}/s`}
          icon="📊"
        />
        <StatCard
          title="Uptime"
          value={formatUptime(stats.uptime)}
          icon="⏱️"
        />
      </View>
      
      {/* Health Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>État de Santé</Text>
        <View style={styles.healthCard}>
          {health.checks.map((check: any, index: number) => (
            <View key={index} style={styles.healthItem}>
              <View style={styles.healthItemHeader}>
                <Text style={styles.healthItemName}>{check.name}</Text>
                <StatusBadge status={check.status} />
              </View>
              <Text style={styles.healthItemMessage}>{check.message}</Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* Storage Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stockage</Text>
        <View style={styles.card}>
          <Text style={styles.storageText}>
            {formatBytes(stats.storageUsed)} utilisés
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '35%' }]} />
          </View>
        </View>
      </View>
    </View>
  );
};

/**
 * Onglet Alertes
 */
const AlertsTab: React.FC<{ alerts: any[] }> = ({ alerts }) => {
  if (alerts.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateIcon}>✅</Text>
        <Text style={styles.emptyStateText}>Aucune alerte active</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.section}>
      {alerts.map((alert, index) => (
        <View key={index} style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <SeverityBadge severity={alert.severity} />
            <Text style={styles.alertTime}>
              {new Date(alert.triggeredAt).toLocaleTimeString()}
            </Text>
          </View>
          <Text style={styles.alertTitle}>{alert.title}</Text>
          <Text style={styles.alertDescription}>{alert.description}</Text>
          {alert.currentValue && (
            <Text style={styles.alertMetric}>
              Valeur actuelle: {alert.currentValue} (seuil: {alert.threshold})
            </Text>
          )}
        </View>
      ))}
    </View>
  );
};

/**
 * Onglet Logs
 */
const LogsTab: React.FC<{ logs: any[] }> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateIcon}>📝</Text>
        <Text style={styles.emptyStateText}>Aucun log récent</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.section}>
      {logs.map((log, index) => (
        <View key={index} style={styles.logCard}>
          <View style={styles.logHeader}>
            <LogLevelBadge level={log.level} />
            <Text style={styles.logTime}>
              {new Date(log.timestamp).toLocaleTimeString()}
            </Text>
          </View>
          <Text style={styles.logMessage}>{log.message}</Text>
          {log.metadata && (
            <Text style={styles.logMetadata}>
              {JSON.stringify(log.metadata, null, 2)}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
};

/**
 * Composants utilitaires
 */
const StatCard: React.FC<{
  title: string;
  value: string;
  icon: string;
  trend?: string;
  color?: string;
}> = ({ title, value, icon, trend, color }) => (
  <View style={styles.statCard}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={[styles.statValue, color && { color }]}>{value}</Text>
    {trend && <Text style={styles.statTrend}>{trend}</Text>}
  </View>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    healthy: '#10B981',
    degraded: '#F59E0B',
    unhealthy: '#EF4444',
  };
  
  return (
    <View style={[styles.badge, { backgroundColor: colors[status] || '#6B7280' }]}>
      <Text style={styles.badgeText}>{status}</Text>
    </View>
  );
};

const SeverityBadge: React.FC<{ severity: AlertSeverity }> = ({ severity }) => {
  const colors: Record<string, string> = {
    low: '#3B82F6',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#991B1B',
  };
  
  const labels: Record<string, string> = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
    critical: 'Critique',
  };
  
  return (
    <View style={[styles.badge, { backgroundColor: colors[severity] }]}>
      <Text style={styles.badgeText}>{labels[severity]}</Text>
    </View>
  );
};

const LogLevelBadge: React.FC<{ level: LogLevel }> = ({ level }) => {
  const colors: Record<string, string> = {
    trace: '#6B7280',
    debug: '#3B82F6',
    info: '#10B981',
    warn: '#F59E0B',
    error: '#EF4444',
    fatal: '#991B1B',
  };
  
  return (
    <View style={[styles.logLevelBadge, { backgroundColor: colors[level] }]}>
      <Text style={styles.logLevelText}>{level.toUpperCase()}</Text>
    </View>
  );
};

/**
 * Fonctions utilitaires
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}j`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

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
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  healthText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: '1%',
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statTrend: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  healthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  healthItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  healthItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  healthItemMessage: {
    fontSize: 12,
    color: '#6B7280',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  storageText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  alertMetric: {
    fontSize: 12,
    color: '#3B82F6',
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  logLevelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  logLevelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  logMessage: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
  },
  logMetadata: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'monospace',
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});

export default MonitoringDashboard;

