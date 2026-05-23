/**
 * Exemple d'utilisation du service de retry
 * Démonstration complète des fonctionnalités de retry
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
  useRetry,
  useSyncRetry,
  useNetworkRetry,
  RetryReason,
  RetryStrategy
} from './src/services/retry';

/**
 * Composant d'exemple pour le service de retry
 */
const RetryServiceExample: React.FC = () => {
  // Hooks de retry
  const {
    executeWithRetry,
    executeSyncWithRetry,
    executeNetworkWithRetry,
    executeCriticalWithRetry,
    isRetrying,
    currentAttempt,
    lastError,
    lastResult,
    stats,
    history,
    refreshStats,
    refreshHistory,
    clearHistory,
    isInitialized,
    hasErrors
  } = useRetry();

  // États locaux
  const [testResults, setTestResults] = useState<string[]>([]);

  /**
   * Ajoute un résultat de test
   */
  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  /**
   * Simule une opération qui échoue aléatoirement
   */
  const simulateFailingOperation = async (successRate: number = 0.3): Promise<string> => {
    const delay = Math.random() * 2000 + 1000; // 1-3 secondes
    await new Promise(resolve => setTimeout(resolve, delay));
    
    if (Math.random() < successRate) {
      return `Opération réussie après ${Math.round(delay)}ms`;
    } else {
      throw new Error(`Opération échouée après ${Math.round(delay)}ms (simulation)`);
    }
  };

  /**
   * Simule une opération réseau
   */
  const simulateNetworkOperation = async (): Promise<string> => {
    const delay = Math.random() * 3000 + 500;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Simuler différents types d'erreurs réseau
    const errorType = Math.random();
    if (errorType < 0.3) {
      throw new Error('Network timeout');
    } else if (errorType < 0.6) {
      throw new Error('Connection refused');
    } else if (errorType < 0.8) {
      throw new Error('Server error 500');
    } else {
      return `Réseau OK après ${Math.round(delay)}ms`;
    }
  };

  /**
   * Simule une opération de synchronisation
   */
  const simulateSyncOperation = async (): Promise<string> => {
    const delay = Math.random() * 1500 + 500;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Simuler des erreurs de sync
    const errorType = Math.random();
    if (errorType < 0.4) {
      throw new Error('Sync conflict detected');
    } else if (errorType < 0.7) {
      throw new Error('Rate limit exceeded');
    } else {
      return `Sync réussi après ${Math.round(delay)}ms`;
    }
  };

  /**
   * Test de retry basique
   */
  const testBasicRetry = async () => {
    try {
      addTestResult('🔄 Début test retry basique...');
      
      const result = await executeWithRetry(
        () => simulateFailingOperation(0.3),
        {
          config: {
            maxRetries: 3,
            baseDelayMs: 1000,
            strategy: RetryStrategy.EXPONENTIAL
          },
          onAttempt: (attempt) => {
            addTestResult(`   Tentative ${attempt.attemptNumber}: ${attempt.reason}`);
          },
          onSuccess: (data, attempts) => {
            addTestResult(`✅ Succès après ${attempts.length} tentatives: ${data}`);
          },
          onFailure: (error, attempts) => {
            addTestResult(`❌ Échec après ${attempts.length} tentatives: ${error.message}`);
          }
        }
      );
      
      addTestResult(`🎉 Résultat final: ${result.success ? 'SUCCÈS' : 'ÉCHEC'}`);
      
    } catch (error) {
      addTestResult(`💥 Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  /**
   * Test de retry de synchronisation
   */
  const testSyncRetry = async () => {
    try {
      addTestResult('🔄 Début test retry sync...');
      
      const result = await executeSyncWithRetry(
        () => simulateSyncOperation(),
        {
          onAttempt: (attempt) => {
            addTestResult(`   Sync tentative ${attempt.attemptNumber}: ${attempt.reason}`);
          },
          onSuccess: (data, attempts) => {
            addTestResult(`✅ Sync réussi après ${attempts.length} tentatives: ${data}`);
          },
          onFailure: (error, attempts) => {
            addTestResult(`❌ Sync échoué après ${attempts.length} tentatives: ${error.message}`);
          }
        }
      );
      
      addTestResult(`🎉 Sync résultat: ${result.success ? 'SUCCÈS' : 'ÉCHEC'}`);
      
    } catch (error) {
      addTestResult(`💥 Sync erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  /**
   * Test de retry réseau agressif
   */
  const testNetworkRetry = async () => {
    try {
      addTestResult('🔄 Début test retry réseau...');
      
      const result = await executeNetworkWithRetry(
        () => simulateNetworkOperation(),
        {
          onAttempt: (attempt) => {
            addTestResult(`   Réseau tentative ${attempt.attemptNumber}: ${attempt.reason}`);
          },
          onSuccess: (data, attempts) => {
            addTestResult(`✅ Réseau OK après ${attempts.length} tentatives: ${data}`);
          },
          onFailure: (error, attempts) => {
            addTestResult(`❌ Réseau échoué après ${attempts.length} tentatives: ${error.message}`);
          }
        }
      );
      
      addTestResult(`🎉 Réseau résultat: ${result.success ? 'SUCCÈS' : 'ÉCHEC'}`);
      
    } catch (error) {
      addTestResult(`💥 Réseau erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  /**
   * Test de retry critique conservateur
   */
  const testCriticalRetry = async () => {
    try {
      addTestResult('🔄 Début test retry critique...');
      
      const result = await executeCriticalWithRetry(
        () => simulateFailingOperation(0.6),
        {
          onAttempt: (attempt) => {
            addTestResult(`   Critique tentative ${attempt.attemptNumber}: ${attempt.reason}`);
          },
          onSuccess: (data, attempts) => {
            addTestResult(`✅ Critique réussi après ${attempts.length} tentatives: ${data}`);
          },
          onFailure: (error, attempts) => {
            addTestResult(`❌ Critique échoué après ${attempts.length} tentatives: ${error.message}`);
          }
        }
      );
      
      addTestResult(`🎉 Critique résultat: ${result.success ? 'SUCCÈS' : 'ÉCHEC'}`);
      
    } catch (error) {
      addTestResult(`💥 Critique erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  /**
   * Test de retry avec configuration personnalisée
   */
  const testCustomRetry = async () => {
    try {
      addTestResult('🔄 Début test retry personnalisé...');
      
      const result = await executeWithRetry(
        () => simulateFailingOperation(0.2),
        {
          config: {
            maxRetries: 5,
            baseDelayMs: 500,
            maxDelayMs: 10000,
            strategy: RetryStrategy.LINEAR,
            jitter: true,
            backoffMultiplier: 1.5,
            retryableErrors: [RetryReason.NETWORK_ERROR, RetryReason.SERVER_ERROR]
          },
          onAttempt: (attempt) => {
            addTestResult(`   Personnalisé tentative ${attempt.attemptNumber}: délai ${attempt.delayMs}ms`);
          }
        }
      );
      
      addTestResult(`🎉 Personnalisé résultat: ${result.success ? 'SUCCÈS' : 'ÉCHEC'}`);
      
    } catch (error) {
      addTestResult(`💥 Personnalisé erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  /**
   * Test de retry avec timeout
   */
  const testTimeoutRetry = async () => {
    try {
      addTestResult('🔄 Début test retry avec timeout...');
      
      const result = await executeWithRetry(
        async () => {
          // Simuler une opération qui prend du temps
          await new Promise(resolve => setTimeout(resolve, 5000));
          return 'Opération lente réussie';
        },
        {
          config: {
            maxRetries: 2,
            baseDelayMs: 1000,
            timeoutMs: 2000, // Timeout de 2 secondes
            strategy: RetryStrategy.EXPONENTIAL
          },
          onAttempt: (attempt) => {
            addTestResult(`   Timeout tentative ${attempt.attemptNumber}`);
          }
        }
      );
      
      addTestResult(`🎉 Timeout résultat: ${result.success ? 'SUCCÈS' : 'ÉCHEC'}`);
      
    } catch (error) {
      addTestResult(`💥 Timeout erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  /**
   * Nettoie l'historique
   */
  const handleClearHistory = async () => {
    try {
      await clearHistory();
      await refreshHistory();
      addTestResult('🧹 Historique nettoyé');
    } catch (error) {
      addTestResult(`❌ Erreur nettoyage: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  /**
   * Actualise les statistiques
   */
  const handleRefreshStats = () => {
    refreshStats();
    addTestResult('📊 Statistiques actualisées');
  };

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>⏳ Initialisation du service de retry...</Text>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔄 Service de Retry - Démonstration</Text>
      
      {/* État actuel */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 État Actuel</Text>
        <Text style={styles.statusText}>
          {isRetrying ? `🔄 Retry en cours (tentative ${currentAttempt})` : '✅ Aucun retry en cours'}
        </Text>
        {lastError && (
          <Text style={styles.errorText}>❌ Dernière erreur: {lastError.message}</Text>
        )}
        {lastResult && (
          <Text style={styles.resultText}>
            🎯 Dernier résultat: {lastResult.success ? 'SUCCÈS' : 'ÉCHEC'} 
            ({lastResult.attempts.length} tentatives, {lastResult.totalTimeMs}ms)
          </Text>
        )}
      </View>

      {/* Statistiques */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Statistiques</Text>
        <Text style={styles.statsText}>
          • Tentatives totales: {stats.metrics.totalAttempts}
        </Text>
        <Text style={styles.statsText}>
          • Succès: {stats.metrics.successfulAttempts}
        </Text>
        <Text style={styles.statsText}>
          • Échecs: {stats.metrics.failedAttempts}
        </Text>
        <Text style={styles.statsText}>
          • Taux de succès: {stats.metrics.successRate.toFixed(1)}%
        </Text>
        <Text style={styles.statsText}>
          • Délai moyen: {Math.round(stats.metrics.averageDelayMs)}ms
        </Text>
        <Text style={styles.statsText}>
          • Raison principale: {stats.metrics.mostCommonReason}
        </Text>
        <Text style={styles.statsText}>
          • Retry actif: {stats.isCurrentlyRetrying ? 'Oui' : 'Non'}
        </Text>
      </View>

      {/* Tests de retry */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧪 Tests de Retry</Text>
        
        <TouchableOpacity 
          style={[styles.button, isRetrying && styles.buttonDisabled]} 
          onPress={testBasicRetry}
          disabled={isRetrying}
        >
          <Text style={styles.buttonText}>🔄 Test Retry Basique</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, isRetrying && styles.buttonDisabled]} 
          onPress={testSyncRetry}
          disabled={isRetrying}
        >
          <Text style={styles.buttonText}>🔄 Test Retry Sync</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, isRetrying && styles.buttonDisabled]} 
          onPress={testNetworkRetry}
          disabled={isRetrying}
        >
          <Text style={styles.buttonText}>🌐 Test Retry Réseau</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, isRetrying && styles.buttonDisabled]} 
          onPress={testCriticalRetry}
          disabled={isRetrying}
        >
          <Text style={styles.buttonText}>⚠️ Test Retry Critique</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, isRetrying && styles.buttonDisabled]} 
          onPress={testCustomRetry}
          disabled={isRetrying}
        >
          <Text style={styles.buttonText}>⚙️ Test Retry Personnalisé</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, isRetrying && styles.buttonDisabled]} 
          onPress={testTimeoutRetry}
          disabled={isRetrying}
        >
          <Text style={styles.buttonText}>⏱️ Test Retry Timeout</Text>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Actions</Text>
        
        <TouchableOpacity style={styles.button} onPress={handleRefreshStats}>
          <Text style={styles.buttonText}>📊 Actualiser Stats</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={refreshHistory}>
          <Text style={styles.buttonText}>📜 Actualiser Historique</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleClearHistory}>
          <Text style={styles.buttonText}>🧹 Nettoyer Historique</Text>
        </TouchableOpacity>
      </View>

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

      {/* Historique des retries */}
      {history && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Historique des Retries</Text>
          <Text style={styles.statsText}>
            • Sessions totales: {history.totalSessions}
          </Text>
          <Text style={styles.statsText}>
            • Sessions réussies: {history.successfulSessions}
          </Text>
          <Text style={styles.statsText}>
            • Sessions échouées: {history.failedSessions}
          </Text>
          <Text style={styles.statsText}>
            • Retries moyens par session: {history.averageRetriesPerSession.toFixed(1)}
          </Text>
          {history.lastSessionAt && (
            <Text style={styles.statsText}>
              • Dernière session: {new Date(history.lastSessionAt).toLocaleString()}
            </Text>
          )}
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
  resultText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#34C759',
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
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
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
});

export default RetryServiceExample;


