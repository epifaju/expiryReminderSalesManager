/**
 * Exemple d'utilisation de l'UI de résolution de conflits
 * 
 * Démontre :
 * - L'écran ConflictResolutionScreen
 * - Le widget ConflictResolutionWidget
 * - Les notifications ConflictNotification
 * - L'intégration complète
 * 
 * @author Sales Manager Team
 * @version 1.0
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import ConflictResolutionScreen from './src/screens/ConflictResolutionScreen';
import {
  ConflictResolutionWidget,
  ConflictBadge,
} from './src/components/ConflictResolutionWidget';
import {
  ConflictNotification,
  ConflictBanner,
  ConflictIndicator,
} from './src/components/ConflictNotification';
import ConflictService from './src/services/conflicts/ConflictService';
import { useConflicts } from './src/hooks/useConflicts';
import {
  Conflict,
  ConflictType,
  ConflictSeverity,
  ConflictResolutionStrategy,
} from './src/types/conflicts';

/**
 * Composant principal d'exemple
 */
export const ConflictResolutionExample: React.FC = () => {
  const [showScreen, setShowScreen] = useState(false);
  const [testConflict, setTestConflict] = useState<Conflict | null>(null);
  const [result, setResult] = useState<string>('');
  
  const { conflicts, pendingConflicts, pendingCount, resolveConflict } = useConflicts();
  
  // Initialisation
  useEffect(() => {
    initializeConflictService();
  }, []);
  
  const initializeConflictService = async () => {
    try {
      await ConflictService.initialize({
        enableAutoResolution: false, // Désactiver résolution auto pour les tests
        defaultStrategy: ConflictResolutionStrategy.MANUAL_RESOLUTION,
      });
      
      console.log('[EXAMPLE] Service de conflits initialisé');
      setResult('✅ Service initialisé');
    } catch (error) {
      console.error('[EXAMPLE] Erreur initialisation:', error);
      setResult(`❌ Erreur: ${error}`);
    }
  };
  
  // ============================================================================
  // Génération de conflits de test
  // ============================================================================
  
  const generateProductConflict = () => {
    const clientData = {
      id: '123',
      name: 'Riz Parfumé',
      price: 15000,
      stock_quantity: 50,
      category: 'Alimentation',
      updated_at: '2025-10-07T10:25:00Z',
    };
    
    const serverData = {
      id: '123',
      name: 'Riz Parfumé Premium',
      price: 14500,
      stock_quantity: 60,
      category: 'Alimentation',
      updated_at: '2025-10-07T10:30:00Z',
    };
    
    const conflicts = ConflictService.detectConflicts(
      clientData,
      serverData,
      'product',
      {
        userId: 'test-user',
        deviceId: 'test-device',
        syncSessionId: `session-${Date.now()}`,
        timestamp: new Date().toISOString(),
        metadata: {},
      }
    );
    
    if (conflicts.length > 0) {
      setTestConflict(conflicts[0]);
      setResult(`✅ Conflit généré:\n- Type: ${conflicts[0].conflictType}\n- Sévérité: ${conflicts[0].severity}`);
    }
  };
  
  const generateSaleConflict = () => {
    const clientData = {
      id: '456',
      customer_name: 'Jean Dupont',
      amount: 25000,
      quantity: 3,
      payment_method: 'CASH',
      updated_at: '2025-10-07T11:00:00Z',
    };
    
    const serverData = {
      id: '456',
      customer_name: 'Jean Dupont',
      amount: 25000,
      quantity: 3,
      payment_method: 'MOBILE_MONEY', // Différent !
      updated_at: '2025-10-07T11:05:00Z',
    };
    
    const conflicts = ConflictService.detectConflicts(
      clientData,
      serverData,
      'sale',
      {
        userId: 'test-user',
        deviceId: 'test-device',
        syncSessionId: `session-${Date.now()}`,
        timestamp: new Date().toISOString(),
        metadata: {},
      }
    );
    
    if (conflicts.length > 0) {
      setTestConflict(conflicts[0]);
      setResult(`✅ Conflit de vente généré`);
    }
  };
  
  const generateMultipleConflicts = () => {
    // Générer plusieurs conflits
    const conflicts = [
      generateConflictData('product', '1', { name: 'Produit A', price: 1000 }, { name: 'Produit A Modifié', price: 1200 }),
      generateConflictData('product', '2', { name: 'Produit B', price: 2000 }, { name: 'Produit B', price: 2500 }),
      generateConflictData('sale', '3', { amount: 5000, quantity: 2 }, { amount: 5000, quantity: 3 }),
    ];
    
    setResult(`✅ ${conflicts.length} conflits générés`);
  };
  
  const generateConflictData = (
    entityType: string,
    entityId: string,
    clientData: any,
    serverData: any
  ): Conflict[] => {
    return ConflictService.detectConflicts(
      clientData,
      serverData,
      entityType,
      {
        userId: 'test-user',
        deviceId: 'test-device',
        syncSessionId: `session-${Date.now()}`,
        timestamp: new Date().toISOString(),
        metadata: {},
      }
    );
  };
  
  // ============================================================================
  // Tests de résolution
  // ============================================================================
  
  const testResolveWithClientWins = async () => {
    if (!testConflict) {
      setResult('❌ Aucun conflit de test. Générez-en un d\'abord.');
      return;
    }
    
    try {
      const resolution = await ConflictService.resolveConflict(
        testConflict,
        ConflictResolutionStrategy.CLIENT_WINS
      );
      
      setResult(`✅ Conflit résolu avec CLIENT_WINS:\n` +
        `- Confiance: ${resolution.confidence}\n` +
        `- Données retenues: Local`
      );
      
      setTestConflict(null);
    } catch (error) {
      setResult(`❌ Erreur: ${error}`);
    }
  };
  
  const testResolveWithServerWins = async () => {
    if (!testConflict) {
      setResult('❌ Aucun conflit de test. Générez-en un d\'abord.');
      return;
    }
    
    try {
      const resolution = await ConflictService.resolveConflict(
        testConflict,
        ConflictResolutionStrategy.SERVER_WINS
      );
      
      setResult(`✅ Conflit résolu avec SERVER_WINS:\n` +
        `- Confiance: ${resolution.confidence}\n` +
        `- Données retenues: Serveur`
      );
      
      setTestConflict(null);
    } catch (error) {
      setResult(`❌ Erreur: ${error}`);
    }
  };
  
  const testResolveWithMerge = async () => {
    if (!testConflict) {
      setResult('❌ Aucun conflit de test. Générez-en un d\'abord.');
      return;
    }
    
    try {
      const resolution = await ConflictService.resolveConflict(
        testConflict,
        ConflictResolutionStrategy.MERGE_STRATEGY
      );
      
      setResult(`✅ Conflit résolu avec MERGE:\n` +
        `- Confiance: ${resolution.confidence}\n` +
        `- Données fusionnées`
      );
      
      setTestConflict(null);
    } catch (error) {
      setResult(`❌ Erreur: ${error}`);
    }
  };
  
  const clearAllConflicts = async () => {
    try {
      const allConflicts = ConflictService.getPendingConflicts();
      
      for (const conflict of allConflicts) {
        await ConflictService.resolveConflict(
          conflict,
          ConflictResolutionStrategy.SERVER_WINS
        );
      }
      
      setTestConflict(null);
      setResult(`✅ ${allConflicts.length} conflits résolus`);
    } catch (error) {
      setResult(`❌ Erreur: ${error}`);
    }
  };
  
  // ============================================================================
  // Rendu
  // ============================================================================
  
  if (showScreen) {
    return (
      <View style={styles.container}>
        <ConflictResolutionScreen />
        <View style={styles.screenActions}>
          <Button
            title="← Retour aux tests"
            onPress={() => setShowScreen(false)}
            color="#6B7280"
          />
        </View>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>⚔️ UI Résolution de Conflits</Text>
        <Text style={styles.subtitle}>Démonstration des composants</Text>
      </View>
      
      {/* Notifications */}
      <ConflictNotification position="top" />
      
      {/* État */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>État des conflits</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Conflits totaux:</Text>
          <Text style={styles.statusValue}>{conflicts.length}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Conflits en attente:</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[styles.statusValue, { color: pendingCount > 0 ? '#EF4444' : '#10B981' }]}>
              {pendingCount}
            </Text>
            <ConflictIndicator />
          </View>
        </View>
      </View>
      
      {/* Banner */}
      {pendingCount > 0 && (
        <ConflictBanner
          count={pendingCount}
          onPress={() => setShowScreen(true)}
        />
      )}
      
      {/* Génération de conflits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Générer des conflits de test</Text>
        
        <View style={styles.buttonGroup}>
          <Button
            title="📦 Conflit Produit (UPDATE_UPDATE)"
            onPress={generateProductConflict}
            color="#3B82F6"
          />
        </View>
        
        <View style={styles.buttonGroup}>
          <Button
            title="💰 Conflit Vente"
            onPress={generateSaleConflict}
            color="#10B981"
          />
        </View>
        
        <View style={styles.buttonGroup}>
          <Button
            title="📊 Conflits Multiples (3)"
            onPress={generateMultipleConflicts}
            color="#8B5CF6"
          />
        </View>
      </View>
      
      {/* Widget de test */}
      {testConflict && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Widget de conflit</Text>
          <ConflictResolutionWidget
            conflict={testConflict}
            onResolve={(strategy) => {
              Alert.alert(
                'Résolution',
                `Stratégie choisie: ${strategy}`,
                [
                  {
                    text: 'Annuler',
                    style: 'cancel',
                  },
                  {
                    text: 'Confirmer',
                    onPress: async () => {
                      try {
                        await ConflictService.resolveConflict(testConflict, strategy);
                        setTestConflict(null);
                        setResult('✅ Conflit résolu avec widget');
                      } catch (error) {
                        setResult(`❌ Erreur: ${error}`);
                      }
                    },
                  },
                ]
              );
            }}
          />
        </View>
      )}
      
      {/* Tests de résolution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tests de résolution</Text>
        
        <View style={styles.buttonGroup}>
          <Button
            title="📱 Résoudre avec CLIENT_WINS"
            onPress={testResolveWithClientWins}
            color="#3B82F6"
            disabled={!testConflict}
          />
        </View>
        
        <View style={styles.buttonGroup}>
          <Button
            title="☁️ Résoudre avec SERVER_WINS"
            onPress={testResolveWithServerWins}
            color="#10B981"
            disabled={!testConflict}
          />
        </View>
        
        <View style={styles.buttonGroup}>
          <Button
            title="🔀 Résoudre avec MERGE"
            onPress={testResolveWithMerge}
            color="#8B5CF6"
            disabled={!testConflict}
          />
        </View>
        
        <View style={styles.buttonGroup}>
          <Button
            title="🗑️ Nettoyer tous les conflits"
            onPress={clearAllConflicts}
            color="#EF4444"
          />
        </View>
      </View>
      
      {/* Écran complet */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Écran de résolution</Text>
        <Button
          title="📱 Afficher l'écran complet"
          onPress={() => setShowScreen(true)}
          color="#3B82F6"
        />
      </View>
      
      {/* Résultat */}
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Résultat:</Text>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      )}
      
      {/* Liste des conflits */}
      {pendingConflicts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Conflits en attente ({pendingConflicts.length})
          </Text>
          {pendingConflicts.map((conflict, index) => (
            <View key={conflict.id} style={styles.conflictListItem}>
              <Text style={styles.conflictListIndex}>{index + 1}.</Text>
              <View style={styles.conflictListContent}>
                <Text style={styles.conflictListType}>{conflict.conflictType}</Text>
                <Text style={styles.conflictListEntity}>
                  {conflict.entityType} #{conflict.entityId.substring(0, 8)}
                </Text>
              </View>
              <ConflictBadge count={1} />
            </View>
          ))}
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
    alignItems: 'center',
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
  screenActions: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  conflictListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  conflictListIndex: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  conflictListContent: {
    flex: 1,
  },
  conflictListType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  conflictListEntity: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default ConflictResolutionExample;

