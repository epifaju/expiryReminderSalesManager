/**
 * Exemple d'utilisation du service de résolution de conflits
 * Démonstration complète des fonctionnalités de résolution de conflits
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import {
  useConflicts,
  useConflictDetection,
  useAutoConflictResolution,
  ConflictType,
  ConflictResolutionStrategy,
  ConflictStatus,
  ConflictSeverity,
  ConflictContext
} from './src/services/conflicts';

/**
 * Composant d'exemple pour le service de résolution de conflits
 */
const ConflictServiceExample: React.FC = () => {
  // Hooks de conflits
  const {
    conflicts,
    pendingConflicts,
    resolvedConflicts,
    isInitialized,
    metrics,
    generateReport,
    hasConflicts,
    hasPendingConflicts,
    conflictCount,
    pendingCount
  } = useConflicts();

  const {
    detect,
    clear: clearDetection,
    isDetecting,
    detectedConflicts,
    error: detectionError,
    hasConflicts: hasDetectedConflicts,
    conflictCount: detectedCount
  } = useConflictDetection();

  const {
    resolveAll,
    clear: clearResolution,
    isResolving,
    results,
    error: resolutionError,
    successCount,
    failureCount,
    requiresApprovalCount,
    successRate
  } = useAutoConflictResolution();

  // États locaux
  const [testResults, setTestResults] = useState<string[]>([]);

  /**
   * Ajoute un résultat de test
   */
  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  /**
   * Génère des données de test avec conflits
   */
  const generateTestData = () => {
    const baseProduct = {
      id: 'product_123',
      name: 'Produit Test',
      price: 100,
      stock: 50,
      version: 1,
      updated_at: new Date().toISOString()
    };

    const clientData = {
      ...baseProduct,
      name: 'Produit Test Modifié Client',
      price: 120,
      version: 2,
      updated_at: new Date(Date.now() - 5000).toISOString() // 5 secondes plus tôt
    };

    const serverData = {
      ...baseProduct,
      name: 'Produit Test Modifié Serveur',
      stock: 30,
      version: 2,
      updated_at: new Date().toISOString() // Maintenant
    };

    return { clientData, serverData };
  };

  /**
   * Génère des données de vente avec conflits
   */
  const generateSaleTestData = () => {
    const baseSale = {
      id: 'sale_456',
      amount: 200,
      quantity: 2,
      customer_name: 'Client Test',
      version: 1,
      updated_at: new Date().toISOString()
    };

    const clientData = {
      ...baseSale,
      amount: 250,
      quantity: 3,
      version: 2,
      updated_at: new Date(Date.now() - 3000).toISOString()
    };

    const serverData = {
      ...baseSale,
      customer_name: 'Client Test Modifié',
      version: 2,
      updated_at: new Date().toISOString()
    };

    return { clientData, serverData };
  };

  /**
   * Génère des données de mouvement de stock avec conflits
   */
  const generateStockMovementTestData = () => {
    const baseMovement = {
      id: 'movement_789',
      product_id: 'product_123',
      quantity: 10,
      movement_type: 'in',
      reason: 'Réapprovisionnement',
      version: 1,
      updated_at: new Date().toISOString()
    };

    const clientData = {
      ...baseMovement,
      quantity: 15,
      reason: 'Réapprovisionnement Client',
      version: 2,
      updated_at: new Date(Date.now() - 2000).toISOString()
    };

    const serverData = {
      ...baseMovement,
      movement_type: 'out',
      reason: 'Vente',
      version: 2,
      updated_at: new Date().toISOString()
    };

    return { clientData, serverData };
  };

  /**
   * Test de détection de conflits produits
   */
  const testProductConflicts = async () => {
    try {
      addTestResult('🔄 Test détection conflits produits...');
      
      const { clientData, serverData } = generateTestData();
      const context: ConflictContext = {
        userId: 'user_123',
        deviceId: 'device_456',
        syncSessionId: 'session_789',
        timestamp: new Date().toISOString(),
        metadata: { test: true }
      };

      const detectedConflicts = await detect(clientData, serverData, 'product', context);
      
      addTestResult(`✅ ${detectedConflicts.length} conflits produits détectés`);
      detectedConflicts.forEach(conflict => {
        addTestResult(`   • ${conflict.conflictType} - ${conflict.severity} - ${conflict.status}`);
      });
      
    } catch (error) {
      addTestResult(`❌ Erreur test produits: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  /**
   * Test de détection de conflits ventes
   */
  const testSaleConflicts = async () => {
    try {
      addTestResult('🔄 Test détection conflits ventes...');
      
      const { clientData, serverData } = generateSaleTestData();
      const context: ConflictContext = {
        userId: 'user_123',
        deviceId: 'device_456',
        syncSessionId: 'session_789',
        timestamp: new Date().toISOString(),
        metadata: { test: true }
      };

      const detectedConflicts = await detect(clientData, serverData, 'sale', context);
      
      addTestResult(`✅ ${detectedConflicts.length} conflits ventes détectés`);
      detectedConflicts.forEach(conflict => {
        addTestResult(`   • ${conflict.conflictType} - ${conflict.severity} - ${conflict.status}`);
      });
      
    } catch (error) {
      addTestResult(`❌ Erreur test ventes: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  /**
   * Test de détection de conflits mouvements de stock
   */
  const testStockMovementConflicts = async () => {
    try {
      addTestResult('🔄 Test détection conflits mouvements de stock...');
      
      const { clientData, serverData } = generateStockMovementTestData();
      const context: ConflictContext = {
        userId: 'user_123',
        deviceId: 'device_456',
        syncSessionId: 'session_789',
        timestamp: new Date().toISOString(),
        metadata: { test: true }
      };

      const detectedConflicts = await detect(clientData, serverData, 'stock_movement', context);
      
      addTestResult(`✅ ${detectedConflicts.length} conflits mouvements détectés`);
      detectedConflicts.forEach(conflict => {
        addTestResult(`   • ${conflict.conflictType} - ${conflict.severity} - ${conflict.status}`);
      });
      
    } catch (error) {
      addTestResult(`❌ Erreur test mouvements: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  /**
   * Test de résolution automatique
   */
  const testAutoResolution = async () => {
    try {
      addTestResult('🔄 Test résolution automatique...');
      
      if (detectedConflicts.length === 0) {
        addTestResult('⚠️ Aucun conflit détecté pour la résolution');
        return;
      }

      const resolutionResults = await resolveAll(detectedConflicts);
      
      addTestResult(`✅ Résolution automatique terminée`);
      addTestResult(`   • Succès: ${successCount}`);
      addTestResult(`   • Échecs: ${failureCount}`);
      addTestResult(`   • Approbation requise: ${requiresApprovalCount}`);
      addTestResult(`   • Taux de succès: ${(successRate * 100).toFixed(1)}%`);
      
    } catch (error) {
      addTestResult(`❌ Erreur résolution automatique: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  /**
   * Test de résolution avec stratégie spécifique
   */
  const testSpecificResolution = async () => {
    try {
      addTestResult('🔄 Test résolution avec stratégie Last Write Wins...');
      
      if (pendingConflicts.length === 0) {
        addTestResult('⚠️ Aucun conflit en attente pour la résolution');
        return;
      }

      const conflict = pendingConflicts[0];
      const resolutionResults = await resolveAll([conflict]);
      
      if (resolutionResults.length > 0) {
        const result = resolutionResults[0];
        addTestResult(`✅ Conflit ${conflict.id} résolu avec succès`);
        addTestResult(`   • Stratégie: ${result.resolution?.strategy}`);
        addTestResult(`   • Confiance: ${(result.confidence * 100).toFixed(1)}%`);
        addTestResult(`   • Approbation requise: ${result.requiresApproval ? 'Oui' : 'Non'}`);
      }
      
    } catch (error) {
      addTestResult(`❌ Erreur résolution spécifique: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  /**
   * Test de génération de rapport
   */
  const testGenerateReport = async () => {
    try {
      addTestResult('🔄 Test génération rapport...');
      
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24h
      
      const report = await generateReport({ start: startDate, end: endDate });
      
      addTestResult(`✅ Rapport généré avec succès`);
      addTestResult(`   • Conflits totaux: ${report.summary.totalConflicts}`);
      addTestResult(`   • Conflits résolus: ${report.summary.resolvedConflicts}`);
      addTestResult(`   • Conflits en attente: ${report.summary.pendingConflicts}`);
      addTestResult(`   • Recommandations: ${report.recommendations.length}`);
      
    } catch (error) {
      addTestResult(`❌ Erreur génération rapport: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  /**
   * Nettoie les détections
   */
  const handleClearDetections = () => {
    clearDetection();
    addTestResult('🧹 Détections nettoyées');
  };

  /**
   * Nettoie les résolutions
   */
  const handleClearResolutions = () => {
    clearResolution();
    addTestResult('🧹 Résolutions nettoyées');
  };

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>⏳ Initialisation du service de conflits...</Text>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>⚔️ Service de Résolution de Conflits - Démonstration</Text>
      
      {/* État actuel */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 État Actuel</Text>
        <Text style={styles.statusText}>
          {hasConflicts ? `⚔️ ${conflictCount} conflits détectés` : '✅ Aucun conflit détecté'}
        </Text>
        <Text style={styles.statusText}>
          {hasPendingConflicts ? `⏳ ${pendingCount} conflits en attente` : '✅ Aucun conflit en attente'}
        </Text>
        {detectionError && (
          <Text style={styles.errorText}>❌ Erreur détection: {detectionError.message}</Text>
        )}
        {resolutionError && (
          <Text style={styles.errorText}>❌ Erreur résolution: {resolutionError.message}</Text>
        )}
      </View>

      {/* Métriques */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Métriques</Text>
        <Text style={styles.statsText}>
          • Conflits totaux: {metrics.totalConflicts}
        </Text>
        <Text style={styles.statsText}>
          • Conflits résolus: {metrics.resolvedConflicts}
        </Text>
        <Text style={styles.statsText}>
          • Conflits en attente: {metrics.pendingConflicts}
        </Text>
        <Text style={styles.statsText}>
          • Conflits escaladés: {metrics.escalatedConflicts}
        </Text>
        <Text style={styles.statsText}>
          • Résolutions échouées: {metrics.failedResolutions}
        </Text>
        <Text style={styles.statsText}>
          • Taux de succès: {metrics.resolutionSuccessRate.toFixed(1)}%
        </Text>
      </View>

      {/* Tests de détection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔍 Tests de Détection</Text>
        
        <TouchableOpacity 
          style={[styles.button, isDetecting && styles.buttonDisabled]} 
          onPress={testProductConflicts}
          disabled={isDetecting}
        >
          <Text style={styles.buttonText}>🛍️ Test Conflits Produits</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, isDetecting && styles.buttonDisabled]} 
          onPress={testSaleConflicts}
          disabled={isDetecting}
        >
          <Text style={styles.buttonText}>💰 Test Conflits Ventes</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, isDetecting && styles.buttonDisabled]} 
          onPress={testStockMovementConflicts}
          disabled={isDetecting}
        >
          <Text style={styles.buttonText}>📦 Test Conflits Mouvements</Text>
        </TouchableOpacity>
      </View>

      {/* Tests de résolution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Tests de Résolution</Text>
        
        <TouchableOpacity 
          style={[styles.button, (isResolving || !hasDetectedConflicts) && styles.buttonDisabled]} 
          onPress={testAutoResolution}
          disabled={isResolving || !hasDetectedConflicts}
        >
          <Text style={styles.buttonText}>🤖 Résolution Automatique</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, (isResolving || !hasPendingConflicts) && styles.buttonDisabled]} 
          onPress={testSpecificResolution}
          disabled={isResolving || !hasPendingConflicts}
        >
          <Text style={styles.buttonText}>⚡ Résolution Spécifique</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button} 
          onPress={testGenerateReport}
        >
          <Text style={styles.buttonText}>📊 Générer Rapport</Text>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Actions</Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={handleClearDetections}
        >
          <Text style={styles.buttonText}>🧹 Nettoyer Détections</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={handleClearResolutions}
        >
          <Text style={styles.buttonText}>🧹 Nettoyer Résolutions</Text>
        </TouchableOpacity>
      </View>

      {/* Conflits détectés */}
      {hasDetectedConflicts && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 Conflits Détectés ({detectedCount})</Text>
          {detectedConflicts.map(conflict => (
            <View key={conflict.id} style={styles.conflictItem}>
              <Text style={styles.conflictText}>
                • {conflict.entityType} - {conflict.conflictType}
              </Text>
              <Text style={styles.conflictSubText}>
                Gravité: {conflict.severity} | Statut: {conflict.status}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Résultats de résolution */}
      {results.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Résultats de Résolution</Text>
          <Text style={styles.statsText}>
            • Succès: {successCount}
          </Text>
          <Text style={styles.statsText}>
            • Échecs: {failureCount}
          </Text>
          <Text style={styles.statsText}>
            • Approbation requise: {requiresApprovalCount}
          </Text>
          <Text style={styles.statsText}>
            • Taux de succès: {(successRate * 100).toFixed(1)}%
          </Text>
        </View>
      )}

      {/* Historique des tests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Historique des Tests</Text>
        {testResults.length === 0 ? (
          <Text style={styles.emptyText}>Aucun test exécuté</Text>
        ) : (
          testResults.map((result, index) => (
            <Text key={index} style={styles.testResultText}>
              {result}
            </Text>
          ))
        )}
      </View>

      {/* Conflits en attente */}
      {hasPendingConflicts && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏳ Conflits en Attente ({pendingCount})</Text>
          {pendingConflicts.map(conflict => (
            <View key={conflict.id} style={styles.conflictItem}>
              <Text style={styles.conflictText}>
                • {conflict.entityType} - {conflict.conflictType}
              </Text>
              <Text style={styles.conflictSubText}>
                Gravité: {conflict.severity} | Raison: {conflict.conflictReason}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#FF3B30',
  },
  statsText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  testResultText: {
    fontSize: 12,
    marginBottom: 2,
    color: '#333',
    fontFamily: 'monospace',
  },
  conflictItem: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  conflictText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  conflictSubText: {
    fontSize: 12,
    color: '#666',
  },
});

export default ConflictServiceExample;

