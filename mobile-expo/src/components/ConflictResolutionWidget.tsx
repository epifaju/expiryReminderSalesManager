/**
 * Widget de résolution de conflits
 * 
 * Composant réutilisable pour afficher et résoudre des conflits
 * Peut être intégré dans n'importe quelle vue de l'application
 * 
 * @author Sales Manager Team
 * @version 1.0
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  Conflict,
  ConflictResolutionStrategy,
} from '../types/conflicts';

interface ConflictResolutionWidgetProps {
  conflict: Conflict;
  onResolve: (strategy: ConflictResolutionStrategy) => void;
  isResolving?: boolean;
  compact?: boolean;
}

/**
 * Widget de résolution de conflit
 */
export const ConflictResolutionWidget: React.FC<ConflictResolutionWidgetProps> = ({
  conflict,
  onResolve,
  isResolving = false,
  compact = false,
}) => {
  if (compact) {
    return <ConflictWidgetCompact conflict={conflict} onResolve={onResolve} isResolving={isResolving} />;
  }
  
  return <ConflictWidgetFull conflict={conflict} onResolve={onResolve} isResolving={isResolving} />;
};

/**
 * Version compacte du widget
 */
const ConflictWidgetCompact: React.FC<ConflictResolutionWidgetProps> = ({
  conflict,
  onResolve,
  isResolving,
}) => {
  return (
    <View style={styles.compactWidget}>
      <View style={styles.compactHeader}>
        <Text style={styles.compactTitle}>⚠️ Conflit détecté</Text>
        <Text style={styles.compactType}>{conflict.conflictType}</Text>
      </View>
      
      <View style={styles.compactActions}>
        <TouchableOpacity
          style={[styles.compactButton, styles.compactButtonClient]}
          onPress={() => onResolve(ConflictResolutionStrategy.CLIENT_WINS)}
          disabled={isResolving}
        >
          <Text style={styles.compactButtonText}>Local</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.compactButton, styles.compactButtonServer]}
          onPress={() => onResolve(ConflictResolutionStrategy.SERVER_WINS)}
          disabled={isResolving}
        >
          <Text style={styles.compactButtonText}>Serveur</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Version complète du widget
 */
const ConflictWidgetFull: React.FC<ConflictResolutionWidgetProps> = ({
  conflict,
  onResolve,
  isResolving,
}) => {
  return (
    <View style={styles.fullWidget}>
      {/* En-tête */}
      <View style={styles.fullHeader}>
        <Text style={styles.fullTitle}>
          Conflit : {conflict.entityType} #{conflict.entityId.substring(0, 8)}
        </Text>
        <View style={[styles.severityBadge, getSeverityStyle(conflict.severity)]}>
          <Text style={styles.severityText}>{conflict.severity}</Text>
        </View>
      </View>
      
      <Text style={styles.conflictTypeText}>{conflict.conflictType}</Text>
      
      {/* Comparaison */}
      <View style={styles.comparisonGrid}>
        <View style={styles.dataColumn}>
          <Text style={styles.columnTitle}>📱 Local</Text>
          <DataView data={conflict.clientData} />
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.dataColumn}>
          <Text style={styles.columnTitle}>☁️ Serveur</Text>
          <DataView data={conflict.serverData} />
        </View>
      </View>
      
      {/* Actions */}
      <View style={styles.fullActions}>
        <TouchableOpacity
          style={[styles.fullButton, styles.fullButtonClient]}
          onPress={() => onResolve(ConflictResolutionStrategy.CLIENT_WINS)}
          disabled={isResolving}
        >
          {isResolving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.fullButtonIcon}>📱</Text>
              <Text style={styles.fullButtonText}>Garder local</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.fullButton, styles.fullButtonServer]}
          onPress={() => onResolve(ConflictResolutionStrategy.SERVER_WINS)}
          disabled={isResolving}
        >
          {isResolving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.fullButtonIcon}>☁️</Text>
              <Text style={styles.fullButtonText}>Garder serveur</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.fullButton, styles.fullButtonMerge]}
          onPress={() => onResolve(ConflictResolutionStrategy.MERGE_STRATEGY)}
          disabled={isResolving}
        >
          {isResolving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.fullButtonIcon}>🔀</Text>
              <Text style={styles.fullButtonText}>Fusionner</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Affichage des données
 */
const DataView: React.FC<{ data: any }> = ({ data }) => {
  if (!data) {
    return <Text style={styles.noData}>Aucune donnée</Text>;
  }
  
  const importantFields = ['name', 'price', 'stock_quantity', 'amount', 'quantity'];
  const fieldsToShow = Object.entries(data)
    .filter(([key]) => importantFields.includes(key))
    .slice(0, 5);
  
  return (
    <View style={styles.dataView}>
      {fieldsToShow.map(([key, value]) => (
        <View key={key} style={styles.dataField}>
          <Text style={styles.dataFieldKey}>{key}:</Text>
          <Text style={styles.dataFieldValue} numberOfLines={1}>
            {formatDataValue(value)}
          </Text>
        </View>
      ))}
    </View>
  );
};

/**
 * Badge de notification de conflit
 */
export const ConflictBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count === 0) return null;
  
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count}</Text>
    </View>
  );
};

/**
 * Fonctions utilitaires
 */
function getSeverityStyle(severity: string) {
  const styles: Record<string, any> = {
    LOW: { backgroundColor: '#10B981' },
    MEDIUM: { backgroundColor: '#F59E0B' },
    HIGH: { backgroundColor: '#EF4444' },
    CRITICAL: { backgroundColor: '#991B1B' },
  };
  return styles[severity] || { backgroundColor: '#6B7280' };
}

function formatDataValue(value: any): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Styles
 */
const styles = StyleSheet.create({
  // Widget compact
  compactWidget: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  compactType: {
    fontSize: 11,
    color: '#78350F',
  },
  compactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  compactButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  compactButtonClient: {
    backgroundColor: '#3B82F6',
  },
  compactButtonServer: {
    backgroundColor: '#10B981',
  },
  compactButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Widget complet
  fullWidget: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fullHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fullTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
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
  conflictTypeText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  comparisonGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dataColumn: {
    flex: 1,
  },
  columnTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  divider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  dataView: {
    gap: 6,
  },
  dataField: {
    flexDirection: 'row',
    gap: 4,
  },
  dataFieldKey: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  dataFieldValue: {
    fontSize: 11,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
  },
  noData: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  fullActions: {
    gap: 8,
  },
  fullButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  fullButtonClient: {
    backgroundColor: '#3B82F6',
  },
  fullButtonServer: {
    backgroundColor: '#10B981',
  },
  fullButtonMerge: {
    backgroundColor: '#8B5CF6',
  },
  fullButtonIcon: {
    fontSize: 16,
  },
  fullButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Badge
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default ConflictResolutionWidget;

