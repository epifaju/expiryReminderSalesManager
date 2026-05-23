/**
 * Exemple d'utilisation des composants UI réseau et synchronisation
 * Démonstration de tous les composants créés
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Switch
} from 'react-native';
import {
  NetworkStatusBadge,
  NetworkIndicator,
  SyncStatusCard,
  SyncProgressBar,
  SyncNotification
} from './src/components';
import { useSyncQueue } from './src/hooks/useSyncQueue';

/**
 * Composant de démonstration des composants UI réseau
 */
const NetworkUIComponentsExample: React.FC = () => {
  const { addToQueue } = useSyncQueue();
  
  // États pour les démonstrations
  const [showBadge, setShowBadge] = useState(true);
  const [showIndicator, setShowIndicator] = useState(true);
  const [showCard, setShowCard] = useState(true);
  const [showProgress, setShowProgress] = useState(true);
  const [showNotification, setShowNotification] = useState(true);

  /**
   * Ajoute des données de test à la queue
   */
  const addTestData = async () => {
    try {
      await addToQueue(
        'product',
        'create',
        `test-product-${Date.now()}`,
        { name: 'Produit de test', price: 100 }
      );
      Alert.alert('Succès', 'Données de test ajoutées à la queue');
    } catch (error) {
      Alert.alert('Erreur', `Impossible d'ajouter les données: ${error.message}`);
    }
  };

  /**
   * Déclenche une synchronisation de test
   */
  const triggerTestSync = async () => {
    try {
      const { triggerSync } = useSyncQueue();
      await triggerSync({ forceSync: true });
      Alert.alert('Succès', 'Synchronisation de test déclenchée');
    } catch (error) {
      Alert.alert('Erreur', `Synchronisation échouée: ${error.message}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Composants UI Réseau & Synchronisation</Text>
        <Text style={styles.subtitle}>Démonstration des composants créés</Text>

        {/* Badge d'état réseau */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>1. NetworkStatusBadge</Text>
            <Switch
              value={showBadge}
              onValueChange={setShowBadge}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={showBadge ? '#2196F3' : '#f4f3f4'}
            />
          </View>
          
          {showBadge && (
            <View style={styles.componentDemo}>
              <Text style={styles.componentDescription}>
                Badge complet avec informations détaillées
              </Text>
              
              {/* Différentes tailles */}
              <View style={styles.sizeDemo}>
                <Text style={styles.demoLabel}>Tailles:</Text>
                <NetworkStatusBadge size="small" position="center" />
                <NetworkStatusBadge size="medium" position="center" />
                <NetworkStatusBadge size="large" position="center" />
              </View>

              {/* Différentes positions */}
              <View style={styles.positionDemo}>
                <Text style={styles.demoLabel}>Positions:</Text>
                <View style={styles.positionContainer}>
                  <NetworkStatusBadge size="small" position="top-left" />
                  <NetworkStatusBadge size="small" position="top-right" />
                  <NetworkStatusBadge size="small" position="bottom-left" />
                  <NetworkStatusBadge size="small" position="bottom-right" />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Indicateur simple */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>2. NetworkIndicator</Text>
            <Switch
              value={showIndicator}
              onValueChange={setShowIndicator}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={showIndicator ? '#2196F3' : '#f4f3f4'}
            />
          </View>
          
          {showIndicator && (
            <View style={styles.componentDemo}>
              <Text style={styles.componentDescription}>
                Indicateur minimaliste pour l'état de connectivité
              </Text>
              
              {/* Différentes tailles */}
              <View style={styles.indicatorDemo}>
                <Text style={styles.demoLabel}>Tailles:</Text>
                <View style={styles.indicatorRow}>
                  <NetworkIndicator size={8} />
                  <NetworkIndicator size={12} />
                  <NetworkIndicator size={16} />
                  <NetworkIndicator size={20} />
                  <NetworkIndicator size={24} />
                </View>
              </View>

              {/* Différentes positions */}
              <View style={styles.indicatorPositionDemo}>
                <Text style={styles.demoLabel}>Positions:</Text>
                <View style={styles.indicatorPositionContainer}>
                  <NetworkIndicator size={12} position="top-left" />
                  <NetworkIndicator size={12} position="top-right" />
                  <NetworkIndicator size={12} position="bottom-left" />
                  <NetworkIndicator size={12} position="bottom-right" />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Carte de statut de synchronisation */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>3. SyncStatusCard</Text>
            <Switch
              value={showCard}
              onValueChange={setShowCard}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={showCard ? '#2196F3' : '#f4f3f4'}
            />
          </View>
          
          {showCard && (
            <View style={styles.componentDemo}>
              <Text style={styles.componentDescription}>
                Carte détaillée avec statistiques et contrôles
              </Text>
              
              <SyncStatusCard 
                showActions={true}
                compact={false}
                onSyncTriggered={() => console.log('Sync triggered')}
              />
            </View>
          )}
        </View>

        {/* Barre de progression */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>4. SyncProgressBar</Text>
            <Switch
              value={showProgress}
              onValueChange={setShowProgress}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={showProgress ? '#2196F3' : '#f4f3f4'}
            />
          </View>
          
          {showProgress && (
            <View style={styles.componentDemo}>
              <Text style={styles.componentDescription}>
                Barre de progression pour les opérations de synchronisation
              </Text>
              
              <View style={styles.progressDemo}>
                <Text style={styles.demoLabel}>Hauteurs:</Text>
                <SyncProgressBar height={2} showText={false} />
                <SyncProgressBar height={4} showText={true} />
                <SyncProgressBar height={8} showText={true} />
              </View>
            </View>
          )}
        </View>

        {/* Notifications toast */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>5. SyncNotification</Text>
            <Switch
              value={showNotification}
              onValueChange={setShowNotification}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={showNotification ? '#2196F3' : '#f4f3f4'}
            />
          </View>
          
          {showNotification && (
            <View style={styles.componentDemo}>
              <Text style={styles.componentDescription}>
                Notifications toast pour les événements de synchronisation
              </Text>
              
              <Text style={styles.demoNote}>
                Les notifications apparaissent automatiquement lors des changements d'état
              </Text>
            </View>
          )}
        </View>

        {/* Actions de test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions de Test</Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={addTestData}>
              <Text style={styles.actionButtonText}>📝 Ajouter données de test</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={triggerTestSync}>
              <Text style={styles.actionButtonText}>🔄 Déclencher synchronisation</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              • Utilisez les switches pour afficher/masquer les composants{'\n'}
              • Ajoutez des données de test pour voir les changements{'\n'}
              • Déclenchez une synchronisation pour tester les animations{'\n'}
              • Coupez/réactivez le WiFi pour tester les notifications{'\n'}
              • Observez les changements d'état en temps réel
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Composants flottants */}
      {showBadge && (
        <NetworkStatusBadge 
          size="medium" 
          position="top-right"
          showPendingCount={true}
          showPulseAnimation={true}
        />
      )}
      
      {showIndicator && (
        <NetworkIndicator 
          size={12} 
          position="top-left"
          showPulse={true}
        />
      )}
      
      {showNotification && (
        <SyncNotification 
          position="top"
          duration={4000}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  scrollView: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 100,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },

  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },

  section: {
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

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  componentDemo: {
    marginTop: 12,
  },

  componentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },

  demoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },

  sizeDemo: {
    marginBottom: 16,
  },

  positionDemo: {
    marginBottom: 16,
  },

  positionContainer: {
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    position: 'relative',
  },

  indicatorDemo: {
    marginBottom: 16,
  },

  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  indicatorPositionDemo: {
    marginBottom: 16,
  },

  indicatorPositionContainer: {
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    position: 'relative',
  },

  progressDemo: {
    marginBottom: 16,
  },

  demoNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
  },

  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  actionButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  instructions: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },

  instructionText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
});

export default NetworkUIComponentsExample;


