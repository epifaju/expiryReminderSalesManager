/**
 * Composant Résolveur de conflits de synchronisation
 * Interface pour gérer et résoudre les conflits de données
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal
} from 'react-native';

/**
 * Interface pour un conflit de synchronisation
 */
interface SyncConflict {
  id: string;
  entityType: 'product' | 'sale' | 'stock_movement';
  entityId: string;
  localData: any;
  serverData: any;
  conflictType: 'update' | 'delete' | 'create';
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Interface pour les props du composant
 */
export interface SyncConflictResolverProps {
  /** Style personnalisé pour le conteneur */
  containerStyle?: any;
  /** Conflits à résoudre */
  conflicts?: SyncConflict[];
  /** Callback lors de la résolution d'un conflit */
  onConflictResolved?: (conflictId: string, resolution: 'local' | 'server' | 'merge') => void;
  /** Callback lors de la fermeture */
  onClose?: () => void;
}

/**
 * Composant Résolveur de conflits de synchronisation
 */
const SyncConflictResolver: React.FC<SyncConflictResolverProps> = ({
  containerStyle,
  conflicts = [],
  onConflictResolved,
  onClose
}) => {
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  /**
   * Données de démonstration
   */
  const mockConflicts: SyncConflict[] = [
    {
      id: '1',
      entityType: 'product',
      entityId: 'prod-123',
      localData: {
        name: 'Produit Local',
        price: 150,
        stock: 10,
        lastModified: '2024-01-15T10:30:00Z'
      },
      serverData: {
        name: 'Produit Serveur',
        price: 175,
        stock: 8,
        lastModified: '2024-01-15T11:45:00Z'
      },
      conflictType: 'update',
      timestamp: '2024-01-15T12:00:00Z',
      priority: 'high'
    },
    {
      id: '2',
      entityType: 'sale',
      entityId: 'sale-456',
      localData: {
        amount: 100,
        quantity: 2,
        customerName: 'Client Local',
        timestamp: '2024-01-15T09:15:00Z'
      },
      serverData: {
        amount: 120,
        quantity: 2,
        customerName: 'Client Serveur',
        timestamp: '2024-01-15T09:20:00Z'
      },
      conflictType: 'update',
      timestamp: '2024-01-15T10:00:00Z',
      priority: 'medium'
    }
  ];

  const displayConflicts = conflicts.length > 0 ? conflicts : mockConflicts;

  /**
   * Obtient l'icône selon le type d'entité
   */
  const getEntityIcon = (entityType: SyncConflict['entityType']): string => {
    switch (entityType) {
      case 'product': return '📦';
      case 'sale': return '💰';
      case 'stock_movement': return '📊';
      default: return '📄';
    }
  };

  /**
   * Obtient la couleur selon la priorité
   */
  const getPriorityColor = (priority: SyncConflict['priority']): string => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  /**
   * Obtient le texte de priorité
   */
  const getPriorityText = (priority: SyncConflict['priority']): string => {
    switch (priority) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Faible';
      default: return 'Inconnue';
    }
  };

  /**
   * Obtient le texte du type de conflit
   */
  const getConflictTypeText = (type: SyncConflict['conflictType']): string => {
    switch (type) {
      case 'update': return 'Mise à jour';
      case 'delete': return 'Suppression';
      case 'create': return 'Création';
      default: return 'Inconnu';
    }
  };

