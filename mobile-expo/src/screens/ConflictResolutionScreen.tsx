/**
 * Écran de résolution de conflits de synchronisation
 * 
 * Permet à l'utilisateur de résoudre manuellement les conflits détectés
 * lors de la synchronisation en choisissant entre :
 * - Garder les données locales (CLIENT_WINS)
 * - Garder les données serveur (SERVER_WINS)
 * - Fusionner les données (MERGE)
 * 
 * @author Sales Manager Team
 * @version 1.0
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useConflicts } from '../hooks/useConflicts';
import {
  Conflict,
  ConflictResolutionStrategy,
  ConflictStatus,
} from '../types/conflicts';

/**
 * Composant principal de l'écran
 */
export const ConflictResolutionScreen: React.FC = () => {
  const {
    conflicts,
    pendingConflicts,
    resolveConflict,
    isResolving,
    refresh,
  } = useConflicts();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  
  // Filtrer uniquement les conflits non résolus
  const unresolvedConflicts = conflicts.filter(
    c => c.status === ConflictStatus.PENDING
  );
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };
  
  const handleResolve = async (
    conflict: Conflict,
    strategy: ConflictResolutionStrategy
  ) => {
    try {
      await resolveConflict(conflict, strategy);
      
      Alert.alert(
        'Conflit résolu',
        `Le conflit a été résolu avec la stratégie ${getStrategyLabel(strategy)}`,
        [{ text: 'OK' }]
      );
      
      setSelectedConflict(null);
      await refresh();
      
    } catch (error) {
      Alert.alert(
        'Erreur',
        `Impossible de résoudre le conflit: ${error}`,
        [{ text: 'OK' }]
      );
    }
  };
  
  if (unresolvedConflicts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>✅</Text>
          <Text style={styles.emptyStateTitle}>Aucun conflit</Text>
          <Text style={styles.emptyStateText}>
            Tous les conflits ont été résolus !
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚠️ Résolution de conflits</Text>
        <Text style={styles.headerSubtitle}>
          {unresolvedConflicts.length} conflit{unresolvedConflicts.length > 1 ? 's' : ''} à résoudre
        </Text>
      </View>
      
      {/* Liste des conflits */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {unresolvedConflicts.map((conflict) => (
          <ConflictCard
            key={conflict.id}
            conflict={conflict}
            isSelected={selectedConflict?.id === conflict.id}
            onSelect={() => setSelectedConflict(conflict)}
            onResolve={handleResolve}
            isResolving={isResolving}
          />
        ))}
      </ScrollView>
      
      {/* Modal de résolution détaillée */}
      {selectedConflict && (
        <ConflictDetailModal
          conflict={selectedConflict}
          onClose={() => setSelectedConflict(null)}
          onResolve={handleResolve}
          isResolving={isResolving}
        />
      )}
    </View>
  );
};

/**
 * Carte de conflit dans la liste
 */
interface ConflictCardProps {
  conflict: Conflict;
  isSelected: boolean;
  onSelect: () => void;
  onResolve: (conflict: Conflict, strategy: ConflictResolutionStrategy) => void;
  isResolving: boolean;
}

