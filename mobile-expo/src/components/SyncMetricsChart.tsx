/**
 * Composant Graphique des métriques de synchronisation
 * Affichage visuel des statistiques et tendances
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions,
  ScrollView,
  TouchableOpacity 
} from 'react-native';
import { useSyncQueue } from '../hooks/useSyncQueue';

/**
 * Interface pour les données de métriques
 */
interface MetricData {
  timestamp: string;
  pendingCount: number;
  successCount: number;
  errorCount: number;
  networkType?: string;
}

/**
 * Interface pour les props du composant
 */
export interface SyncMetricsChartProps {
  /** Style personnalisé pour le conteneur */
  containerStyle?: any;
  /** Période d'affichage */
  period?: 'hour' | 'day' | 'week';
  /** Afficher les graphiques */
  showCharts?: boolean;
  /** Afficher les statistiques */
  showStats?: boolean;
}

/**
 * Composant Graphique des métriques de synchronisation
 */
const SyncMetricsChart: React.FC<SyncMetricsChartProps> = ({
  containerStyle,
  period = 'day',
  showCharts = true,
  showStats = true
}) => {
  const { queueStats, isSyncing } = useSyncQueue();
  
  // Données simulées pour la démonstration
  const [metricsData, setMetricsData] = useState<MetricData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'pending' | 'success' | 'error'>('pending');

  /**
   * Génère des données de démonstration
   */
  useEffect(() => {
    const generateMockData = (): MetricData[] => {
      const data: MetricData[] = [];
      const now = new Date();
      const hours = period === 'hour' ? 12 : period === 'day' ? 24 : 168; // 1 semaine
      
      for (let i = hours - 1; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * (period === 'hour' ? 5 : 60) * 60 * 1000);
        data.push({
          timestamp: timestamp.toISOString(),
          pendingCount: Math.max(0, Math.floor(Math.random() * 20) - 5),
          successCount: Math.floor(Math.random() * 15),
          errorCount: Math.floor(Math.random() * 3),
          networkType: ['wifi', 'cellular', 'none'][Math.floor(Math.random() * 3)]
        });
      }
      return data;
    };

    setMetricsData(generateMockData());
  }, [period]);

  /**
   * Calcule les statistiques globales
   */
  const calculateStats = () => {
    const totalPending = metricsData.reduce((sum, data) => sum + data.pendingCount, 0);
    const totalSuccess = metricsData.reduce((sum, data) => sum + data.successCount, 0);
    const totalErrors = metricsData.reduce((sum, data) => sum + data.errorCount, 0);
    const avgPending = totalPending / metricsData.length;
    const successRate = totalSuccess / (totalSuccess + totalErrors) * 100;

    return {
      totalPending,
      totalSuccess,
      totalErrors,
      avgPending: Math.round(avgPending * 10) / 10,
      successRate: Math.round(successRate * 10) / 10
    };
  };

  /**
   * Obtient la couleur selon le type de métrique
   */
  const getMetricColor = (type: 'pending' | 'success' | 'error'): string => {
    switch (type) {
      case 'pending': return '#FF9800';
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  /**
   * Obtient l'icône selon le type de métrique
   */
  const getMetricIcon = (type: 'pending' | 'success' | 'error'): string => {
    switch (type) {
      case 'pending': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '📊';
    }
  };

  /**
   * Obtient le titre selon le type de métrique
   */
  const getMetricTitle = (type: 'pending' | 'success' | 'error'): string => {
    switch (type) {
      case 'pending': return 'Éléments en attente';
      case 'success': return 'Synchronisations réussies';
      case 'error': return 'Erreurs de synchronisation';
      default: return 'Métriques';
    }
  };

  /**
   * Obtient la valeur maximale pour la normalisation
   */
  const getMaxValue = (type: 'pending' | 'success' | 'error'): number => {
    const values = metricsData.map(data => {
      switch (type) {
        case 'pending': return data.pendingCount;
        case 'success': return data.successCount;
        case 'error': return data.errorCount;
        default: return 0;
      }
    });
    return Math.max(...values, 1);
  };

  /**
   * Formate l'heure pour l'affichage
   */
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    if (period === 'hour') {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  /**
   * Composant pour une barre de graphique
   */
  const ChartBar = ({ 
    value, 
    maxValue, 
    color, 
    label 
  }: { 
    value: number; 
    maxValue: number; 
    color: string; 
    label: string; 
  }) => {
    const height = (value / maxValue) * 100;
    
    return (
      <View style={styles.chartBarContainer}>
        <View style={styles.chartBar}>
          <View 
            style={[
              styles.chartBarFill, 
              { 
                height: `${height}%`, 
                backgroundColor: color 
              }
            ]} 
          />
        </View>
        <Text style={styles.chartBarLabel}>{label}</Text>
        <Text style={styles.chartBarValue}>{value}</Text>
      </View>
    );
  };

  /**
   * Composant pour le graphique en barres
   */
  const BarChart = () => {
    const maxValue = getMaxValue(selectedMetric);
    const color = getMetricColor(selectedMetric);
    
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chartContainer}>
          {metricsData.slice(-12).map((data, index) => {
            const value = selectedMetric === 'pending' ? data.pendingCount :
                         selectedMetric === 'success' ? data.successCount :
                         data.errorCount;
            
            return (
              <ChartBar
                key={index}
                value={value}
                maxValue={maxValue}
                color={color}
                label={formatTime(data.timestamp)}
              />
            );
          })}
        </View>
      </ScrollView>
    );
  };

  /**
   * Composant pour les statistiques
   */
  const StatsCards = () => {
    const stats = calculateStats();
    
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalSuccess}</Text>
          <Text style={styles.statLabel}>Total synchronisé</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#F44336' }]}>{stats.totalErrors}</Text>
          <Text style={styles.statLabel}>Erreurs</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#FF9800' }]}>{stats.avgPending}</Text>
          <Text style={styles.statLabel}>Moyenne attente</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: stats.successRate > 90 ? '#4CAF50' : '#FF9800' }]}>
            {stats.successRate}%
          </Text>
          <Text style={styles.statLabel}>Taux de réussite</Text>
        </View>
      </View>
    );
  };

  const stats = calculateStats();

  return (
    <View style={[styles.container, containerStyle]}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.title}>Métriques de Synchronisation</Text>
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, period === 'hour' && styles.periodButtonActive]}
            onPress={() => {/* setPeriod('hour') */}}
          >
            <Text style={[styles.periodButtonText, period === 'hour' && styles.periodButtonTextActive]}>
              12h
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, period === 'day' && styles.periodButtonActive]}
            onPress={() => {/* setPeriod('day') */}}
          >
            <Text style={[styles.periodButtonText, period === 'day' && styles.periodButtonTextActive]}>
              24h
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, period === 'week' && styles.periodButtonActive]}
            onPress={() => {/* setPeriod('week') */}}
          >
            <Text style={[styles.periodButtonText, period === 'week' && styles.periodButtonTextActive]}>
              7j
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistiques globales */}
      {showStats && <StatsCards />}

      {/* Sélecteur de métrique */}
      <View style={styles.metricSelector}>
        {(['pending', 'success', 'error'] as const).map((metric) => (
          <TouchableOpacity
            key={metric}
            style={[
              styles.metricButton,
              selectedMetric === metric && styles.metricButtonActive
            ]}
            onPress={() => setSelectedMetric(metric)}
          >
            <Text style={styles.metricIcon}>{getMetricIcon(metric)}</Text>
            <Text style={[
              styles.metricButtonText,
              selectedMetric === metric && styles.metricButtonTextActive
            ]}>
              {getMetricTitle(metric)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Graphique */}
      {showCharts && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>
            {getMetricTitle(selectedMetric)} - {period === 'hour' ? '12 dernières heures' : 
             period === 'day' ? '24 dernières heures' : '7 derniers jours'}
          </Text>
          <BarChart />
        </View>
      )}

      {/* Résumé actuel */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>État Actuel</Text>
        <View style={styles.summaryContent}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryIcon}>⏳</Text>
            <Text style={styles.summaryLabel}>En attente:</Text>
            <Text style={styles.summaryValue}>{queueStats.pendingCount}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryIcon}>{isSyncing ? '🔄' : '✅'}</Text>
            <Text style={styles.summaryLabel}>État:</Text>
            <Text style={styles.summaryValue}>
              {isSyncing ? 'Synchronisation...' : 'Synchronisé'}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryIcon}>📊</Text>
            <Text style={styles.summaryLabel}>Taux de réussite:</Text>
            <Text style={styles.summaryValue}>{stats.successRate}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 2,
  },

  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },

  periodButtonActive: {
    backgroundColor: '#2196F3',
  },

  periodButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },

  periodButtonTextActive: {
    color: 'white',
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  statCard: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    minWidth: (width - 80) / 4,
  },

  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },

  metricSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },

  metricButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 8,
  },

  metricButtonActive: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },

  metricIcon: {
    fontSize: 14,
    marginRight: 4,
  },

  metricButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },

  metricButtonTextActive: {
    color: '#2196F3',
  },

  chartSection: {
    marginBottom: 16,
  },

  chartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },

  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 8,
  },

  chartBarContainer: {
    alignItems: 'center',
    marginHorizontal: 2,
    minWidth: 30,
  },

  chartBar: {
    width: 20,
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    justifyContent: 'flex-end',
    marginBottom: 4,
  },

  chartBarFill: {
    borderRadius: 4,
    minHeight: 2,
  },

  chartBarLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },

  chartBarValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },

  summaryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },

  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },

  summaryContent: {
    gap: 6,
  },

  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },

  summaryLabel: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },

  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default SyncMetricsChart;

