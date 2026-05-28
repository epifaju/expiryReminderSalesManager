import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import productDAO from '../dao/ProductDAO';
import authService from '../services/authService';
import { applyScannerSqlMigrations } from '../database/scannerSqlMigrations';
import ProductForm from '../components/ProductForm';
import ProductDetailView from '../components/ProductDetailView';
import UnknownBarcodeModal, { QuickProductFormData } from '../components/bluetooth/UnknownBarcodeModal';
import { registerScanCallbacks } from '../hooks/scannerBridge';
import { createQuickProduct } from '../services/scanner/scannerProductRepository';
import { pendingProductSyncService } from '../services/scanner/PendingProductSyncService';
import NetworkService from '../services/network/NetworkService';
import { LocalProduct } from '../types/localProduct';
import {
  playScanSuccessFeedback,
  playScanNotFoundFeedback,
} from '../bluetooth/scannerFeedback';
import { parseScannedBarcode } from '../bluetooth/scannerUtils';
import { formatPrice } from '../utils/formatters';
import {
  EMPTY_PRODUCT_FORM,
  ProductFormValues,
  formValuesToProductRequest,
  productToFormValues,
} from '../utils/productFormUtils';
import {
  CatalogProduct,
  isLocalOnlyCatalogProduct,
  mergeApiAndLocalProducts,
} from '../utils/productCatalogMerge';
import { saveProductUpdate } from '../services/productUpdateService';
import { loadProductDetail } from '../services/productDetailService';

type ScreenMode = 'list' | 'add' | 'detail' | 'edit';

interface ProductsScreenProps {
  token: string;
}