const ConflictCard: React.FC<ConflictCardProps> = ({
  conflict,
  isSelected,
  onSelect,
  onResolve,
  isResolving,
}) => {
  const getConflictTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      UPDATE_UPDATE: 'Modification simultanée',
      UPDATE_DELETE: 'Modification vs Suppression',
      DELETE_UPDATE: 'Suppression vs Modification',
      CREATE_CREATE: 'Création simultanée',
      VERSION_CONFLICT: 'Conflit de version',
    };
    return labels[type] || type;
  };
  
  const getSeverityColor = (severity: string): string => {
    const colors: Record<string, string> = {
      LOW: '#10B981',
      MEDIUM: '#F59E0B',
      HIGH: '#EF4444',
      CRITICAL: '#991B1B',
    };
    return colors[severity] || '#6B7280';
  };
  
  return (
    <TouchableOpacity
      style={[styles.conflictCard, isSelected && styles.conflictCardSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      {/* En-tête */}
      <View style={styles.conflictHeader}>
        <View style={styles.conflictHeaderLeft}>
          <Text style={styles.conflictEntityType}>
            {conflict.entityType.toUpperCase()}
          </Text>
          <View
            style={[
              styles.severityBadge,
              { backgroundColor: getSeverityColor(conflict.severity) },
            ]}
          >
            <Text style={styles.severityText}>{conflict.severity}</Text>
          </View>
        </View>
        <Text style={styles.conflictTime}>
          {new Date(conflict.detectedAt).toLocaleTimeString()}
        </Text>
      </View>
      
      {/* Type de conflit */}
      <Text style={styles.conflictType}>
        {getConflictTypeLabel(conflict.conflictType)}
      </Text>
      
      {/* Aperçu des données */}
      <DataPreview
        label="Local"
        data={conflict.clientData}
        color="#3B82F6"
      />
      <DataPreview
        label="Serveur"
        data={conflict.serverData}
        color="#10B981"
      />
      
      {/* Actions rapides */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickButton, styles.quickButtonClient]}
          onPress={() => onResolve(conflict, ConflictResolutionStrategy.CLIENT_WINS)}
          disabled={isResolving}
        >
          <Text style={styles.quickButtonText}>📱 Garder local</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.quickButton, styles.quickButtonServer]}
          onPress={() => onResolve(conflict, ConflictResolutionStrategy.SERVER_WINS)}
          disabled={isResolving}
        >
          <Text style={styles.quickButtonText}>☁️ Garder serveur</Text>
        </TouchableOpacity>
      </View>
      
      {isResolving && (
        <View style={styles.resolvingOverlay}>
          <ActivityIndicator color="#FFFFFF" />
          <Text style={styles.resolvingText}>Résolution...</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

/**
 * Aperçu des données
 */
interface DataPreviewProps {
  label: string;
  data: any;
  color: string;
}

const DataPreview: React.FC<DataPreviewProps> = ({ label, data, color }) => {
  const getPreviewText = (data: any): string => {
    if (!data) return 'Aucune donnée';
    
    // Extraire les champs principaux
    const fields: string[] = [];
    
    if (data.name) fields.push(`Nom: ${data.name}`);
    if (data.price) fields.push(`Prix: ${data.price}`);
    if (data.stock_quantity !== undefined) fields.push(`Stock: ${data.stock_quantity}`);
    if (data.amount) fields.push(`Montant: ${data.amount}`);
    if (data.quantity) fields.push(`Quantité: ${data.quantity}`);
    
    return fields.length > 0 ? fields.join(' • ') : JSON.stringify(data).substring(0, 50);
  };
  
  return (
    <View style={styles.dataPreview}>
      <View style={[styles.dataPreviewLabel, { backgroundColor: color }]}>
        <Text style={styles.dataPreviewLabelText}>{label}</Text>
      </View>
      <Text style={styles.dataPreviewText} numberOfLines={2}>
        {getPreviewText(data)}
      </Text>
    </View>
  );
};

/**
 * Modal de détails du conflit
 */
interface ConflictDetailModalProps {
  conflict: Conflict;
  onClose: () => void;
  onResolve: (conflict: Conflict, strategy: ConflictResolutionStrategy) => void;
  isResolving: boolean;
}

const ConflictDetailModal: React.FC<ConflictDetailModalProps> = ({
  conflict,
  onClose,
  onResolve,
  isResolving,
}) => {
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Détails du conflit</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        {/* Contenu */}
        <ScrollView style={styles.modalBody}>
          {/* Informations générales */}
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Type d'entité</Text>
            <Text style={styles.infoValue}>{conflict.entityType}</Text>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>ID de l'entité</Text>
            <Text style={styles.infoValue}>{conflict.entityId}</Text>
          </View>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Type de conflit</Text>
            <Text style={styles.infoValue}>{conflict.conflictType}</Text>
          </View>
          
          {/* Comparaison des données */}
          <Text style={styles.comparisonTitle}>Comparaison des données</Text>
          
          <DataComparison
            localData={conflict.clientData}
            serverData={conflict.serverData}
          />
        </ScrollView>
        
        {/* Actions */}
        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonClient]}
            onPress={() => onResolve(conflict, ConflictResolutionStrategy.CLIENT_WINS)}
            disabled={isResolving}
          >
            {isResolving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>📱 Garder local</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonServer]}
            onPress={() => onResolve(conflict, ConflictResolutionStrategy.SERVER_WINS)}
            disabled={isResolving}
          >
            {isResolving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>☁️ Garder serveur</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonMerge]}
            onPress={() => onResolve(conflict, ConflictResolutionStrategy.MERGE_STRATEGY)}
            disabled={isResolving}
          >
            {isResolving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>🔀 Fusionner</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

/**
 * Composant de comparaison de données
 */
interface DataComparisonProps {
  localData: any;
  serverData: any;
}

const DataComparison: React.FC<DataComparisonProps> = ({ localData, serverData }) => {
  // Obtenir tous les champs uniques
  const allKeys = Array.from(
    new Set([
      ...Object.keys(localData || {}),
      ...Object.keys(serverData || {}),
    ])
  );
  
  const isDifferent = (key: string): boolean => {
    return JSON.stringify(localData?.[key]) !== JSON.stringify(serverData?.[key]);
  };
  
  return (
    <View style={styles.comparisonContainer}>
      <View style={styles.comparisonHeader}>
        <Text style={styles.comparisonHeaderText}>Local</Text>
        <Text style={styles.comparisonHeaderText}>Serveur</Text>
      </View>
      
      {allKeys.map((key) => (
        <View
          key={key}
          style={[
            styles.comparisonRow,
            isDifferent(key) && styles.comparisonRowDifferent,
          ]}
        >
          <View style={styles.comparisonCell}>
            <Text style={styles.comparisonKey}>{key}</Text>
            <Text style={styles.comparisonValue}>
              {formatValue(localData?.[key])}
            </Text>
          </View>
          
          <View style={styles.comparisonDivider} />
          
          <View style={styles.comparisonCell}>
            <Text style={styles.comparisonKey}>{key}</Text>
            <Text style={styles.comparisonValue}>
              {formatValue(serverData?.[key])}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

/**
 * Fonctions utilitaires
 */
function getStrategyLabel(strategy: ConflictResolutionStrategy): string {
  const labels: Record<string, string> = {
    [ConflictResolutionStrategy.CLIENT_WINS]: 'Garder local',
    [ConflictResolutionStrategy.SERVER_WINS]: 'Garder serveur',
    [ConflictResolutionStrategy.MERGE_STRATEGY]: 'Fusionner',
    [ConflictResolutionStrategy.LAST_WRITE_WINS]: 'Dernière écriture',
  };
  return labels[strategy] || strategy;
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  conflictCard: {
    backgroundColor: '#FFFFFF',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  conflictCardSelected: {
    borderColor: '#3B82F6',
  },
  conflictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  conflictHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conflictEntityType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  conflictTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  conflictType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  dataPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataPreviewLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  dataPreviewLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dataPreviewText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickButtonClient: {
    backgroundColor: '#3B82F6',
  },
  quickButtonServer: {
    backgroundColor: '#10B981',
  },
  quickButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resolvingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
  },
  resolvingText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
  },
  modalBody: {
    padding: 16,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
    marginBottom: 12,
  },
  comparisonContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  comparisonHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 8,
  },
  comparisonHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  comparisonRowDifferent: {
    backgroundColor: '#FEF3C7',
  },
  comparisonCell: {
    flex: 1,
    padding: 8,
  },
  comparisonDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  comparisonKey: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  comparisonValue: {
    fontSize: 13,
    color: '#111827',
  },
  modalActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonClient: {
    backgroundColor: '#3B82F6',
  },
  actionButtonServer: {
    backgroundColor: '#10B981',
  },
  actionButtonMerge: {
    backgroundColor: '#8B5CF6',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ConflictResolutionScreen;


