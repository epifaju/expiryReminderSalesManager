import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Receipt } from '../services/receiptService';
import { ReceiptPdfButton } from './ReceiptPdfButton';

interface ReceiptCardProps {
  receipt: Receipt;
  onPress?: () => void;
  onDownloadStart?: () => void;
  onDownloadSuccess?: (filePath: string) => void;
  onDownloadError?: (error: string) => void;
  showDownloadButton?: boolean;
  style?: any;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({
  receipt,
  onPress,
  onDownloadStart,
  onDownloadSuccess,
  onDownloadError,
  showDownloadButton = true,
  style,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GENERATED':
        return '#34C759';
      case 'SENT':
        return '#007AFF';
      case 'DELIVERED':
        return '#32D74B';
      case 'FAILED':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'GENERATED':
        return 'Généré';
      case 'SENT':
        return 'Envoyé';
      case 'DELIVERED':
        return 'Livré';
      case 'FAILED':
        return 'Échec';
      default:
        return status;
    }
  };

  const getPaymentMethodText = (paymentMethod: string) => {
    switch (paymentMethod) {
      case 'CASH':
        return 'Espèces';
      case 'CARD':
        return 'Carte bancaire';
      case 'MOBILE_MONEY':
        return 'Mobile Money';
      case 'BANK_TRANSFER':
        return 'Virement bancaire';
      case 'CREDIT':
        return 'Crédit';
      default:
        return paymentMethod;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.receiptNumber}>
            {receipt.receiptNumber}
          </Text>
          <Text style={styles.date}>
            {formatDate(receipt.createdAt)}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(receipt.status) }]}>
            <Text style={styles.statusText}>
              {getStatusText(receipt.status)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.amountSection}>
          <Text style={styles.amount}>
            {formatCurrency(receipt.finalAmount)}
          </Text>
          <Text style={styles.paymentMethod}>
            {getPaymentMethodText(receipt.paymentMethod)}
          </Text>
        </View>

        {receipt.customerName && (
          <View style={styles.customerSection}>
            <Text style={styles.customerLabel}>Client:</Text>
            <Text style={styles.customerName}>{receipt.customerName}</Text>
          </View>
        )}

        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vente:</Text>
            <Text style={styles.detailValue}>{receipt.sale.saleNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Articles:</Text>
            <Text style={styles.detailValue}>{receipt.sale.saleItems.length}</Text>
          </View>
          {receipt.downloadCount > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Téléchargements:</Text>
              <Text style={styles.detailValue}>{receipt.downloadCount}</Text>
            </View>
          )}
        </View>

        {receipt.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notes} numberOfLines={2}>
              {receipt.notes}
            </Text>
          </View>
        )}
      </View>

      {showDownloadButton && (
        <View style={styles.footer}>
          <ReceiptPdfButton
            receipt={receipt}
            variant="primary"
            size="small"
            onDownloadStart={onDownloadStart}
            onDownloadSuccess={onDownloadSuccess}
            onDownloadError={onDownloadError}
            style={styles.downloadButton}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  
  headerLeft: {
    flex: 1,
  },
  
  headerRight: {
    alignItems: 'flex-end',
  },
  
  receiptNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  
  date: {
    fontSize: 12,
    color: '#8E8E93',
  },
  
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  content: {
    marginBottom: 16,
  },
  
  amountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  
  paymentMethod: {
    fontSize: 12,
    color: '#8E8E93',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  
  customerSection: {
    marginBottom: 12,
  },
  
  customerLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  
  customerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  
  detailsSection: {
    marginBottom: 12,
  },
  
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  
  detailLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  
  notesSection: {
    marginBottom: 8,
  },
  
  notesLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  
  notes: {
    fontSize: 12,
    color: '#1D1D1F',
    fontStyle: 'italic',
  },
  
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 12,
  },
  
  downloadButton: {
    alignSelf: 'flex-start',
  },
});

export default ReceiptCard;
