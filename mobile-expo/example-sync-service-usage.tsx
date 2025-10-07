/**
 * Exemple d'utilisation du service de synchronisation
 * Démonstration complète des fonctionnalités de synchronisation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { useSyncService } from './src/hooks/useSyncService';
import {
  SyncState,
  EntityType,
  OperationType,
  SyncOperation
} from './src/types/sync';

const SyncServiceExample: React.FC = () => {
  const {
    syncState,
    syncProgress,
    syncMetadata,
    syncConfig,
    syncBatch,
    syncDelta,
    syncAll,
    forceSync,
    getServerStatus,
    updateConfig,
    isInitialized,
    isOnline,
    isSyncing,
    hasErrors,
    hasConflicts,
    lastSyncResult,
    lastDeltaResponse,
    lastError
  } = useSyncService();

  const [serverStatus, setServerStatus] = useState<any>(null);
  const [testOperations, setTestOperations] = useState<SyncOperation[]>([]);

  // Initialiser les données de test
  useEffect(() => {
    const operations: SyncOperation[] = [
      {
        entityId: '1',
        localId: 'local-1',
        entityType: EntityType.PRODUCT,
        operationType: OperationType.CREATE,
        entityData: {
          name: 'Produit Test 1',
          price: 29.99,
          category: 'Test'
        },
        timestamp: new Date().toISOString()
      },
      {
        entityId: '2',
        localId: 'local-2',
        entityType: EntityType.SALE,
        operationType: OperationType.CREATE,
        entityData: {
          amount: 59.98,
          quantity: 2,
          customerName: 'Client Test'
        },
        timestamp: new Date().toISOString()
      }
    ];
    setTestOperations(operations);
  }, []);

  // Actions de test
  const handleSyncBatch = async () => {
    try {
      console.log('🔄 Début synchronisation batch...');
      const result = await syncBatch(testOperations);
      Alert.alert('Succès', `Synchronisation batch réussie: ${result.successCount} succès, ${result.errorCount} erreurs`);
    } catch (error) {
      Alert.alert('Erreur', `Erreur synchronisation batch: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleSyncDelta = async () => {
    try {
      console.log('🔄 Début synchronisation delta...');
      const response = await syncDelta();
      Alert.alert('Succès', `Synchronisation delta réussie: ${response.totalModified} modifiées, ${response.totalDeleted} supprimées`);
    } catch (error) {
      Alert.alert('Erreur', `Erreur synchronisation delta: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleSyncAll = async () => {
    try {
      console.log('🔄 Début synchronisation complète...');
      const result = await syncAll();
      let message = 'Synchronisation complète réussie\n';
      if (result.batch) {
        message += `Batch: ${result.batch.successCount} succès\n`;
      }
      if (result.delta) {
        message += `Delta: ${result.delta.totalModified} modifiées`;
      }
      Alert.alert('Succès', message);
    } catch (error) {
      Alert.alert('Erreur', `Erreur synchronisation complète: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleForceSync = async () => {
    try {
      console.log('🔄 Début synchronisation forcée...');
      await forceSync();
      Alert.alert('Succès', 'Synchronisation forcée réussie');
    } catch (error) {
      Alert.alert('Erreur', `Erreur synchronisation forcée: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleGetServerStatus = async () => {
    try {
      console.log('🔄 Récupération statut serveur...');
      const status = await getServerStatus();
      setServerStatus(status);
      Alert.alert('Succès', `Statut serveur récupéré: ${status.status}`);
    } catch (error) {
      Alert.alert('Erreur', `Erreur récupération statut: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleUpdateConfig = async () => {
    try {
      console.log('🔄 Mise à jour configuration...');
      await updateConfig({
        batchSize: 25,
        maxRetries: 5,
        syncIntervalMs: 600000 // 10 minutes
      });
      Alert.alert('Succès', 'Configuration mise à jour');
    } catch (error) {
      Alert.alert('Erreur', `Erreur mise à jour config: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  // Fonction utilitaire pour formater l'état
  const getStateColor = (state: SyncState): string => {
    switch (state) {
      case SyncState.IDLE: return '#6B7280';
      case SyncState.SYNCING: return '#3B82F6';
      case SyncState.COMPLETED: return '#10B981';
      case SyncState.ERROR: return '#EF4444';
      case SyncState.PAUSED: return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStateText = (state: SyncState): string => {
    switch (state) {
      case SyncState.IDLE: return 'Inactif';
      case SyncState.SYNCING: return 'Synchronisation...';
      case SyncState.COMPLETED: return 'Terminé';
      case SyncState.ERROR: return 'Erreur';
      case SyncState.PAUSED: return 'En pause';
      default: return 'Inconnu';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Service de Synchronisation - Exemple</Text>

      {/* État de synchronisation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>État de Synchronisation</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: getStateColor(syncState) }]} />
          <Text style={styles.statusText}>{getStateText(syncState)}</Text>
          {isSyncing && <ActivityIndicator size="small" color="#3B82F6" />}
        </View>

        {/* Progrès */}
        {syncProgress.totalOperations > 0 && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {syncProgress.currentOperation} ({syncProgress.completedOperations}/{syncProgress.totalOperations})
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${syncProgress.progress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressPercent}>{syncProgress.progress}%</Text>
          </View>
        )}

        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>Erreurs: {syncProgress.errors}</Text>
          <Text style={styles.statsText}>Conflits: {syncProgress.conflicts}</Text>
        </View>
      </View>

      {/* Métadonnées */}
      {syncMetadata && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Métadonnées</Text>
          <Text style={styles.metadataText}>
            Dernière sync: {new Date(syncMetadata.lastSyncTimestamp).toLocaleString()}
          </Text>
          <Text style={styles.metadataText}>
            Type: {syncMetadata.lastSyncType} | Statut: {syncMetadata.lastSyncStatus}
          </Text>
          <Text style={styles.metadataText}>
            Total: {syncMetadata.totalSyncCount} | Succès: {syncMetadata.successfulSyncCount} | Échecs: {syncMetadata.failedSyncCount}
          </Text>
        </View>
      )}

      {/* Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration</Text>
        <Text style={styles.configText}>Taille batch: {syncConfig.batchSize}</Text>
        <Text style={styles.configText}>Max retry: {syncConfig.maxRetries}</Text>
        <Text style={styles.configText}>Timeout: {syncConfig.timeoutMs}ms</Text>
        <Text style={styles.configText}>Intervalle: {syncConfig.syncIntervalMs}ms</Text>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={handleSyncBatch}
          disabled={isSyncing}
        >
          <Text style={styles.buttonText}>Synchronisation Batch</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={handleSyncDelta}
          disabled={isSyncing}
        >
          <Text style={styles.buttonText}>Synchronisation Delta</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={handleSyncAll}
          disabled={isSyncing}
        >
          <Text style={styles.buttonText}>Synchronisation Complète</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={handleForceSync}
          disabled={isSyncing}
        >
          <Text style={styles.buttonText}>Synchronisation Forcée</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={handleGetServerStatus}
          disabled={isSyncing}
        >
          <Text style={styles.buttonText}>Statut Serveur</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={handleUpdateConfig}
          disabled={isSyncing}
        >
          <Text style={styles.buttonText}>Mettre à Jour Config</Text>
        </TouchableOpacity>
      </View>

      {/* Derniers résultats */}
      {lastSyncResult && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dernier Résultat Batch</Text>
          <Text style={styles.resultText}>Total traité: {lastSyncResult.totalProcessed}</Text>
          <Text style={styles.resultText}>Succès: {lastSyncResult.successCount}</Text>
          <Text style={styles.resultText}>Erreurs: {lastSyncResult.errorCount}</Text>
          <Text style={styles.resultText}>Conflits: {lastSyncResult.conflictCount}</Text>
          <Text style={styles.resultText}>Temps: {lastSyncResult.processingTimeMs}ms</Text>
        </View>
      )}

      {lastDeltaResponse && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dernière Réponse Delta</Text>
          <Text style={styles.resultText}>Modifiées: {lastDeltaResponse.totalModified}</Text>
          <Text style={styles.resultText}>Supprimées: {lastDeltaResponse.totalDeleted}</Text>
          <Text style={styles.resultText}>Has More: {lastDeltaResponse.hasMore ? 'Oui' : 'Non'}</Text>
        </View>
      )}

      {/* Erreur */}
      {lastError && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dernière Erreur</Text>
          <Text style={styles.errorText}>{lastError.message}</Text>
        </View>
      )}

      {/* Statut serveur */}
      {serverStatus && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statut Serveur</Text>
          <Text style={styles.resultText}>Status: {serverStatus.status}</Text>
          <Text style={styles.resultText}>Version: {serverStatus.version}</Text>
          <Text style={styles.resultText}>Temps serveur: {new Date(serverStatus.serverTime).toLocaleString()}</Text>
        </View>
      )}

      {/* Informations de connexion */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <Text style={styles.infoText}>Initialisé: {isInitialized ? 'Oui' : 'Non'}</Text>
        <Text style={styles.infoText}>En ligne: {isOnline ? 'Oui' : 'Non'}</Text>
        <Text style={styles.infoText}>En synchronisation: {isSyncing ? 'Oui' : 'Non'}</Text>
        <Text style={styles.infoText}>A des erreurs: {hasErrors ? 'Oui' : 'Non'}</Text>
        <Text style={styles.infoText}>A des conflits: {hasConflicts ? 'Oui' : 'Non'}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#111827'
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#374151'
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1
  },
  progressContainer: {
    marginBottom: 12
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4
  },
  progressPercent: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right'
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  statsText: {
    fontSize: 14,
    color: '#6B7280'
  },
  metadataText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4
  },
  configText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center'
  },
  primaryButton: {
    backgroundColor: '#3B82F6'
  },
  secondaryButton: {
    backgroundColor: '#6B7280'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500'
  },
  resultText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 4
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4
  }
});

export default SyncServiceExample;