  /**
   * Formate le timestamp
   */
  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('fr-FR');
  };

  /**
   * Résout un conflit avec la stratégie choisie
   */
  const resolveConflict = (conflict: SyncConflict, resolution: 'local' | 'server' | 'merge') => {
    Alert.alert(
      'Résoudre le conflit',
      `Êtes-vous sûr de vouloir appliquer la stratégie "${resolution}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            onConflictResolved?.(conflict.id, resolution);
            setShowDetailModal(false);
            setSelectedConflict(null);
          }
        }
      ]
    );
  };

  /**
   * Affiche les détails d'un conflit
   */
  const showConflictDetails = (conflict: SyncConflict) => {
    setSelectedConflict(conflict);
    setShowDetailModal(true);
  };

  /**
   * Composant pour un élément de conflit
   */
  const ConflictItem = ({ conflict }: { conflict: SyncConflict }) => (
    <TouchableOpacity
      style={[
        styles.conflictItem,
        { borderLeftColor: getPriorityColor(conflict.priority) }
      ]}
      onPress={() => showConflictDetails(conflict)}
    >
      <View style={styles.conflictHeader}>
        <Text style={styles.conflictIcon}>{getEntityIcon(conflict.entityType)}</Text>
        <View style={styles.conflictInfo}>
          <Text style={styles.conflictTitle}>
            Conflit {getConflictTypeText(conflict.conflictType)}
          </Text>
          <Text style={styles.conflictEntity}>
            {conflict.entityType.toUpperCase()} - {conflict.entityId}
          </Text>
        </View>
        <View style={styles.conflictMeta}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(conflict.priority) }]}>
            <Text style={styles.priorityText}>{getPriorityText(conflict.priority)}</Text>
          </View>
          <Text style={styles.conflictTime}>{formatTimestamp(conflict.timestamp)}</Text>
        </View>
      </View>
      
      <View style={styles.conflictPreview}>
        <View style={styles.dataPreview}>
          <Text style={styles.dataLabel}>Local:</Text>
          <Text style={styles.dataValue}>
            {Object.keys(conflict.localData).slice(0, 2).map(key => 
              `${key}: ${conflict.localData[key]}`
            ).join(', ')}
          </Text>
        </View>
        <View style={styles.dataPreview}>
          <Text style={styles.dataLabel}>Serveur:</Text>
          <Text style={styles.dataValue}>
            {Object.keys(conflict.serverData).slice(0, 2).map(key => 
              `${key}: ${conflict.serverData[key]}`
            ).join(', ')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  /**
   * Composant pour les détails d'un conflit
   */
  const ConflictDetailModal = () => {
    if (!selectedConflict) return null;

    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Détails du Conflit</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDetailModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* En-tête du conflit */}
            <View style={styles.detailHeader}>
              <Text style={styles.detailIcon}>{getEntityIcon(selectedConflict.entityType)}</Text>
              <View style={styles.detailInfo}>
                <Text style={styles.detailTitle}>
                  Conflit {getConflictTypeText(selectedConflict.conflictType)}
                </Text>
                <Text style={styles.detailEntity}>
                  {selectedConflict.entityType.toUpperCase()} - {selectedConflict.entityId}
                </Text>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedConflict.priority) }]}>
                  <Text style={styles.priorityText}>
                    Priorité {getPriorityText(selectedConflict.priority)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Données locales */}
            <View style={styles.dataSection}>
              <Text style={styles.dataSectionTitle}>📱 Données Locales</Text>
              <View style={styles.dataContainer}>
                {Object.entries(selectedConflict.localData).map(([key, value]) => (
                  <View key={key} style={styles.dataRow}>
                    <Text style={styles.dataKey}>{key}:</Text>
                    <Text style={styles.dataValue}>{String(value)}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Données serveur */}
            <View style={styles.dataSection}>
              <Text style={styles.dataSectionTitle}>☁️ Données Serveur</Text>
              <View style={styles.dataContainer}>
                {Object.entries(selectedConflict.serverData).map(([key, value]) => (
                  <View key={key} style={styles.dataRow}>
                    <Text style={styles.dataKey}>{key}:</Text>
                    <Text style={styles.dataValue}>{String(value)}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Actions de résolution */}
            <View style={styles.resolutionSection}>
              <Text style={styles.resolutionTitle}>Choisir la résolution:</Text>
              
              <TouchableOpacity
                style={[styles.resolutionButton, styles.localButton]}
                onPress={() => resolveConflict(selectedConflict, 'local')}
              >
                <Text style={styles.resolutionButtonText}>
                  📱 Utiliser les données locales
                </Text>
                <Text style={styles.resolutionDescription}>
                  Garder les modifications locales et ignorer le serveur
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.resolutionButton, styles.serverButton]}
                onPress={() => resolveConflict(selectedConflict, 'server')}
              >
                <Text style={styles.resolutionButtonText}>
                  ☁️ Utiliser les données serveur
                </Text>
                <Text style={styles.resolutionDescription}>
                  Remplacer par les données du serveur
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.resolutionButton, styles.mergeButton]}
                onPress={() => resolveConflict(selectedConflict, 'merge')}
              >
                <Text style={styles.resolutionButtonText}>
                  🔄 Fusionner intelligemment
                </Text>
                <Text style={styles.resolutionDescription}>
                  Combiner les données des deux sources
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.title}>Conflits de Synchronisation</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{displayConflicts.length}</Text>
        </View>
      </View>

      {/* Liste des conflits */}
      {displayConflicts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>Aucun conflit</Text>
          <Text style={styles.emptyDescription}>
            Toutes les données sont synchronisées sans conflit
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.conflictsList} showsVerticalScrollIndicator={false}>
          {displayConflicts.map((conflict) => (
            <ConflictItem key={conflict.id} conflict={conflict} />
          ))}
        </ScrollView>
      )}

      {/* Actions globales */}
      {displayConflicts.length > 0 && (
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.resolveAllButton]}
            onPress={() => {
              Alert.alert(
                'Résoudre tous les conflits',
                'Voulez-vous appliquer la stratégie "Last-Write-Wins" à tous les conflits ?',
                [
                  { text: 'Annuler', style: 'cancel' },
                  {
                    text: 'Confirmer',
                    onPress: () => {
                      displayConflicts.forEach(conflict => {
                        onConflictResolved?.(conflict.id, 'server');
                      });
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.actionButtonText}>
              🔄 Résoudre tous (Last-Write-Wins)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.ignoreAllButton]}
            onPress={() => {
              Alert.alert(
                'Ignorer tous les conflits',
                'Voulez-vous ignorer tous les conflits et garder les données locales ?',
                [
                  { text: 'Annuler', style: 'cancel' },
                  {
                    text: 'Confirmer',
                    onPress: () => {
                      displayConflicts.forEach(conflict => {
                        onConflictResolved?.(conflict.id, 'local');
                      });
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.actionButtonText}>
              📱 Ignorer tous (garder local)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de détails */}
      <ConflictDetailModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  countBadge: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },

  countText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  emptyState: {
    alignItems: 'center',
    padding: 32,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },

  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },

  conflictsList: {
    maxHeight: 400,
  },

  conflictItem: {
    padding: 16,
    borderLeftWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  conflictIcon: {
    fontSize: 20,
    marginRight: 12,
  },

  conflictInfo: {
    flex: 1,
  },

  conflictTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },

  conflictEntity: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },

  conflictMeta: {
    alignItems: 'flex-end',
  },

  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },

  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },

  conflictTime: {
    fontSize: 10,
    color: '#999',
  },

  conflictPreview: {
    gap: 8,
  },

  dataPreview: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
  },

  dataLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 2,
  },

  dataValue: {
    fontSize: 11,
    color: '#333',
    fontFamily: 'monospace',
  },

  actionsSection: {
    padding: 16,
    gap: 8,
  },

  actionButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  resolveAllButton: {
    backgroundColor: '#2196F3',
  },

  ignoreAllButton: {
    backgroundColor: '#4CAF50',
  },

  actionButtonText: {
    color: 'white',
    fontSize: 14,
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

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },

  modalContent: {
    flex: 1,
    padding: 16,
  },

  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },

  detailIcon: {
    fontSize: 32,
    marginRight: 16,
  },

  detailInfo: {
    flex: 1,
  },

  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },

  detailEntity: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 8,
  },

  dataSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },

  dataSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },

  dataContainer: {
    gap: 8,
  },

  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },

  dataKey: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },

  dataValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    flex: 2,
    textAlign: 'right',
  },

  resolutionSection: {
    gap: 12,
  },

  resolutionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },

  resolutionButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },

  localButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },

  serverButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },

  mergeButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },

  resolutionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },

  resolutionDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});

export default SyncConflictResolver;

