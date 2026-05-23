import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import productService, { Product } from '../services/productService';
import authService from '../services/authService';
import ProductForm from '../components/ProductForm';
import ProductDetailView from '../components/ProductDetailView';
import { formatPrice } from '../utils/formatters';
import {
  EMPTY_PRODUCT_FORM,
  ProductFormValues,
  formValuesToProductRequest,
  productToFormValues,
} from '../utils/productFormUtils';

type ScreenMode = 'list' | 'add' | 'detail' | 'edit';

interface ProductsScreenProps {
  token: string;
}

const ProductsScreen: React.FC<ProductsScreenProps> = () => {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [screenMode, setScreenMode] = useState<ScreenMode>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailRefreshing, setDetailRefreshing] = useState(false);
  const [detailRefreshFailed, setDetailRefreshFailed] = useState(false);
  const [formValues, setFormValues] = useState<ProductFormValues>(EMPTY_PRODUCT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canDelete = authService
    .getUser()
    ?.roles?.some((role) => role === 'ROLE_ADMIN' || role === 'ADMIN') ?? false;

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await productService.getProducts();
      const productsArray = Array.isArray(productsData) ? productsData : [];
      setProducts(productsArray);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      Alert.alert(t('common.error'), t('products.loadError'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const refreshProductFromApi = useCallback(async (id: number) => {
    setDetailRefreshing(true);
    setDetailRefreshFailed(false);
    try {
      const fresh = await productService.getProductById(id);
      setSelectedProduct(fresh);
      setProducts((prev) => prev.map((p) => (p.id === id ? fresh : p)));
    } catch (error) {
      console.error('Erreur refresh produit:', error);
      setDetailRefreshFailed(true);
    } finally {
      setDetailRefreshing(false);
    }
  }, []);

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setScreenMode('detail');
    setDetailRefreshFailed(false);
    refreshProductFromApi(product.id);
  };

  const goToList = () => {
    setScreenMode('list');
    setSelectedProduct(null);
    setFormValues(EMPTY_PRODUCT_FORM);
  };

  const openAddForm = () => {
    setFormValues(EMPTY_PRODUCT_FORM);
    setScreenMode('add');
  };

  const openEditForm = () => {
    if (!selectedProduct) return;
    setFormValues(productToFormValues(selectedProduct));
    setScreenMode('edit');
  };

  const handleBarcodeScanOnCreate = (scannedBarcode: string) => {
    setFormValues((prev) => ({ ...prev, barcode: scannedBarcode }));
    const existingProduct = products.find((p) => p.barcode === scannedBarcode);
    if (existingProduct) {
      Alert.alert(
        t('products.productFound'),
        `${t('products.existingProduct')}: ${existingProduct.name}`,
        [
          {
            text: t('products.useAsBase'),
            onPress: () => {
              setFormValues(productToFormValues({ ...existingProduct, barcode: scannedBarcode }));
            },
          },
          {
            text: t('products.newProduct'),
            onPress: () => {
              setFormValues((prev) => ({ ...prev, barcode: scannedBarcode }));
            },
          },
        ]
      );
    }
  };

  const submitCreate = async () => {
    if (!formValues.name || !formValues.purchasePrice || !formValues.sellingPrice) {
      Alert.alert(t('common.error'), t('validation.fillRequiredFields'));
      return;
    }

    const payload = formValuesToProductRequest(formValues);
    const errors = productService.validateProductData(payload);
    if (errors.length > 0) {
      Alert.alert(t('common.error'), errors.join('\n'));
      return;
    }

    try {
      setIsSubmitting(true);
      await productService.createProduct(payload);
      Alert.alert(t('common.success'), t('products.productAdded'));
      goToList();
      await loadProducts();
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du produit:', error);
      Alert.alert(t('common.error'), error.message || t('products.addError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitUpdate = async () => {
    if (!selectedProduct) return;

    const payload = formValuesToProductRequest(formValues);
    const errors = productService.validateProductData(payload);
    if (errors.length > 0) {
      Alert.alert(t('common.error'), errors.join('\n'));
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await productService.updateProduct(selectedProduct.id, payload);
      setSelectedProduct(updated);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      Alert.alert(t('common.success'), t('products.productUpdated'));
      setScreenMode('detail');
      refreshProductFromApi(updated.id);
    } catch (error: any) {
      console.error('Erreur mise à jour produit:', error);
      const message =
        error.message?.includes('403') || error.message?.includes('Accès refusé')
          ? t('products.updateForbidden')
          : error.message || t('products.updateError');
      Alert.alert(t('common.error'), message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = () => {
    if (!selectedProduct) return;

    Alert.alert(t('products.deleteProduct'), t('products.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: handleDelete,
      },
    ]);
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      setIsSubmitting(true);
      await productService.deleteProduct(selectedProduct.id);
      Alert.alert(t('common.success'), t('products.productDeleted'));
      goToList();
      await loadProducts();
    } catch (error: any) {
      console.error('Erreur suppression produit:', error);
      const message =
        error.message?.includes('403') || error.message?.includes('Accès refusé')
          ? t('products.deleteForbidden')
          : error.message || t('products.deleteError');
      Alert.alert(t('common.error'), message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderHeader = (
    title: string,
    onBack?: () => void,
    rightAction?: React.ReactNode
  ) => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, onBack && styles.headerTitleWithBack]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {rightAction}
    </View>
  );

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => openProductDetail(product)}
      activeOpacity={0.7}
    >
      <View style={styles.productHeader}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productCategory}>{product.category || t('products.noCategory')}</Text>
      </View>
      <Text style={styles.productDescription} numberOfLines={2}>
        {product.description}
      </Text>
      <View style={styles.productDetails}>
        <Text style={styles.productPrice}>
          {t('products.price')}: {formatPrice(product.sellingPrice, i18n.language)}
        </Text>
        <Text style={styles.productStock}>
          {t('products.stock')}: {product.stockQuantity}
        </Text>
      </View>
      {product.stockQuantity < product.minStockLevel && (
        <Text style={styles.lowStockWarning}>⚠️ {t('products.lowStock')}</Text>
      )}
      <Text style={styles.tapHint}>{t('products.tapForDetail')}</Text>
    </TouchableOpacity>
  );

  if (screenMode === 'add') {
    return (
      <View style={styles.container}>
        {renderHeader(`📦 ${t('products.addProduct')}`, goToList)}
        <ProductForm
          values={formValues}
          onChange={setFormValues}
          onSubmit={submitCreate}
          onCancel={goToList}
          mode="create"
          isSubmitting={isSubmitting}
          onBarcodeScanned={handleBarcodeScanOnCreate}
        />
      </View>
    );
  }

  if (screenMode === 'edit' && selectedProduct) {
    return (
      <View style={styles.container}>
        {renderHeader(`📦 ${t('products.editProduct')}`, () => setScreenMode('detail'))}
        <ProductForm
          values={formValues}
          onChange={setFormValues}
          onSubmit={submitUpdate}
          onCancel={() => setScreenMode('detail')}
          mode="edit"
          isSubmitting={isSubmitting}
        />
      </View>
    );
  }

  if (screenMode === 'detail' && selectedProduct) {
    return (
      <View style={styles.container}>
        {renderHeader(`📦 ${t('products.productDetail')}`, goToList)}
        <ProductDetailView
          product={selectedProduct}
          refreshing={detailRefreshing}
          refreshFailed={detailRefreshFailed}
          onRetryRefresh={() => refreshProductFromApi(selectedProduct.id)}
          onEdit={openEditForm}
          onDelete={confirmDelete}
          canDelete={canDelete}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader(
        `📦 ${t('products.title')}`,
        undefined,
        <TouchableOpacity style={styles.addProductButton} onPress={openAddForm}>
          <Text style={styles.addProductButtonText}>+ {t('common.add')}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('products.searchProducts')}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading && products.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : (
        <ScrollView
          style={styles.productsList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={styles.productsCount}>
            {filteredProducts.length} {t('products.productsFound')}
          </Text>

          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{t('products.noProductsFound')}</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery ? t('products.tryAnotherSearch') : t('products.addFirstProduct')}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#667eea',
    padding: 20,
    paddingTop: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  headerTitleWithBack: {
    fontSize: 18,
  },
  backButton: {
    marginRight: 10,
    padding: 4,
  },
  backButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  addProductButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  addProductButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 15,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  productsList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  productCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
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
    marginBottom: 8,
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
  tapHint: {
    fontSize: 11,
    color: '#667eea',
    marginTop: 8,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default ProductsScreen;
