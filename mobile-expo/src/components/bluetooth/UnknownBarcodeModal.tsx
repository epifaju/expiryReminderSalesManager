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
import { PRODUCT_TEXT_LIMITS } from '../../database/productSql';

export interface QuickProductFormData {
  barcode: string;
  name: string;
  description?: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  expiryDate?: string;
  category?: string;
}

interface UnknownBarcodeModalProps {
  visible: boolean;
  barcode: string;
  prefill?: Partial<Omit<QuickProductFormData, 'barcode'>>;
  onCreateProduct: (data: QuickProductFormData) => Promise<void>;
  onDismiss: () => void;
}

const UnknownBarcodeModal: React.FC<UnknownBarcodeModalProps> = ({
  visible,
  barcode,
  prefill,
  onCreateProduct,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('1');
  const [category, setCategory] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState('');
  const [barcodeEditable, setBarcodeEditable] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(prefill?.name ?? '');
      setDescription(prefill?.description ?? '');
      setPurchasePrice(
        prefill?.purchasePrice !== undefined && prefill?.purchasePrice !== null
          ? String(prefill.purchasePrice)
          : ''
      );
      setSellingPrice(
        prefill?.sellingPrice !== undefined && prefill?.sellingPrice !== null
          ? String(prefill.sellingPrice)
          : ''
      );
      setStockQuantity(
        prefill?.stockQuantity !== undefined && prefill?.stockQuantity !== null
          ? String(prefill.stockQuantity)
          : '1'
      );
      setCategory(prefill?.category ?? '');
      setExpiryDate(prefill?.expiryDate ?? '');
      setSubmitting(false);
      setBarcodeValue(barcode);
      setBarcodeEditable(false);
      setSubmitError(null);
    }
  }, [visible, barcode, prefill]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      return;
    }
    const normalizedBarcode = barcodeValue.trim();
    if (!normalizedBarcode) {
      return;
    }
    const salePrice = parseFloat(sellingPrice);
    const buyPriceRaw = purchasePrice.trim() ? parseFloat(purchasePrice) : salePrice;
    const stock = parseInt(stockQuantity, 10);
    if (
      !salePrice ||
      salePrice <= 0 ||
      Number.isNaN(buyPriceRaw) ||
      buyPriceRaw < 0 ||
      Number.isNaN(stock) ||
      stock < 0
    ) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onCreateProduct({
        barcode: normalizedBarcode,
        name: name.trim(),
        description: description.trim() || undefined,
        purchasePrice: buyPriceRaw,
        sellingPrice: salePrice,
        stockQuantity: stock,
        expiryDate: expiryDate || undefined,
        category: category.trim() || undefined,
      });
    } catch (e: any) {
      const message = String(e?.message || '');
      // Cas fréquent: 409 quand un produit avec ce code-barres existe déjà côté API.
      if (message.includes('Erreur 409') || message.toLowerCase().includes('code-barres existe déjà')) {
        setBarcodeEditable(true);
        setSubmitError(
          message.replace(/^Erreur\s*409:\s*/i, '') ||
            t('bluetooth.barcode_already_exists')
        );
      } else {
        setSubmitError(message || t('errors.unknownError'));
      }
      // Important: ne pas propager l'erreur, on reste dans le modal
      // pour permettre à l'utilisateur de corriger (ex: nouveau code-barres).
      return;
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
            <TextInput
              style={[styles.input, !barcodeEditable && styles.readonly]}
              value={barcodeValue}
              editable={barcodeEditable}
              onChangeText={setBarcodeValue}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t('products.barcode')}
            />
            {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
            {!barcodeEditable ? (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => setBarcodeEditable(true)}
                disabled={submitting}
              >
                <Text style={styles.linkButtonText}>{t('bluetooth.use_different_barcode')}</Text>
              </TouchableOpacity>
            ) : null}

            <Text style={styles.label}>{t('products.productName')} *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('products.productName')}
            />

            <Text style={styles.label}>{t('products.description')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder={t('products.description')}
              multiline
              numberOfLines={3}
              maxLength={PRODUCT_TEXT_LIMITS.description}
            />

            <Text style={styles.label}>{t('products.purchasePrice')} *</Text>
            <TextInput
              style={styles.input}
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              keyboardType="numeric"
              placeholder="0"
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
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  readonly: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  errorText: {
    color: '#dc3545',
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  linkButtonText: {
    color: '#007bff',
    fontWeight: '700',
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
