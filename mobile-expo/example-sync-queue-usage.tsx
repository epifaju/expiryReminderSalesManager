/**
 * Exemple d'utilisation du SyncQueueService
 * Démonstration de la gestion de la queue de synchronisation
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, FlatList } from 'react-native';
import { useSyncQueue } from './src/hooks/useSyncQueue';
import { useNetworkStatus } from './src/hooks/useNetworkStatus';

/**
 * Composant exemple utilisant le SyncQueueService
 */
const SyncQueueExample: React.FC = () => {
  const {
    queueStats,
    pendingCount,
    isSyncing,
    triggerSync,
    addToQueue,
    clearQueue,
    refreshStats,
    lastError
  } = useSyncQueue();

  const { isOnline } = useNetworkStatus();

  const [lastAction, setLastAction] = useState<string>('');

  /**
   * Ajoute un produit à la queue
   */
  const addProductToQueue = async () => {
    try {
      await addToQueue(
        'product',
        'create',
        `prod-${Date.now()}`,
        { name: `Produit ${Date.now()}`, price: Math.floor(Math.random() * 1000) + 100 },
        { priority: 1 }
      );
      setLastAction('Produit ajouté à la queue');
    } catch (error) {
      Alert.alert('Erreur', `Impossible d'ajouter le produit: ${error.message}`);
    }
  };

  /**
   * Ajoute une vente à la queue
   */
  const addSaleToQueue = async () => {
    try {
      await addToQueue(
        'sale',
        'create',
        `sale-${Date.now()}`,
        { 
          product_id: `prod-${Date.now()}`,
          quantity: Math.floor(Math.random() * 5) + 1,
          total_amount: Math.floor(Math.random() * 500) + 50,
          customer_name: 'Client Test'
        },
        { priority: 2 }
      );
      setLastAction('Vente ajoutée à la queue');
    } catch (error) {
      Alert.alert('Erreur', `Impossible d'ajouter la vente: ${error.message}`);
    }
  };

  /**
   * Ajoute un mouvement de stock à la queue
   */
  const addStockMovementToQueue = async () => {
    try {
      await addToQueue(
        'stock_movement',
        'create',
        `stock-${Date.now()}`,
        { 
          product_id: `prod-${Date.now()}`,
          movement_type: 'in',
          quantity: Math.floor(Math.random() * 20) + 1,
          reason: 'Réapprovisionnement'
        },
        { priority: 3 }
      );
      setLastAction('Mouvement de stock ajouté à la queue');
    } catch (error) {
      Alert.alert('Erreur', `Impossible d'ajouter le mouvement: ${error.message}`);
    }
  };

  /**
   * Déclenche la synchronisation manuelle
   */
  const handleManualSync = async () => {
    try {
      const result = await triggerSync({ forceSync: true });
      
      Alert.alert(
        'Synchronisation terminée',
        `Succès: ${result.successCount}, Échecs: ${result.failedCount}, Conflits: ${result.conflictCount}\nTemps: ${result.processingTime}ms`
      );
      setLastAction(`Sync: ${result.successCount} succès`);
    } catch (error) {
      Alert.alert('Erreur', `Synchronisation échouée: ${error.message}`);
    }
  };

  /**
   * Vide la queue
   */
  const handleClearQueue = async () => {
    Alert.alert(
      'Vider la queue',
      'Êtes-vous sûr de vouloir supprimer tous les éléments en attente ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vider',
          style: 'destructive',
          onPress: async () => {
            try {
              const deletedCount = await clearQueue('pending');
              Alert.alert('Succès', `${deletedCount} éléments supprimés`);
              setLastAction(`${deletedCount} éléments supprimés`);
            } catch (error) {
              Alert.alert('Erreur', `Impossible de vider la queue: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  /**
   * Rafraîchit les statistiques
   */
  const handleRefresh = async () => {
    try {
      await refreshStats();
      setLastAction('Statistiques rafraîchies');
    } catch (error) {
      Alert.alert('Erreur', `Impossible de rafraîchir: ${error.message}`);
    }
  };

  /**
   * Détermine la couleur du badge selon l'état
   */
  const getStatusColor = () => {
    if (isSyncing) return '#FF9800'; // Orange
    if (pendingCount > 0) return '#F44336'; // Rouge
    return '#4CAF50'; // Vert
  };

  /**
   * Détermine le texte du statut
   */
  const getStatusText = () => {
    if (isSyncing) return 'Synchronisation...';
    if (pendingCount > 0) return `${pendingCount} en attente`;
    return 'Queue vide';
  };

  /**
   * Détermine l'icône du statut
   */
  const getStatusIcon = () => {
    if (isSyncing) return '🔄';
    if (pendingCount > 0) return '⏳';
    return '✅';
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>SyncQueue Service - Exemple d'utilisation</Text>
      
      {/* Badge de statut principal */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
        <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>

      {/* Informations de connectivité */}
      <View style={styles.networkContainer}>
        <Text style={styles.networkText}>
          Réseau: {isOnline ? '🟢 En ligne' : '🔴 Hors ligne'}
        </Text>
      </View>

      {/* Statistiques détaillées */}
      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>Statistiques de la queue</Text>
        
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

        {queueStats.lastSyncTime && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Dernière sync:</Text>
            <Text style={styles.value}>
              {new Date(queueStats.lastSyncTime).toLocaleString()}
            </Text>
          </View>
        )}

        {queueStats.nextRetryTime && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Prochaine tentative:</Text>
            <Text style={styles.value}>
              {new Date(queueStats.nextRetryTime).toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* Boutons d'action */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Actions de test</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={addProductToQueue}>
          <Text style={styles.actionButtonText}>➕ Ajouter un produit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={addSaleToQueue}>
          <Text style={styles.actionButtonText}>💰 Ajouter une vente</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={addStockMovementToQueue}>
          <Text style={styles.actionButtonText}>📦 Ajouter mouvement stock</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.syncButton]} 
          onPress={handleManualSync}
          disabled={isSyncing}
        >
          <Text style={styles.actionButtonText}>
            {isSyncing ? '🔄 Synchronisation...' : '🔄 Synchroniser maintenant'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.refreshButton]} 
          onPress={handleRefresh}
        >
          <Text style={styles.actionButtonText}>🔄 Rafraîchir statistiques</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.clearButton]} 
          onPress={handleClearQueue}
        >
          <Text style={styles.actionButtonText}>🗑️ Vider la queue</Text>
        </TouchableOpacity>
      </View>

      {/* Détails par opération */}
      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>Répartition par opération</Text>
        
        <View style={styles.operationList}>
          <View style={styles.operationItem}>
            <Text style={styles.operationIcon}>➕</Text>
            <Text style={styles.operationText}>Créations: {queueStats.byOperation.create}</Text>
          </View>
          
          <View style={styles.operationItem}>
            <Text style={styles.operationIcon}>✏️</Text>
            <Text style={styles.operationText}>Modifications: {queueStats.byOperation.update}</Text>
          </View>
          
          <View style={styles.operationItem}>
            <Text style={styles.operationIcon}>🗑️</Text>
            <Text style={styles.operationText}>Suppressions: {queueStats.byOperation.delete}</Text>
          </View>
        </View>
      </View>

      {/* Détails par priorité */}
      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>Répartition par priorité</Text>
        
        {Object.entries(queueStats.byPriority).map(([priority, count]) => (
          <View key={priority} style={styles.priorityItem}>
            <Text style={styles.priorityText}>
              Priorité {priority}: {count} éléments
            </Text>
            <View style={[styles.priorityBar, { width: `${(count / queueStats.pendingCount) * 100}%` }]} />
          </View>
        ))}
      </View>

      {/* Dernière action */}
      {lastAction && (
        <View style={styles.lastActionContainer}>
          <Text style={styles.lastActionText}>Dernière action: {lastAction}</Text>
        </View>
      )}

      {/* Erreurs */}
      {lastError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erreur: {lastError}</Text>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Instructions de test</Text>
        <Text style={styles.instructionsText}>
          1. Ajoutez des éléments à la queue avec les boutons{'\n'}
          2. Observez les statistiques se mettre à jour{'\n'}
          3. Déclenchez une synchronisation manuelle{'\n'}
          4. Coupez le réseau pour tester le mode offline{'\n'}
          5. Réactivez le réseau pour voir la sync automatique{'\n'}
          6. Utilisez "Vider la queue" pour nettoyer
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  networkContainer: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  networkText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  detailsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  actionsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  syncButton: {
    backgroundColor: '#FF9800',
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
  },
  clearButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  operationList: {
    marginTop: 10,
  },
  operationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  operationIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  operationText: {
    fontSize: 14,
    color: '#333',
  },
  priorityItem: {
    marginBottom: 10,
  },
  priorityText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  priorityBar: {
    height: 4,
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
  lastActionContainer: {
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  lastActionText: {
    fontSize: 14,
    color: '#1976D2',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    fontSize: 14,
    color: '#C62828',
  },
  instructionsContainer: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2E7D32',
  },
  instructionsText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
});

export default SyncQueueExample;

