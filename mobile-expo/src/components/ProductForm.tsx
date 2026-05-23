import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import DatePicker from './DatePicker';
import BarcodeScanner from './BarcodeScanner';
import { ProductFormValues } from '../utils/productFormUtils';

interface ProductFormProps {
  values: ProductFormValues;
  onChange: (values: ProductFormValues) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  mode: 'create' | 'edit';
  isSubmitting?: boolean;
  onBarcodeScanned?: (barcode: string) => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  values,
  onChange,
  onSubmit,
  onCancel,
  mode,
  isSubmitting = false,
  onBarcodeScanned,
}) => {
  const { t } = useTranslation();
  const [showScanner, setShowScanner] = useState(false);

  const setField = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => {
    onChange({ ...values, [key]: value });
  };

  const handleBarcodeScan = (scannedBarcode: string) => {
    setField('barcode', scannedBarcode);
    setShowScanner(false);
    if (onBarcodeScanned) {
      onBarcodeScanned(scannedBarcode);
    }
  };

  const submitLabel =
    mode === 'create' ? t('products.addProduct') : t('products.saveChanges');

  return (
    <>
      <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.input}
          placeholder={`${t('products.productName')} *`}
          value={values.name}
          onChangeText={(text) => setField('name', text)}
        />

        <TextInput
          style={styles.input}
          placeholder={t('products.description')}
          value={values.description}
          onChangeText={(text) => setField('description', text)}
          multiline
        />

        <View style={styles.barcodeContainer}>
          <TextInput
            style={[styles.input, styles.barcodeInput]}
            placeholder={t('products.barcode')}
            value={values.barcode}
            onChangeText={(text) => setField('barcode', text)}
          />
          <TouchableOpacity style={styles.scanButton} onPress={() => setShowScanner(true)}>
            <Text style={styles.scanButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder={`${t('products.purchasePrice')} *`}
          value={values.purchasePrice}
          onChangeText={(text) => setField('purchasePrice', text)}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder={`${t('products.sellingPrice')} *`}
          value={values.sellingPrice}
          onChangeText={(text) => setField('sellingPrice', text)}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder={t('products.stockQuantity')}
          value={values.stockQuantity}
          onChangeText={(text) => setField('stockQuantity', text)}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder={t('products.minStockLevel')}
          value={values.minStockLevel}
          onChangeText={(text) => setField('minStockLevel', text)}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder={t('products.category')}
          value={values.category}
          onChangeText={(text) => setField('category', text)}
        />

        <TextInput
          style={styles.input}
          placeholder={`${t('products.unit')} (pcs, kg, l...)`}
          value={values.unit}
          onChangeText={(text) => setField('unit', text)}
        />

        {mode === 'edit' && (
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('products.isActive')}</Text>
            <Switch
              value={values.isActive}
              onValueChange={(active) => setField('isActive', active)}
            />
          </View>
        )}

        <Text style={styles.sectionTitle}>📅 {t('products.datesOptional')}</Text>

        <DatePicker
          label={t('products.manufacturingDate')}
          value={values.manufacturingDate}
          onDateChange={(date) => setField('manufacturingDate', date)}
          placeholder={t('products.selectManufacturingDate')}
          maximumDate={new Date().toISOString().split('T')[0]}
        />

        <DatePicker
          label={t('products.expiryDate')}
          value={values.expiryDate}
          onDateChange={(date) => setField('expiryDate', date)}
          placeholder={t('products.selectExpiryDate')}
          minimumDate={values.manufacturingDate || new Date().toISOString().split('T')[0]}
        />

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>{submitLabel}</Text>
          )}
        </TouchableOpacity>

        {onCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={isSubmitting}>
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <BarcodeScanner
        isVisible={showScanner}
        onScan={handleBarcodeScan}
        onClose={() => setShowScanner(false)}
        title={t('products.scanBarcode')}
      />
    </>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    padding: 20,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
    marginBottom: 10,
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 0,
  },
  barcodeInput: {
    flex: 1,
  },
  scanButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  scanButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  cancelButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductForm;
