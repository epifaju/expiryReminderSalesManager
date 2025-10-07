/**
 * Écran État de synchronisation
 * Interface complète de monitoring et gestion de la synchronisation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  Modal,
  FlatList
} from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSyncQueue } from '../hooks/useSyncQueue';
import {
  NetworkStatusBadge,
  NetworkIndicator,
  SyncStatusCard,
  SyncProgressBar,
  SyncNotification
} from '../components';

/**
 * Interface pour les éléments de l'historique
 */
interface HistoryItem {
  id: string;
  timestamp: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  details?: string;
}

/**
 * Écran principal de synchronisation
 */
const SyncStatusScreen: React.FC = () => {
  const { isOnline, networkType, disconnectionDuration } = useNetworkStatus();
  const { 
    queueStats, 
    pendingCount, 
    isSyncing, 
    triggerSync, 
    clearQueue,
    refreshStats,
    lastError 
  } = useSyncQueue();

  // États locaux
  const [refreshing, setRefreshing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [syncInterval, setSyncInterval] = useState(30); // minutes

  /**
   * Initialise l'historique avec des données de démonstration
   */
  useEffect(() => {
    const initialHistory: HistoryItem[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        type: 'success',
        title: 'Synchronisation terminée',
        message: '5 éléments synchronisés avec succès',
        details: '2 produits, 3 ventes'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        type: 'info',
        title: 'Connexion rétablie',
        message: 'Synchronisation automatique démarrée',
        details: 'WiFi - 2.4 GHz'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        type: 'warning',
        title: 'Connexion perdue',
        message: '3 éléments mis en queue',
        details: 'Mode offline activé'
      }
    ];
    setHistory(initialHistory);
  }, []);

  /**
   * Rafraîchit les données de synchronisation
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshStats();
      // Simuler un délai pour l'UX
      setTimeout(() => setRefreshing(false), 1000);
    } catch (error) {
      setRefreshing(false);
      Alert.alert('Erreur', 'Impossible de rafraîchir les données');
    }
  };

  /**
   * Déclenche une synchronisation manuelle
   */
  const handleManualSync = async () => {
    try {
      await triggerSync({ forceSync: true });
      addToHistory({
        type: 'info',
        title: 'Synchronisation manuelle',
        message: 'Synchronisation forcée démarrée',
        details: `${pendingCount} éléments en attente`
      });
    } catch (error) {
      Alert.alert('Erreur', `Synchronisation échouée: ${error.message}`);
      addToHistory({
        type: 'error',
        title: 'Erreur de synchronisation',
        message: error.message,
        details: 'Échec de la synchronisation manuelle'
      });
    }
  };

  /**
   * Vide la queue de synchronisation
   */
  const handleClearQueue = () => {
    Alert.alert(
      'Vider la queue',
      `Êtes-vous sûr de vouloir supprimer ${pendingCount} éléments de la queue ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearQueue('pending');
              addToHistory({
                type: 'warning',
                title: 'Queue vidée',
                message: `${pendingCount} éléments supprimés`,
                details: 'Synchronisation annulée'
              });
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de vider la queue');
            }
          }
        }
      ]
    );
  };

  /**
   * Ajoute un élément à l'historique
   */
  const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    setHistory(prev => [newItem, ...prev.slice(0, 49)]); // Garder les 50 derniers
  };

  /**
   * Formate la durée de déconnexion
   */
  const formatDisconnectionDuration = (): string => {
    if (!disconnectionDuration) return '';
    return `Déconnecté depuis ${disconnectionDuration}`;
  };

  /**
   * Formate le timestamp pour l'affichage
   */
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`;
    return date.toLocaleDateString();
  };

  /**
   * Obtient la couleur selon le type d'historique
   */
  const getHistoryItemColor = (type: HistoryItem['type']): string => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      case 'info': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  /**
   * Obtient l'icône selon le type d'historique
   */
  const getHistoryItemIcon = (type: HistoryItem['type']): string => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  /**
   * Composant pour un élément de l'historique
   */
  const HistoryItemComponent = ({ item }: { item: HistoryItem }) => (
    <View style={[styles.historyItem, { borderLeftColor: getHistoryItemColor(item.type) }]}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyIcon}>{getHistoryItemIcon(item.type)}</Text>
        <View style={styles.historyContent}>
          <Text style={styles.historyTitle}>{item.title}</Text>
          <Text style={styles.historyTimestamp}>{formatTimestamp(item.timestamp)}</Text>
        </View>
      </View>
      <Text style={styles.historyMessage}>{item.message}</Text>
      {item.details && (
        <Text style={styles.historyDetails}>{item.details}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête avec badge d'état */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>État de Synchronisation</Text>
          <NetworkIndicator size={16} position="top-right" />
        </View>
        
        <NetworkStatusBadge 
          size="medium"
          position="center"
          showPendingCount={true}
          showPulseAnimation={true}
        />
      </View>

      {/* Contenu principal */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Carte de statut principal */}
        <SyncStatusCard 
          showActions={true}
          compact={false}
          onSyncTriggered={() => addToHistory({
            type: 'info',
            title: 'Sync déclenchée',
            message: 'Synchronisation initiée depuis la carte'
          })}
        />

        {/* Barre de progression */}
        {isSyncing && (
          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>Progression</Text>
            <SyncProgressBar 
              height={6}
              showText={true}
              animated={true}
              color="#2196F3"
            />
          </View>
        )}

        {/* Statistiques détaillées */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistiques Détaillées</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{queueStats.pendingCount}</Text>
              <Text style={styles.statLabel}>En attente</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{queueStats.byEntityType.product}</Text>
              <Text style={styles.statLabel}>Produits</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{queueStats.byEntityType.sale}</Text>
              <Text style={styles.statLabel}>Ventes</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{queueStats.byEntityType.stock_movement}</Text>
              <Text style={styles.statLabel}>Mouvements</Text>
            </View>
          </View>

          {/* Informations réseau */}
          <View style={styles.networkInfo}>
            <Text style={styles.networkInfoTitle}>Informations Réseau</Text>
            <View style={styles.networkDetails}>
              <View style={styles.networkDetail}>
                <Text style={styles.networkLabel}>État:</Text>
                <Text style={[styles.networkValue, { color: isOnline ? '#4CAF50' : '#F44336' }]}>
                  {isOnline ? 'En ligne' : 'Hors ligne'}
                </Text>
              </View>
              
              <View style={styles.networkDetail}>
                <Text style={styles.networkLabel}>Type:</Text>
                <Text style={styles.networkValue}>{networkType || 'Inconnu'}</Text>
              </View>
              
              {disconnectionDuration && (
                <View style={styles.networkDetail}>
                  <Text style={styles.networkLabel}>Déconnexion:</Text>
                  <Text style={[styles.networkValue, { color: '#F44336' }]}>
                    {disconnectionDuration}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleManualSync}
              disabled={isSyncing}
            >
              <Text style={styles.actionButtonText}>
                {isSyncing ? '🔄 Synchronisation...' : '🔄 Synchroniser maintenant'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => setShowHistory(true)}
            >
              <Text style={styles.actionButtonText}>📋 Historique</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => setShowSettings(true)}
            >
              <Text style={styles.actionButtonText}>⚙️ Paramètres</Text>
            </TouchableOpacity>
            
            {pendingCount > 0 && (
              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={handleClearQueue}
              >
                <Text style={styles.actionButtonText}>🗑️ Vider la queue</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Dernière synchronisation */}
        {queueStats.lastSyncTime && (
          <View style={styles.lastSyncSection}>
            <Text style={styles.sectionTitle}>Dernière Synchronisation</Text>
            <View style={styles.lastSyncCard}>
              <Text style={styles.lastSyncText}>
                {new Date(queueStats.lastSyncTime).toLocaleString()}
              </Text>
              <Text style={styles.lastSyncSubtext}>
                {queueStats.pendingCount === 0 ? 'Tout est synchronisé' : `${queueStats.pendingCount} éléments en attente`}
              </Text>
            </View>
          </View>
        )}

        {/* Erreur récente */}
        {lastError && (
          <View style={styles.errorSection}>
            <Text style={styles.sectionTitle}>Erreur Récente</Text>
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>❌ {lastError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleManualSync}
              >
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal Historique */}
      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Historique de Synchronisation</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowHistory(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <HistoryItemComponent item={item} />}
            style={styles.historyList}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </Modal>

      {/* Modal Paramètres */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Paramètres de Synchronisation</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.settingsContent}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Synchronisation automatique</Text>
              <TouchableOpacity
                style={[styles.toggle, autoSyncEnabled && styles.toggleActive]}
                onPress={() => setAutoSyncEnabled(!autoSyncEnabled)}
              >
                <Text style={styles.toggleText}>
                  {autoSyncEnabled ? 'Activée' : 'Désactivée'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Intervalle de synchronisation</Text>
              <Text style={styles.settingValue}>{syncInterval} minutes</Text>
            </View>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Mode hors ligne</Text>
              <Text style={styles.settingValue}>
                {isOnline ? 'Désactivé' : 'Activé'}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Notifications */}
      <SyncNotification 
        position="top"
        duration={4000}
        onClose={() => console.log('Notification fermée')}
      />
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  header: {
    backgroundColor: 'white',
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },

  content: {
    flex: 1,
    padding: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },

  progressSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },

  statsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  statCard: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    minWidth: (width - 64) / 4,
  },

  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  networkInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },

  networkInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },

  networkDetails: {
    gap: 4,
  },

  networkDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  networkLabel: {
    fontSize: 12,
    color: '#666',
  },

  networkValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  actionsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },

  actionButtons: {
    gap: 8,
  },

  actionButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  primaryButton: {
    backgroundColor: '#2196F3',
  },

  secondaryButton: {
    backgroundColor: '#4CAF50',
  },

  dangerButton: {
    backgroundColor: '#F44336',
  },

  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  lastSyncSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },

  lastSyncCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },

  lastSyncText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },

  lastSyncSubtext: {
    fontSize: 12,
    color: '#388E3C',
  },

  errorSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },

  errorCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },

  errorText: {
    fontSize: 14,
    color: '#C62828',
    marginBottom: 8,
  },

  retryButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },

  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },

  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalCloseText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },

  historyList: {
    flex: 1,
    padding: 16,
  },

  historyItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },

  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  historyIcon: {
    fontSize: 16,
    marginRight: 8,
  },

  historyContent: {
    flex: 1,
  },

  historyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },

  historyTimestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  historyMessage: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },

  historyDetails: {
    fontSize: 12,
    color: '#777',
    fontStyle: 'italic',
  },

  settingsContent: {
    padding: 16,
  },

  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },

  settingLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },

  settingValue: {
    fontSize: 14,
    color: '#666',
    marginLeft: 16,
  },

  toggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
  },

  toggleActive: {
    backgroundColor: '#4CAF50',
  },

  toggleText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SyncStatusScreen;

