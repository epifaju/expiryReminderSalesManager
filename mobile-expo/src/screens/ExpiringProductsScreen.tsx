import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatPrice, formatDate } from '../utils/formatters';
import productService from '../services/productService';

interface Product {
  id: number;
  name: string;
  description: string;
  barcode: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  expiryDate: string;
  manufacturingDate: string;
  category: string;
  unit: string;
  isActive: boolean;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
}

interface ExpiringProductsScreenProps {
  token: string;
}

const ExpiringProductsScreen: React.FC<ExpiringProductsScreenProps> = ({ token }) => {
  const { t, i18n } = useTranslation();
  const [expiringProducts, setExpiringProducts] = useState<Product[]>([]);
  const [expiredProducts, setExpiredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'expiring' | 'expired'>('expiring');
  const [warningDays, setWarningDays] = useState(7);

  const validateAndCleanProduct = (product: any): Product | null => {
    if (!product || typeof product !== 'object') {
      console.warn(t('expiringProducts.invalidProduct'), product);
      return null;
    }

    // Validation des champs requis
    if (!product.id || !product.name) {
      console.warn(t('expiringProducts.missingFields'), product);
      return null;
    }

    // Nettoyage et validation de la date d'expiration
    let cleanExpiryDate = product.expiryDate;
    if (cleanExpiryDate) {
      // Si c'est un tableau (cas possible avec certaines sérialisations), prendre le premier élément
      if (Array.isArray(cleanExpiryDate)) {
        cleanExpiryDate = cleanExpiryDate[0];
      }
      
      // Convertir en string si nécessaire
      if (typeof cleanExpiryDate !== 'string') {
        cleanExpiryDate = String(cleanExpiryDate);
      }
      
      // Vérifier que la date est valide
      const testDate = new Date(cleanExpiryDate);
      if (isNaN(testDate.getTime())) {
        console.warn(t('expiringProducts.invalidExpiryDate'), product.name, cleanExpiryDate);
        cleanExpiryDate = null;
      }
    }

    return {
      id: product.id,
      name: product.name || t('expiringProducts.undefinedName'),
      description: product.description || '',
      barcode: product.barcode || '',
      purchasePrice: Number(product.purchasePrice) || 0,
      sellingPrice: Number(product.sellingPrice) || 0,
      stockQuantity: Number(product.stockQuantity) || 0,
      minStockLevel: Number(product.minStockLevel) || 0,
      expiryDate: cleanExpiryDate,
      manufacturingDate: product.manufacturingDate || '',
      category: product.category || t('products.noCategory'),
      unit: product.unit || '',
      isActive: Boolean(product.isActive),
      isExpired: product.isExpired,
      isExpiringSoon: product.isExpiringSoon,
    };
  };

  const loadExpiringProducts = async () => {
    try {
      setLoading(true);
      const expiringData = await productService.getExpiringProducts(warningDays);
      const expiredData = await productService.getExpiredProducts();
      
      console.log('📦 Produits expirants reçus:', expiringData);
      console.log('📦 Produits expirés reçus:', expiredData);
      
      // Valider et nettoyer les données
      const cleanExpiringProducts = Array.isArray(expiringData) 
        ? expiringData.map(validateAndCleanProduct).filter(Boolean) as Product[]
        : [];
      
      const cleanExpiredProducts = Array.isArray(expiredData) 
        ? expiredData.map(validateAndCleanProduct).filter(Boolean) as Product[]
        : [];
      
      console.log('📦 Produits expirants nettoyés:', cleanExpiringProducts);
      console.log('📦 Produits expirés nettoyés:', cleanExpiredProducts);
      
      setExpiringProducts(cleanExpiringProducts);
      setExpiredProducts(cleanExpiredProducts);
    } catch (error) {
      console.error(t('expiringProducts.loadError'), error);
      Alert.alert(t('errors.title'), t('expiringProducts.loadError'));
      setExpiringProducts([]);
      setExpiredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpiringProducts();
    setRefreshing(false);
  };

  useEffect(() => {
    loadExpiringProducts();
  }, [warningDays]);

  const formatDateLocal = (dateString: string): string => {
    if (!dateString) return t('expiringProducts.notDefined');
    
    try {
      const date = new Date(dateString);
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        console.warn(t('expiringProducts.invalidDate'), dateString);
        return t('expiringProducts.invalidDate');
      }
      return formatDate(date, i18n.language);
    } catch (error) {
      console.error(t('expiringProducts.dateFormatError'), dateString, error);
      return t('expiringProducts.invalidDate');
    }
  };

  const getDaysUntilExpiry = (expiryDate: string): number => {
    if (!expiryDate) return 0;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normaliser à minuit pour une comparaison précise
      
      const expiry = new Date(expiryDate);
      // Vérifier si la date est valide
      if (isNaN(expiry.getTime())) {
        console.warn(t('expiringProducts.invalidExpiryDate'), expiryDate);
        return 0;
      }
      
      expiry.setHours(0, 0, 0, 0); // Normaliser à minuit
      
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      console.error(t('expiringProducts.daysCalculationError'), expiryDate, error);
      return 0;
    }
  };

  const getExpiryStatus = (expiryDate: string) => {
    const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
    
    if (daysUntilExpiry < 0) {
      return {
        text: t('expiringProducts.expiredSince', { days: Math.abs(daysUntilExpiry) }),
        color: '#dc3545',
        icon: '🚫'
      };
    } else if (daysUntilExpiry === 0) {
      return {
        text: t('expiringProducts.expiresToday'),
        color: '#dc3545',
        icon: '⚠️'
      };
    } else if (daysUntilExpiry === 1) {
      return {
        text: t('expiringProducts.expiresTomorrow'),
        color: '#fd7e14',
        icon: '⚠️'
      };
    } else {
      return {
        text: t('expiringProducts.expiresIn', { days: daysUntilExpiry }),
        color: '#ffc107',
        icon: '⏰'
      };
    }
  };

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    const expiryStatus = getExpiryStatus(product.expiryDate);
    
    return (
      <View style={styles.productCard}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productCategory}>{product.category || t('products.noCategory')}</Text>
        </View>
        
        <Text style={styles.productDescription}>{product.description}</Text>
        
        <View style={styles.expiryInfo}>
          <Text style={[styles.expiryStatus, { color: expiryStatus.color }]}>
            {expiryStatus.icon} {expiryStatus.text}
          </Text>
          <Text style={styles.expiryDate}>
            {t('expiringProducts.expiryDate')}: {formatDateLocal(product.expiryDate)}
          </Text>
        </View>
        
        <View style={styles.productDetails}>
          <Text style={styles.productPrice}>{t('products.sellingPrice')}: {formatPrice(product.sellingPrice, i18n.language)}</Text>
          <Text style={styles.productStock}>{t('products.stock')}: {product.stockQuantity}</Text>
        </View>
        
        {product.stockQuantity < product.minStockLevel && (
          <Text style={styles.lowStockWarning}>⚠️ {t('products.lowStock')}</Text>
        )}
      </View>
    );
  };

  const currentProducts = activeTab === 'expiring' ? expiringProducts : expiredProducts;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⏰ {t('expiringProducts.title')}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expiring' && styles.activeTab]}
          onPress={() => setActiveTab('expiring')}
        >
          <Text style={[styles.tabText, activeTab === 'expiring' && styles.activeTabText]}>
            {t('expiringProducts.expiringSoon')} ({expiringProducts.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expired' && styles.activeTab]}
          onPress={() => setActiveTab('expired')}
        >
          <Text style={[styles.tabText, activeTab === 'expired' && styles.activeTabText]}>
            {t('expiringProducts.expired')} ({expiredProducts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Warning Days Selector (only for expiring tab) */}
      {activeTab === 'expiring' && (
        <View style={styles.warningDaysContainer}>
          <Text style={styles.warningDaysLabel}>{t('expiringProducts.alertInNext')}:</Text>
          <View style={styles.warningDaysButtons}>
            {[3, 7, 14, 30].map((days) => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.warningDaysButton,
                  warningDays === days && styles.activeWarningDaysButton
                ]}
                onPress={() => setWarningDays(days)}
              >
                <Text style={[
                  styles.warningDaysButtonText,
                  warningDays === days && styles.activeWarningDaysButtonText
                ]}>
                  {days}{t('expiringProducts.daysSuffix')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <ScrollView
        style={styles.productsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.productsCount}>
          {currentProducts.length} {t('expiringProducts.productsFound')}
        </Text>

        {currentProducts.length > 0 ? (
          currentProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {activeTab === 'expiring' 
                ? t('expiringProducts.noExpiringProducts') 
                : t('expiringProducts.noExpiredProducts')
              }
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {activeTab === 'expiring' 
                ? t('expiringProducts.allProductsGood') 
                : t('expiringProducts.noExpiredToManage')
              }
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
  header: {
    backgroundColor: '#fd7e14',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#fd7e14',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fd7e14',
    fontWeight: 'bold',
  },
  warningDaysContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  warningDaysLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    fontWeight: '500',
  },
  warningDaysButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  warningDaysButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  activeWarningDaysButton: {
    backgroundColor: '#fd7e14',
    borderColor: '#fd7e14',
  },
  warningDaysButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeWarningDaysButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  productsList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  productsCount: {
    fontSize: 14,
    color: '#666',
    marginVertical: 15,
  },
  productCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  expiryInfo: {
    backgroundColor: '#fff3cd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  expiryStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  expiryDate: {
    fontSize: 12,
    color: '#666',
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: 'bold',
  },
  productStock: {
    fontSize: 14,
    color: '#666',
  },
  lowStockWarning: {
    fontSize: 12,
    color: '#dc3545',
    marginTop: 8,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default ExpiringProductsScreen;
