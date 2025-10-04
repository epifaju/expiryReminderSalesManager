import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Receipt, receiptService } from '../services/receiptService';
import { ReceiptCard } from '../components/ReceiptCard';
import { fileDownloadService } from '../services/fileDownloadService';

export const ReceiptsScreen: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState<number | null>(null);

  const loadReceipts = useCallback(async () => {
    try {
      console.log('🔍 Chargement des reçus...');
      const userReceipts = await receiptService.getUserReceipts();
      console.log('✅ Reçus chargés:', userReceipts.length);
      setReceipts(userReceipts);
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des reçus:', error);
      
      // Message d'erreur plus spécifique
      let errorMessage = 'Impossible de charger les reçus';
      let errorTitle = 'Erreur';
      
      if (error.message.includes('Network Error')) {
        errorMessage = 'Erreur de connexion au serveur. Vérifiez que le backend est démarré et accessible.';
        errorTitle = 'Problème de connexion';
      } else if (error.message.includes('403') || error.message.includes('Unauthorized')) {
        errorMessage = 'Veillez-vous reconnecter pour accéder aux reçus.';
        errorTitle = 'Authentification requise';
      } else if (error.message.includes('404')) {
        errorMessage = 'Service de reçus non disponible.';
        errorTitle = 'Service indisponible';
      }
      
      Alert.alert(
        errorTitle,
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReceipts();
    setRefreshing(false);
  }, [loadReceipts]);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  const handleDownloadStart = (receiptId: number) => {
    setDownloadingReceipt(receiptId);
  };

  const handleDownloadSuccess = (filePath: string) => {
    setDownloadingReceipt(null);
    console.log('PDF téléchargé avec succès:', filePath);
  };

  const handleDownloadError = (error: string) => {
    setDownloadingReceipt(null);
    console.error('Erreur de téléchargement:', error);
  };

  const handleReceiptPress = (receipt: Receipt) => {
    Alert.alert(
      'Détails du reçu',
      `Numéro: ${receipt.receiptNumber}\n` +
      `Montant: ${receiptService.formatCurrency(receipt.finalAmount)}\n` +
      `Date: ${receiptService.formatDate(receipt.createdAt)}\n` +
      `Statut: ${receiptService.getStatusText(receipt.status)}\n` +
      `Téléchargements: ${receipt.downloadCount}`,
      [
        { text: 'Fermer', style: 'cancel' },
        {
          text: 'Télécharger PDF',
          onPress: () => {
            // Simuler un clic sur le bouton de téléchargement
            handleDownloadStart(receipt.id);
          },
        },
      ]
    );
  };

  const createTestReceipt = async () => {
    Alert.alert(
      'Comment créer un reçu',
      'Pour générer un reçu:\n\n1. Allez dans l\'écran "Ventes"\n2. Trouvez une vente existante\n3. Cliquez sur "🧾 Générer Reçu v2.0"\n4. Suivez les confirmations\n\nLes reçus créés apparaîtront automatiquement dans cette liste.',
      [
        { text: 'Compris', style: 'default' },
        { 
          text: 'Actualiser la liste',
          onPress: () => loadReceipts()
        }
      ]
    );
  };

  const renderReceipt = ({ item }: { item: Receipt }) => (
    <ReceiptCard
      receipt={item}
      onPress={() => handleReceiptPress(item)}
      onDownloadStart={() => handleDownloadStart(item.id)}
      onDownloadSuccess={handleDownloadSuccess}
      onDownloadError={handleDownloadError}
      showDownloadButton={true}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>Aucun reçu trouvé</Text>
      <Text style={styles.emptyStateSubtitle}>
        Vos reçus générés apparaîtront ici
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={createTestReceipt}
      >
        <Text style={styles.createButtonText}>
          📖 Comment créer un reçu ?
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.createButton, styles.refreshButton]}
        onPress={loadReceipts}
      >
        <Text style={styles.createButtonText}>
          🔄 Actualiser la liste
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Mes Reçus</Text>
      <Text style={styles.subtitle}>
        {receipts.length} reçu{receipts.length > 1 ? 's' : ''}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des reçus...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={receipts}
        renderItem={renderReceipt}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        contentContainerStyle={receipts.length === 0 ? styles.emptyContainer : styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  
  listContainer: {
    paddingBottom: 20,
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  
  refreshButton: {
    backgroundColor: '#28A745',
  },
  
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReceiptsScreen;
