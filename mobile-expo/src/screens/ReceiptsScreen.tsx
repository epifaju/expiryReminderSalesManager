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
import { useTranslation } from 'react-i18next';
import { Receipt, receiptService } from '../services/receiptService';
import { ReceiptCard } from '../components/ReceiptCard';
import { fileDownloadService } from '../services/fileDownloadService';

export const ReceiptsScreen: React.FC = () => {
  const { t } = useTranslation();
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
      let errorMessage = t('receipts.loadError');
      let errorTitle = t('errors.title');
      
      if (error.message.includes('Network Error')) {
        errorMessage = t('receipts.connectionError');
        errorTitle = t('receipts.connectionProblem');
      } else if (error.message.includes('403') || error.message.includes('Unauthorized')) {
        errorMessage = t('receipts.authRequired');
        errorTitle = t('receipts.authRequiredTitle');
      } else if (error.message.includes('404')) {
        errorMessage = t('receipts.serviceUnavailable');
        errorTitle = t('receipts.serviceUnavailableTitle');
      }
      
      Alert.alert(
        errorTitle,
        errorMessage,
        [{ text: t('common.ok') }]
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
      t('receipts.details'),
      `${t('receipts.number')}: ${receipt.receiptNumber}\n` +
      `${t('receipts.amount')}: ${receiptService.formatCurrency(receipt.finalAmount)}\n` +
      `${t('receipts.date')}: ${receiptService.formatDate(receipt.createdAt)}\n` +
      `${t('receipts.status')}: ${receiptService.getStatusText(receipt.status)}\n` +
      `${t('receipts.downloads')}: ${receipt.downloadCount}`,
      [
        { text: t('common.close'), style: 'cancel' },
        {
          text: t('receipts.downloadPdf'),
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
      t('receipts.howToCreate'),
      t('receipts.createInstructions'),
      [
        { text: t('receipts.understood'), style: 'default' },
        { 
          text: t('receipts.refreshList'),
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
      <Text style={styles.emptyStateTitle}>{t('receipts.noReceiptsFound')}</Text>
      <Text style={styles.emptyStateSubtitle}>
        {t('receipts.receiptsWillAppearHere')}
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={createTestReceipt}
      >
        <Text style={styles.createButtonText}>
          📖 {t('receipts.howToCreateReceipt')}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.createButton, styles.refreshButton]}
        onPress={loadReceipts}
      >
        <Text style={styles.createButtonText}>
          🔄 {t('receipts.refreshList')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>{t('receipts.title')}</Text>
      <Text style={styles.subtitle}>
        {receipts.length} {receipts.length > 1 ? t('receipts.receipts') : t('receipts.receipt')}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t('receipts.loadingReceipts')}</Text>
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
