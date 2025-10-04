import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import receiptService from '../services/receiptService.web';
import fileDownloadService from '../services/fileDownloadService.web';

interface Receipt {
  id: number;
  receiptNumber: string;
  saleId: number;
  totalAmount: number;
  finalAmount: number;
  paymentMethod: string;
  customerName?: string;
  createdAt: string;
  status: string;
  downloadCount?: number;
}

interface ReceiptsScreenProps {
  token: string;
}

const ReceiptsScreen: React.FC<ReceiptsScreenProps> = ({ token }) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      setIsLoading(true);
      const response = await receiptService.getReceipts();
      setReceipts(response.receipts || []);
    } catch (error: any) {
      console.error('Erreur chargement reçus:', error);
      Alert.alert('Erreur', error.message || 'Impossible de charger les reçus');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReceipts();
    setIsRefreshing(false);
  };

  const handleDownloadPdf = async (receiptId: number) => {
    try {
      const pdfData = await receiptService.downloadReceiptPdf(receiptId);
      const fileName = `receipt-${receiptId}-${Date.now()}.pdf`;
      await fileDownloadService.downloadAndSavePdf(pdfData, fileName);
    } catch (error: any) {
      console.error('Erreur téléchargement PDF:', error);
      Alert.alert('Erreur', error.message || 'Impossible de télécharger le PDF');
    }
  };

  const formatCurrency = (amount: number): string => {
    return `${Number(amount).toFixed(2)} €`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const ReceiptCard: React.FC<{ receipt: Receipt }> = ({ receipt }) => (
    <View style={styles.receiptCard}>
      <View style={styles.receiptHeader}>
        <Text style={styles.receiptNumber}>{receipt.receiptNumber}</Text>
        <Text style={styles.receiptAmount}>{formatCurrency(receipt.finalAmount)}</Text>
      </View>
      
      <View style={styles.receiptDetails}>
        <Text style={styles.receiptDate}>{formatDate(receipt.createdAt)}</Text>
        <Text style={styles.receiptCustomer}>{receipt.customerName || 'Client'}</Text>
      </View>
      
      <View style={styles.receiptFooter}>
        <Text style={styles.paymentMethod}>{receipt.paymentMethod}</Text>
        <Text style={[styles.status, { color: receipt.status === 'GENERATED' ? '#28a745' : '#ffc107' }]}>
          {receipt.status === 'GENERATED' ? 'Généré' : receipt.status}
        </Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => handleDownloadPdf(receipt.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.downloadIcon}>📥</Text>
          <Text style={styles.downloadText}>Télécharger PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Chargement des reçus...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reçus</Text>
        <Text style={styles.headerSubtitle}>
          Gérez vos reçus de vente
        </Text>
      </View>

      <ScrollView
        style={styles.receiptsList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <Text style={styles.receiptsCount}>
          {receipts.length} reçu(s) trouvé(s)
        </Text>

        {receipts.length > 0 ? (
          receipts.map((receipt) => (
            <ReceiptCard key={receipt.id} receipt={receipt} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Aucun reçu trouvé</Text>
            <Text style={styles.emptyStateSubtext}>
              Créez des reçus depuis vos ventes pour les voir apparaître ici
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#007bff',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  receiptsList: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  receiptsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  receiptCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  receiptAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  receiptDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  receiptDate: {
    fontSize: 14,
    color: '#666',
  },
  receiptCustomer: {
    fontSize: 14,
    color: '#666',
  },
  receiptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentMethod: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  downloadIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  downloadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default ReceiptsScreen;