const ProductsScreen: React.FC<ProductsScreenProps> = () => {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [screenMode, setScreenMode] = useState<ScreenMode>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailRefreshing, setDetailRefreshing] = useState(false);
  const [detailRefreshFailed, setDetailRefreshFailed] = useState(false);
  const [formValues, setFormValues] = useState<ProductFormValues>(EMPTY_PRODUCT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unknownBarcode, setUnknownBarcode] = useState('');
  const [showUnknownModal, setShowUnknownModal] = useState(false);
  const [unknownPrefill, setUnknownPrefill] = useState<
    Partial<QuickProductFormData> | null
  >(null);
  const productsRef = useRef(products);
  productsRef.current = products;

  const canDelete = authService
    .getUser()
    ?.roles?.some((role) => role === 'ROLE_ADMIN' || role === 'ADMIN') ?? false;

  const loadProducts = async (): Promise<CatalogProduct[]> => {
    try {
      setLoading(true);

      if (NetworkService.isOnline() && authService.getToken()) {
        try {
          await pendingProductSyncService.syncAll();
        } catch (syncErr) {
          console.warn('[ProductsScreen] Sync produits en attente:', syncErr);
        }
      }

      const productsData = await productService.getProducts();
      const apiArray = Array.isArray(productsData) ? productsData : [];

      await applyScannerSqlMigrations();
      const localRows = await productDAO.listActiveForCatalog();
      const merged = mergeApiAndLocalProducts(apiArray, localRows);

      console.log(
        `[ProductsScreen] Catalogue: ${apiArray.length} API + ${merged.length - apiArray.length} locaux = ${merged.length}`
      );
      setProducts(merged);
      productsRef.current = merged;
      return merged;
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      Alert.alert(t('common.error'), t('products.loadError'));
      setProducts([]);
      productsRef.current = [];
      return [];
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const refreshProductDetail = useCallback(async (product: CatalogProduct) => {
    setDetailRefreshing(true);
    setDetailRefreshFailed(false);
    try {
      const { product: fresh, refreshFailed } = await loadProductDetail(product);
      setSelectedProduct(fresh);
      setDetailRefreshFailed(refreshFailed);
      setProducts((prev) =>
        prev.map((p) =>
          (fresh.id && p.id === fresh.id) ||
          (fresh.localSqliteId && p.localSqliteId === fresh.localSqliteId)
            ? fresh
            : p
        )
      );
    } catch (error) {
      console.warn('[ProductsScreen] Détail produit:', error);
      setDetailRefreshFailed(true);
    } finally {
      setDetailRefreshing(false);
    }
  }, []);

  const openProductDetail = (product: CatalogProduct) => {
    setSelectedProduct(product);
    setScreenMode('detail');
    void refreshProductDetail(product);
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

  const findCatalogProductByBarcode = useCallback(
    (barcode: string) =>
      productsRef.current.find((p) => p.barcode?.trim() === barcode.trim()),
    []
  );

  const findCatalogProductByLocal = useCallback(
    (local: LocalProduct) => {
      if (local.server_id) {
        const byId = productsRef.current.find((p) => p.id === local.server_id);
        if (byId) return byId;
      }
      if (local.barcode) {
        return findCatalogProductByBarcode(local.barcode);
      }
      return null;
    },
    [findCatalogProductByBarcode]
  );

  const openUnknownProductModal = useCallback(async (barcode: string) => {
    setUnknownBarcode(barcode);
    try {
      const user = authService.getUser();
      const local = await productDAO.findByBarcode(barcode, user ? String(user.id) : undefined);
      if (local) {
        setUnknownPrefill({
          name: local.name,
          description: local.description ?? undefined,
          purchasePrice:
            local.purchase_price != null ? Number(local.purchase_price) : Number(local.price),
          sellingPrice: Number(local.price),
          stockQuantity: Number(local.stock_quantity ?? 1),
          expiryDate: local.expiration_date ?? undefined,
          category: local.category ?? undefined,
        });
      } else {
        setUnknownPrefill(null);
      }
    } catch {
      setUnknownPrefill(null);
    }
    setShowUnknownModal(true);
  }, []);

  const handleExistingProductScan = useCallback(
    (product: Product, barcode: string) => {
      Alert.alert(
        t('products.productFound'),
        `${t('products.existingProduct')}: ${product.name}`,
        [
          {
            text: t('products.productDetail'),
            onPress: () => openProductDetail(product),
          },
          {
            text: t('products.useAsBase'),
            onPress: () => {
              setFormValues(productToFormValues({ ...product, barcode }));
            },
          },
          {
            text: t('products.newProduct'),
            onPress: () => {
              setFormValues((prev) => ({ ...prev, barcode }));
            },
          },
          { text: t('common.cancel'), style: 'cancel' },
        ]
      );
    },
    [t]
  );

  const handleUnknownBarcode = useCallback(
    async (barcode: string) => {
      const user = authService.getUser();
      const localOnly = await productDAO.findByBarcode(
        barcode,
        user ? String(user.id) : undefined
      );
      if (localOnly) {
        handleScannedProductFound(localOnly);
        return;
      }

      const fromCatalog = findCatalogProductByBarcode(barcode);
      if (fromCatalog) {
        void playScanSuccessFeedback();
        if (screenMode === 'add' || screenMode === 'edit') {
          handleExistingProductScan(fromCatalog, barcode);
        } else {
          openProductDetail(fromCatalog);
        }
        return;
      }

      if (NetworkService.isOnline()) {
        try {
          const fromServer = await productService.findByBarcode(barcode);
          if (fromServer) {
            void playScanSuccessFeedback();
            setProducts((prev) =>
              prev.some((p) => p.id === fromServer.id) ? prev : [fromServer, ...prev]
            );
            if (screenMode === 'add' || screenMode === 'edit') {
              handleExistingProductScan(fromServer, barcode);
            } else {
              openProductDetail(fromServer);
            }
            return;
          }
        } catch (lookupError) {
          console.warn('[ProductsScreen] Recherche code-barres API:', lookupError);
        }
      }

      void playScanNotFoundFeedback();
      if (screenMode === 'add') {
        void openUnknownProductModal(barcode);
      } else if (screenMode === 'edit') {
        setFormValues((prev) => ({ ...prev, barcode }));
      }
    },
    [
      screenMode,
      findCatalogProductByBarcode,
      handleExistingProductScan,
      handleScannedProductFound,
      openUnknownProductModal,
    ]
  );

  const syncPendingLocalProduct = useCallback(
    async (local: LocalProduct) => {
      if (!NetworkService.isOnline()) {
        Alert.alert(t('common.error'), t('errors.networkUnavailable'));
        return;
      }

      try {
        await pendingProductSyncService.syncLocalProduct({
          id: local.id,
          server_id: local.server_id,
          name: local.name,
          price: local.price,
          stock_quantity: local.stock_quantity,
          expiration_date: local.expiration_date,
          created_at: local.created_at,
          updated_at: local.updated_at,
          is_deleted: local.is_deleted,
          sync_status: local.sync_status,
          user_id: local.user_id,
          barcode: local.barcode ?? undefined,
        });
        const syncResult = await pendingProductSyncService.syncAll();
        const productsArray = await loadProducts();

        const fromCatalog =
          productsArray.find((p) => p.id && local.server_id && p.id === local.server_id) ??
          (local.barcode
            ? productsArray.find((p) => p.barcode?.trim() === local.barcode?.trim())
            : null);
        if (fromCatalog) {
          setShowUnknownModal(false);
          setUnknownBarcode('');
          if (screenMode === 'add' || screenMode === 'edit') {
            handleExistingProductScan(fromCatalog, local.barcode ?? '');
          } else {
            openProductDetail(fromCatalog);
          }
          Alert.alert(t('common.success'), t('products.syncSuccess'));
          return;
        }

        if (syncResult.synced > 0) {
          Alert.alert(t('common.success'), t('products.syncSuccess'));
        } else if (syncResult.failed > 0) {
          Alert.alert(t('common.error'), syncResult.errors.join('\n') || t('products.syncFailed'));
        } else {
          Alert.alert(t('common.error'), t('products.syncFailed'));
        }
      } catch (error) {
        console.error('Erreur sync produit pending:', error);
        Alert.alert(t('common.error'), t('products.syncFailed'));
      }
    },
    [screenMode, findCatalogProductByLocal, handleExistingProductScan, t]
  );

  const promptSyncPendingProduct = useCallback(
    (local: LocalProduct) => {
      Alert.alert(t('products.local_pending_title'), t('products.local_pending_message'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('products.syncNow'),
          onPress: () => {
            void syncPendingLocalProduct(local);
          },
        },
      ]);
    },
    [syncPendingLocalProduct, t]
  );

  const handleScannedProductFound = useCallback(
    (local: LocalProduct) => {
      void playScanSuccessFeedback();
      const fromCatalog = findCatalogProductByLocal(local);
      if (fromCatalog) {
        if (screenMode === 'add' || screenMode === 'edit') {
          handleExistingProductScan(fromCatalog, local.barcode ?? '');
        } else {
          openProductDetail(fromCatalog);
        }
        return;
      }
      promptSyncPendingProduct(local);
    },
    [screenMode, findCatalogProductByLocal, handleExistingProductScan, promptSyncPendingProduct]
  );

  const handleScannedProductNotFound = useCallback(
    (barcode: string) => {
      handleUnknownBarcode(barcode);
    },
    [handleUnknownBarcode]
  );

  const handleQuickCreateProduct = async (data: QuickProductFormData) => {
    const user = authService.getUser();
    if (!user) {
      Alert.alert(t('common.error'), t('errors.authFailed'));
      return;
    }

    try {
      await createQuickProduct(data, String(user.id));

      if (NetworkService.isOnline()) {
        const syncResult = await pendingProductSyncService.syncAll();
        if (syncResult.failed > 0) {
          const conflict = syncResult.errors.find(
            (e) => e.includes('Erreur 409') || e.toLowerCase().includes('code-barres existe déjà')
          );
          if (conflict) {
            await loadProducts();
            const existing = await productService.findByBarcode(data.barcode);
            if (existing) {
              setShowUnknownModal(false);
              setUnknownBarcode('');
              Alert.alert(t('common.success'), t('products.productAlreadyInCatalog', { name: existing.name }));
              goToList();
              return;
            }
            throw new Error(conflict.replace(/^[^:]+:\s*/, ''));
          }
        }
      }
      await loadProducts();

      setShowUnknownModal(false);
      setUnknownBarcode('');
      Alert.alert(t('common.success'), t('bluetooth.product_created'));
      goToList();
    } catch (error) {
      console.error('Erreur création produit rapide:', error);
      // Les erreurs (409 code-barres, etc.) sont gérées dans le modal.
    }
  };

  useEffect(() => {
    if (screenMode !== 'add' && screenMode !== 'edit') {
      registerScanCallbacks('products', null);
      return;
    }

    registerScanCallbacks('products', {
      onProductFound: handleScannedProductFound,
      onProductNotFound: handleScannedProductNotFound,
      onScanError: (message) => Alert.alert(t('common.error'), message),
    });

    return () => registerScanCallbacks('products', null);
  }, [screenMode, handleScannedProductFound, handleScannedProductNotFound, t]);

  const openEditForm = () => {
    if (!selectedProduct) return;
    setFormValues(productToFormValues(selectedProduct));
    setScreenMode('edit');
  };

  /** Scan caméra sur le formulaire complet : préremplit le code-barres (pas le modal création rapide). */
  const handleBarcodeScanOnForm = useCallback(
    (scannedBarcode: string) => {
      const parsed = parseScannedBarcode(scannedBarcode);
      const retailBarcode = parsed.barcode;
      if (!retailBarcode) {
        return;
      }

      setFormValues((prev) => ({
        ...prev,
        barcode: retailBarcode,
        ...(parsed.expiryDate ? { expiryDate: parsed.expiryDate } : {}),
      }));

      const fromCatalog = findCatalogProductByBarcode(retailBarcode);
      if (fromCatalog) {
        void playScanSuccessFeedback();
        handleExistingProductScan(fromCatalog, retailBarcode);
        return;
      }

      void playScanNotFoundFeedback();
    },
    [findCatalogProductByBarcode, handleExistingProductScan]
  );

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
      const updated = await saveProductUpdate(selectedProduct, payload);
      await loadProducts();
      setSelectedProduct(updated);
      Alert.alert(t('common.success'), t('products.productUpdated'));
      setScreenMode('detail');
      void refreshProductDetail(updated);
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

  const ProductCard: React.FC<{ product: CatalogProduct }> = ({ product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => openProductDetail(product)}
      activeOpacity={0.7}
    >
      <View style={styles.productHeader}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productCategory}>{product.category || t('products.noCategory')}</Text>
      </View>
      {isLocalOnlyCatalogProduct(product) && (
        <Text style={styles.localPendingBadge}>{t('products.localOnlyListBadge')}</Text>
      )}
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
          onBarcodeScanned={handleBarcodeScanOnForm}
        />
        <UnknownBarcodeModal
          visible={showUnknownModal}
          barcode={unknownBarcode}
          prefill={unknownPrefill ?? undefined}
          onCreateProduct={handleQuickCreateProduct}
          onDismiss={() => {
            setShowUnknownModal(false);
            setUnknownBarcode('');
            setUnknownPrefill(null);
          }}
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
          onBarcodeScanned={handleBarcodeScanOnForm}
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
          onRetryRefresh={() => void refreshProductDetail(selectedProduct)}
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
  localPendingBadge: {
    fontSize: 12,
    color: '#b45309',
    backgroundColor: '#fef3c7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
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
