import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Product } from '../services/productService';
import { formatDate, formatPrice } from '../utils/formatters';

interface ProductDetailViewProps {
  product: Product;
  refreshing?: boolean;
  refreshFailed?: boolean;
  onRetryRefresh?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canDelete?: boolean;
}

const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  refreshing = false,
  refreshFailed = false,
  onRetryRefresh,
  onEdit,
  onDelete,
  canDelete = true,
}) => {
  const { t, i18n } = useTranslation();

  const renderRow = (label: string, value: string | number | undefined | null) => {
    if (value === undefined || value === null || value === '') return null;
    return (
      <View style={styles.row}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    );
  };

  const showLowStock =
    product.isLowStock ?? product.stockQuantity <= product.minStockLevel;
  const showExpiring = product.isExpiringSoon;
  const showExpired = product.isExpired;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {(refreshing || refreshFailed) && (
        <View style={[styles.banner, refreshFailed && styles.bannerError]}>
          {refreshing ? (
            <View style={styles.bannerRow}>
              <ActivityIndicator size="small" color="#667eea" />
              <Text style={styles.bannerText}>{t('products.refreshing')}</Text>
            </View>
          ) : (
            <View style={styles.bannerRow}>
              <Text style={styles.bannerText}>{t('products.staleDataWarning')}</Text>
              {onRetryRefresh && (
                <TouchableOpacity onPress={onRetryRefresh}>
                  <Text style={styles.retryLink}>{t('common.retry')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      <Text style={styles.productTitle}>{product.name}</Text>
      <Text style={styles.categoryBadge}>
        {product.category || t('products.noCategory')}
      </Text>

      {(showExpired || showExpiring || showLowStock) && (
        <View style={styles.alerts}>
          {showExpired && (
            <Text style={styles.alertExpired}>⚠️ {t('products.expired')}</Text>
          )}
          {showExpiring && !showExpired && (
            <Text style={styles.alertExpiring}>⏳ {t('products.expiringSoon')}</Text>
          )}
          {showLowStock && (
            <Text style={styles.alertLowStock}>📉 {t('products.lowStock')}</Text>
          )}
        </View>
      )}

      {product.description ? (
        <Text style={styles.description}>{product.description}</Text>
      ) : null}

      <Text style={styles.sectionTitle}>{t('products.sectionPricing')}</Text>
      {renderRow(
        t('products.purchasePrice'),
        formatPrice(Number(product.purchasePrice), i18n.language)
      )}
      {renderRow(
        t('products.sellingPrice'),
        formatPrice(Number(product.sellingPrice), i18n.language)
      )}
      {product.profit != null &&
        renderRow(
          t('products.profit'),
          formatPrice(Number(product.profit), i18n.language)
        )}
      {product.profitMargin != null &&
        renderRow(t('products.profitMargin'), `${Number(product.profitMargin).toFixed(1)} %`)}

      <Text style={styles.sectionTitle}>{t('products.sectionStock')}</Text>
      {renderRow(t('products.stockQuantity'), product.stockQuantity)}
      {renderRow(t('products.minStockLevel'), product.minStockLevel)}
      {renderRow(t('products.unit'), product.unit)}

      <Text style={styles.sectionTitle}>{t('products.sectionInfo')}</Text>
      {renderRow(t('products.barcode'), product.barcode)}
      {renderRow(
        t('products.isActive'),
        product.isActive === false ? t('products.inactive') : t('products.active')
      )}

      <Text style={styles.sectionTitle}>{t('products.sectionDates')}</Text>
      {renderRow(
        t('products.manufacturingDate'),
        product.manufacturingDate ? formatDate(product.manufacturingDate, i18n.language) : undefined
      )}
      {renderRow(
        t('products.expiryDate'),
        product.expiryDate ? formatDate(product.expiryDate, i18n.language) : undefined
      )}

      {product.updatedAt && (
        <Text style={styles.meta}>
          {t('products.lastUpdated')}: {formatDate(product.updatedAt, i18n.language)}
        </Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Text style={styles.editButtonText}>✏️ {t('products.editProduct')}</Text>
        </TouchableOpacity>

        {canDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
            <Text style={styles.deleteButtonText}>🗑️ {t('products.deleteProduct')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  banner: {
    backgroundColor: '#eef2ff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  bannerError: {
    backgroundColor: '#fff3cd',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  bannerText: {
    fontSize: 13,
    color: '#444',
    flex: 1,
  },
  retryLink: {
    color: '#667eea',
    fontWeight: '600',
    fontSize: 13,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  alerts: {
    marginBottom: 12,
    gap: 4,
  },
  alertExpired: {
    color: '#dc3545',
    fontWeight: 'bold',
    fontSize: 13,
  },
  alertExpiring: {
    color: '#fd7e14',
    fontWeight: 'bold',
    fontSize: 13,
  },
  alertLowStock: {
    color: '#dc3545',
    fontSize: 13,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    color: '#555',
    marginBottom: 16,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#667eea',
    marginTop: 8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  rowValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  meta: {
    fontSize: 12,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  editButton: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dc3545',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductDetailView;
