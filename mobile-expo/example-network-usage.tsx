/**
 * Exemple d'utilisation du NetworkService
 * Démonstration des fonctionnalités de détection réseau
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNetworkStatus } from './src/hooks/useNetworkStatus';

/**
 * Composant exemple utilisant le NetworkService
 */
const NetworkStatusExample: React.FC = () => {
  const {
    isOnline,
    isConnected,
    isInternetReachable,
    networkType,
    networkDetails,
    disconnectionDuration,
    refreshNetwork,
    serviceStatus
  } = useNetworkStatus();

  const [lastRefresh, setLastRefresh] = useState<string>('');

  /**
   * Gère le rafraîchissement manuel du statut réseau
   */
  const handleRefresh = async () => {
    try {
      await refreshNetwork();
      setLastRefresh(new Date().toLocaleTimeString());
      Alert.alert('Succès', 'Statut réseau mis à jour');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut réseau');
    }
  };

  /**
   * Détermine la couleur du badge selon l'état
   */
  const getStatusColor = () => {
    if (isOnline) return '#4CAF50'; // Vert
    if (isConnected) return '#FF9800'; // Orange
    return '#F44336'; // Rouge
  };

  /**
   * Détermine le texte du statut
   */
  const getStatusText = () => {
    if (isOnline) return 'En ligne';
    if (isConnected) return 'Réseau local';
    return 'Hors ligne';
  };

  /**
   * Détermine l'icône du statut
   */
  const getStatusIcon = () => {
    if (isOnline) return '🟢';
    if (isConnected) return '🟡';
    return '🔴';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NetworkService - Exemple d'utilisation</Text>
      
      {/* Badge de statut principal */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
        <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>

      {/* Informations détaillées */}
      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>Informations détaillées</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Connecté au réseau:</Text>
          <Text style={styles.value}>{isConnected ? 'Oui' : 'Non'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Internet accessible:</Text>
          <Text style={styles.value}>{isInternetReachable ? 'Oui' : 'Non'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Type de connexion:</Text>
          <Text style={styles.value}>{networkType || 'Inconnu'}</Text>
        </View>
        
        {networkDetails && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Détails:</Text>
            <Text style={styles.value}>{JSON.stringify(networkDetails, null, 2)}</Text>
          </View>
        )}
        
        {disconnectionDuration && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Durée déconnexion:</Text>
            <Text style={styles.value}>{disconnectionDuration}</Text>
          </View>
        )}
      </View>

      {/* Statistiques du service */}
      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>Statut du service</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Service initialisé:</Text>
          <Text style={styles.value}>{serviceStatus.initialized ? 'Oui' : 'Non'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Listeners actifs:</Text>
          <Text style={styles.value}>{serviceStatus.listenersCount}</Text>
        </View>
        
        {serviceStatus.lastConnection && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Dernière connexion:</Text>
            <Text style={styles.value}>
              {new Date(serviceStatus.lastConnection).toLocaleString()}
            </Text>
          </View>
        )}
        
        {lastRefresh && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Dernier refresh:</Text>
            <Text style={styles.value}>{lastRefresh}</Text>
          </View>
        )}
      </View>

      {/* Bouton de rafraîchissement */}
      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Text style={styles.refreshButtonText}>🔄 Rafraîchir le statut</Text>
      </TouchableOpacity>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Instructions de test</Text>
        <Text style={styles.instructionsText}>
          1. Coupez le WiFi pour tester la déconnexion{'\n'}
          2. Réactivez le WiFi pour tester la reconnexion{'\n'}
          3. Utilisez le bouton refresh pour forcer une vérification{'\n'}
          4. Observez les changements en temps réel
        </Text>
      </View>
    </View>
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
    marginBottom: 20,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1976D2',
  },
  instructionsText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
});

export default NetworkStatusExample;

