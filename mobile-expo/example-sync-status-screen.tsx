/**
 * Exemple d'utilisation de l'écran de synchronisation
 * Démonstration complète des fonctionnalités
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import { SyncStatusScreen } from './src/screens';
import {
  SyncMetricsChart,
  SyncConflictResolver
} from './src/components';
import { useSyncQueue } from './src/hooks/useSyncQueue';

/**
 * Composant de démonstration de l'écran de synchronisation
 */
const SyncStatusScreenExample: React.FC = () => {
  const { addToQueue } = useSyncQueue();
  const [showMetrics, setShowMetrics] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);

  /**
   * Ajoute des données de test pour la démonstration
   */
  const addTestData = async () => {
    try {
      // Ajouter des produits
      await addToQueue(
        'product',
        'create',
        `test-product-${Date.now()}`,
        { 
          name: 'Produit de test', 
          price: Math.floor(Math.random() * 1000) + 100,
          category: 'Test'
        }
      );

      // Ajouter des ventes
      await addToQueue(
        'sale',
        'create',
        `test-sale-${Date.now()}`,
        { 
          amount: Math.floor(Math.random() * 500) + 50,
          quantity: Math.floor(Math.random() * 5) + 1,
          customerName: 'Client Test'
        }
      );

      // Ajouter des mouvements de stock
      await addToQueue(
        'stock_movement',
        'create',
        `test-movement-${Date.now()}`,
        { 
          productId: 'prod-123',
          quantity: Math.floor(Math.random() * 20) - 10, // Positif ou négatif
          type: 'adjustment',
          reason: 'Test de synchronisation'
        }
      );

      Alert.alert('Succès', 'Données de test ajoutées à la queue de synchronisation');
    } catch (error) {
      Alert.alert('Erreur', `Impossible d'ajouter les données: ${error.message}`);
    }
  };

  /**
   * Simule des conflits pour la démonstration
   */
  const simulateConflicts = () => {
    Alert.alert(
      'Conflits simulés',
      'Des conflits de synchronisation ont été ajoutés pour la démonstration',
      [{ text: 'OK' }]
    );
    setShowConflicts(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.title}>Démonstration - Écran de Synchronisation</Text>
          <Text style={styles.subtitle}>
            Interface complète de monitoring et gestion de la synchronisation
          </Text>
        </View>

        {/* Actions de test */}
        <View style={styles.testSection}>
          <Text style={styles.sectionTitle}>Actions de Test</Text>
          
          <View style={styles.testButtons}>
            <TouchableOpacity style={styles.testButton} onPress={addTestData}>
              <Text style={styles.testButtonText}>📝 Ajouter données de test</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.testButton} onPress={simulateConflicts}>
              <Text style={styles.testButtonText}>⚠️ Simuler des conflits</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={() => setShowMetrics(!showMetrics)}
            >
              <Text style={styles.testButtonText}>
                {showMetrics ? '📊 Masquer métriques' : '📊 Afficher métriques'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Métriques */}
        {showMetrics && (
          <View style={styles.componentSection}>
            <Text style={styles.sectionTitle}>Graphiques et Métriques</Text>
            <SyncMetricsChart 
              period="day"
              showCharts={true}
              showStats={true}
            />
          </View>
        )}

        {/* Résolveur de conflits */}
        {showConflicts && (
          <View style={styles.componentSection}>
            <Text style={styles.sectionTitle}>Résolveur de Conflits</Text>
            <SyncConflictResolver 
              onConflictResolved={(conflictId, resolution) => {
                Alert.alert(
                  'Conflit résolu',
                  `Conflit ${conflictId} résolu avec la stratégie: ${resolution}`,
                  [{ text: 'OK' }]
                );
              }}
              onClose={() => setShowConflicts(false)}
            />
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.sectionTitle}>Instructions d'utilisation</Text>
          
          <View style={styles.instructions}>
            <Text style={styles.instructionTitle}>🎯 Fonctionnalités principales :</Text>
            <Text style={styles.instructionText}>
              • Écran de synchronisation complet avec monitoring en temps réel{'\n'}
              • Badges d'état réseau et indicateurs de synchronisation{'\n'}
              • Cartes de statut avec statistiques détaillées{'\n'}
              • Barres de progression animées{'\n'}
              • Notifications toast automatiques{'\n'}
              • Historique des événements de synchronisation{'\n'}
              • Graphiques et métriques de performance{'\n'}
              • Résolveur de conflits interactif{'\n'}
              • Paramètres de synchronisation configurables
            </Text>

            <Text style={styles.instructionTitle}>🔧 Actions disponibles :</Text>
            <Text style={styles.instructionText}>
              • Synchronisation manuelle et automatique{'\n'}
              • Actualisation des statistiques{'\n'}
              • Nettoyage de la queue de synchronisation{'\n'}
              • Résolution des conflits de données{'\n'}
              • Configuration des paramètres de sync{'\n'}
              • Monitoring de l'état réseau{'\n'}
              • Historique des opérations
            </Text>

            <Text style={styles.instructionTitle}>📱 États gérés :</Text>
            <Text style={styles.instructionText}>
              • En ligne synchronisé (vert){'\n'}
              • Synchronisation en cours (orange avec animation){'\n'}
              • Éléments en attente (rouge-orange avec compteur){'\n'}
              • Hors ligne avec attente (rouge){'\n'}
              • Réseau local (orange){'\n'}
              • Hors ligne (gris){'\n'}
              • Erreurs de synchronisation (rouge)
            </Text>

            <Text style={styles.instructionTitle}>🎨 Design et UX :</Text>
            <Text style={styles.instructionText}>
              • Interface responsive et adaptative{'\n'}
              • Animations fluides et transitions{'\n'}
              • Système de couleurs cohérent{'\n'}
              • Feedback visuel en temps réel{'\n'}
              • Notifications non-intrusives{'\n'}
              • Accessibilité et navigation intuitive{'\n'}
              • Mode sombre compatible
            </Text>
          </View>
        </View>

        {/* Informations techniques */}
        <View style={styles.techSection}>
          <Text style={styles.sectionTitle}>Informations Techniques</Text>
          
          <View style={styles.techInfo}>
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>Composants créés:</Text>
              <Text style={styles.techValue}>7 composants UI</Text>
            </View>
            
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>Écrans implémentés:</Text>
              <Text style={styles.techValue}>1 écran principal</Text>
            </View>
            
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>Hooks personnalisés:</Text>
              <Text style={styles.techValue}>2 hooks React</Text>
            </View>
            
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>Services intégrés:</Text>
              <Text style={styles.techValue}>NetworkService + SyncQueueService</Text>
            </View>
            
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>Types TypeScript:</Text>
              <Text style={styles.techValue}>Interfaces complètes</Text>
            </View>
            
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>Tests unitaires:</Text>
              <Text style={styles.techValue}>Tests complets</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  content: {
    flex: 1,
    padding: 16,
  },

  header: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },

  testSection: {
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

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },

  testButtons: {
    gap: 8,
  },

  testButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  componentSection: {
    marginBottom: 16,
  },

  instructionsSection: {
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

  instructions: {
    gap: 16,
  },

  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },

  instructionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },

  techSection: {
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

  techInfo: {
    gap: 8,
  },

  techItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },

  techLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },

  techValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default SyncStatusScreenExample;

