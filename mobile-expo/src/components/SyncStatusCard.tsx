/**
 * Composant Carte de statut de synchronisation
 * Affichage détaillé de l'état de synchronisation avec contrôles
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSyncQueue } from '../hooks/useSyncQueue';

/**
 * Interface pour les props du composant
 */
export interface SyncStatusCardProps {
  /** Style personnalisé pour le conteneur */
  containerStyle?: any;
  /** Afficher les boutons d'action */
  showActions?: boolean;
  /** Mode compact */
  compact?: boolean;
  /** Callback lors du déclenchement de la synchronisation */
  onSyncTriggered?: () => void;
}

/**
 * Composant Carte de statut de synchronisation
 * Affichage complet avec contrôles
 */
const SyncStatusCard: React.FC<SyncStatusCardProps> = ({
  containerStyle,
  showActions = true,
  compact = false,
  onSyncTriggered
}) => {
  const { isOnline, networkType, disconnectionDuration } = useNetworkStatus();
  const { 
    queueStats, 
    pendingCount, 
    isSyncing, 
    triggerSync, 
    refreshStats,
    lastError 
  } = useSyncQueue();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animation pour l'expansion
  const expandAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, expandAnim]);

  /**
   * Déclenche la synchronisation manuelle
   */
  const handleManualSync = async () => {
    try {
      await triggerSync({ forceSync: true });
      onSyncTriggered?.();
    } catch (error) {
      Alert.alert('Erreur', `Synchronisation échouée: ${error.message}`);
    }
  };

  /**
   * Rafraîchit les statistiques
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshStats();
    } catch (error) {
      Alert.alert('Erreur', `Impossible de rafraîchir: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Détermine la couleur de fond selon l'état
   */
  const getBackgroundColor = (): string => {
    if (isSyncing) return '#FFF3E0'; // Orange clair
    if (pendingCount > 0 && !isOnline) return '#FFEBEE'; // Rouge clair
    if (pendingCount > 0 && isOnline) return '#FFF8E1'; // Jaune clair
    if (isOnline) return '#E8F5E8'; // Vert clair
    return '#F5F5F5'; // Gris clair
  };

  /**
   * Détermine la couleur de bordure
   */
  const getBorderColor = (): string => {
    if (isSyncing) return '#FF9800';
    if (pendingCount > 0 && !isOnline) return '#F44336';
    if (pendingCount > 0 && isOnline) return '#FFC107';
    if (isOnline) return '#4CAF50';
    return '#9E9E9E';
  };

  /**
   * Détermine le texte de statut principal
   */
  const getMainStatusText = (): string => {
    if (isSyncing) return 'Synchronisation en cours...';
    if (!isOnline && pendingCount > 0) return `${pendingCount} éléments en attente`;
    if (isOnline && pendingCount > 0) return `${pendingCount} éléments à synchroniser`;
    if (isOnline) return 'Tout est synchronisé';
    if (isConnected) return 'Réseau local disponible';
    return 'Hors ligne';
  };

  /**
   * Détermine l'icône de statut
   */
  const getStatusIcon = (): string => {
    if (isSyncing) return '🔄';
    if (!isOnline && pendingCount > 0) return '⏳';
    if (isOnline && pendingCount > 0) return '📤';
    if (isOnline) return '✅';
    if (isConnected) return '🟡';
    return '❌';
  };

  const backgroundColor = getBackgroundColor();
  const borderColor = getBorderColor();
  const mainStatusText = getMainStatusText();
  const statusIcon = getStatusIcon();

  return (
    <View style={[styles.container, { backgroundColor, borderColor }, containerStyle]}>
      {/* En-tête principal */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>{statusIcon}</Text>
          <View style={styles.headerText}>
            <Text style={styles.mainText}>{mainStatusText}</Text>
            {!compact && (
              <Text style={styles.subText}>
                {isOnline ? `Connecté via ${networkType}` : 'Pas de connexion internet'}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.headerRight}>
          {isSyncing && <ActivityIndicator size="small" color="#FF9800" />}
          {!isSyncing && (
            <Text style={styles.expandIcon}>
              {isExpanded ? '▲' : '▼'}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Contenu détaillé (expandable) */}
      <Animated.View
        style={[
          styles.detailsContainer,
          {
            height: expandAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 200],
            }),
            opacity: expandAnim,
          }
        ]}
      >
        <View style={styles.details}>
          {/* Statistiques */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Statistiques</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{queueStats.pendingCount}</Text>
                <Text style={styles.statLabel}>En attente</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{queueStats.byEntityType.product}</Text>
                <Text style={styles.statLabel}>Produits</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{queueStats.byEntityType.sale}</Text>
                <Text style={styles.statLabel}>Ventes</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{queueStats.byEntityType.stock_movement}</Text>
                <Text style={styles.statLabel}>Stock</Text>
              </View>
            </View>
          </View>

          {/* Informations réseau */}
          {disconnectionDuration && (
            <View style={styles.networkInfo}>
              <Text style={styles.networkInfoText}>
                Déconnecté depuis {disconnectionDuration}
              </Text>
            </View>
          )}

          {/* Dernière synchronisation */}
          {queueStats.lastSyncTime && (
            <View style={styles.lastSyncInfo}>
              <Text style={styles.lastSyncText}>
                Dernière sync: {new Date(queueStats.lastSyncTime).toLocaleString()}
              </Text>
            </View>
          )}

          {/* Erreur */}
          {lastError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Erreur: {lastError}</Text>
            </View>
          )}

          {/* Actions */}
          {showActions && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.syncButton]}
                onPress={handleManualSync}
                disabled={isSyncing}
              >
                <Text style={styles.actionButtonText}>
                  {isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.refreshButton]}
                onPress={handleRefresh}
                disabled={isRefreshing}
              >
                <Text style={styles.actionButtonText}>
                  {isRefreshing ? 'Actualisation...' : 'Actualiser'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 2,
    margin: 8,
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  icon: {
    fontSize: 20,
    marginRight: 12,
  },

  headerText: {
    flex: 1,
  },

  mainText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },

  subText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  headerRight: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
  },

  expandIcon: {
    fontSize: 12,
    color: '#666',
  },

  detailsContainer: {
    overflow: 'hidden',
  },

  details: {
    padding: 16,
    paddingTop: 0,
  },

  statsContainer: {
    marginBottom: 16,
  },

  statsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  statItem: {
    alignItems: 'center',
  },

  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },

  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },

  networkInfo: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },

  networkInfoText: {
    fontSize: 12,
    color: '#F44336',
    textAlign: 'center',
  },

  lastSyncInfo: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },

  lastSyncText: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
  },

  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },

  errorText: {
    fontSize: 12,
    color: '#F44336',
    textAlign: 'center',
  },

  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },

  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  syncButton: {
    backgroundColor: '#2196F3',
  },

  refreshButton: {
    backgroundColor: '#4CAF50',
  },

  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default SyncStatusCard;

