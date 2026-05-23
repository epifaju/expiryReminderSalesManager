import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import DatePicker from '../DatePicker';

export interface QuickProductFormData {
  barcode: string;
  name: string;
  sellingPrice: number;
  stockQuantity: number;
  expiryDate?: string;
  category?: string;
}

interface UnknownBarcodeModalProps {
  visible: boolean;
  barcode: string;
  onCreateProduct: (data: QuickProductFormData) => Promise<void>;
  onDismiss: () => void;
}

const UnknownBarcodeModal: React.FC<UnknownBarcodeModalProps> = ({
  visible,
  barcode,
  onCreateProduct,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('1');
  const [category, setCategory] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setName('');
      setSellingPrice('');
      setStockQuantity('1');
      setCategory('');
      setExpiryDate('');
      setSubmitting(false);
    }
  }, [visible, barcode]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      return;
    }
    const price = parseFloat(sellingPrice);
    const stock = parseInt(stockQuantity, 10);
    if (!price || price <= 0 || Number.isNaN(stock) || stock < 0) {
      return;
    }

    setSubmitting(true);
    try {
      await onCreateProduct({
        barcode,
        name: name.trim(),
        sellingPrice: price,
        stockQuantity: stock,
        expiryDate: expiryDate || undefined,
        category: category.trim() || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onDismiss}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{t('bluetooth.product_not_found')}</Text>
          <Text style={styles.prompt}>{t('bluetooth.create_product_prompt')}</Text>

          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>{t('products.barcode')}</Text>
            <TextInput style={[styles.input, styles.readonly]} value={barcode} editable={false} />

            <Text style={styles.label}>{t('products.productName')} *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('products.productName')}
            />

            <Text style={styles.label}>{t('products.sellingPrice')} *</Text>
            <TextInput
              style={styles.input}
              value={sellingPrice}
              onChangeText={setSellingPrice}
              keyboardType="numeric"
              placeholder="0"
            />

            <Text style={styles.label}>{t('products.stockQuantity')} *</Text>
            <TextInput
              style={styles.input}
              value={stockQuantity}
              onChangeText={setStockQuantity}
              keyboardType="numeric"
            />

            <Text style={styles.label}>{t('products.category')}</Text>
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholder={t('products.category')}
            />

            <DatePicker
              label={t('products.expiryDate')}
              value={expiryDate}
              onDateChange={setExpiryDate}
              placeholder={t('products.selectExpiryDate')}
            />
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onDismiss} disabled={submitting}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>{t('bluetooth.create_product')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '90%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  prompt: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  readonly: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#28a745',
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default UnknownBarcodeModal;
