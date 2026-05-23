import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import productService, { Product } from '../services/productService';
import authService from '../services/authService';
import {
  EMPTY_PRODUCT_FORM,
  ProductFormValues,
  formValuesToProductRequest,
  productToFormValues,
} from '../utils/productFormUtils';

export type ProductDetailScreenMode = 'list' | 'detail' | 'edit';

interface UseProductDetailFlowOptions {
  onAfterUpdate?: (product: Product) => void;
  onAfterDelete?: (id: number) => void;
}

export function useProductDetailFlow(options: UseProductDetailFlowOptions = {}) {
  const { t } = useTranslation();
  const { onAfterUpdate, onAfterDelete } = options;

  const [screenMode, setScreenMode] = useState<ProductDetailScreenMode>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailRefreshing, setDetailRefreshing] = useState(false);
  const [detailRefreshFailed, setDetailRefreshFailed] = useState(false);
  const [formValues, setFormValues] = useState<ProductFormValues>(EMPTY_PRODUCT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canDelete =
    authService.getUser()?.roles?.some((role) => role === 'ROLE_ADMIN' || role === 'ADMIN') ??
    false;

  const refreshProductFromApi = useCallback(
    async (id: number, onSynced?: (product: Product) => void) => {
      setDetailRefreshing(true);
      setDetailRefreshFailed(false);
      try {
        const fresh = await productService.getProductById(id);
        setSelectedProduct(fresh);
        onSynced?.(fresh);
      } catch (error) {
        console.error('Erreur refresh produit:', error);
        setDetailRefreshFailed(true);
      } finally {
        setDetailRefreshing(false);
      }
    },
    []
  );

  const openProductDetail = useCallback(
    (product: Product, onSynced?: (product: Product) => void) => {
      setSelectedProduct(product);
      setScreenMode('detail');
      setDetailRefreshFailed(false);
      refreshProductFromApi(product.id, onSynced);
    },
    [refreshProductFromApi]
  );

  const goToList = useCallback(() => {
    setScreenMode('list');
    setSelectedProduct(null);
    setFormValues(EMPTY_PRODUCT_FORM);
  }, []);

  const openEditForm = useCallback(() => {
    if (!selectedProduct) return;
    setFormValues(productToFormValues(selectedProduct));
    setScreenMode('edit');
  }, [selectedProduct]);

  const submitUpdate = useCallback(
    async (onSynced?: (product: Product) => void) => {
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
        onSynced?.(updated);
        onAfterUpdate?.(updated);
        Alert.alert(t('common.success'), t('products.productUpdated'));
        setScreenMode('detail');
        refreshProductFromApi(updated.id, onSynced);
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
    },
    [selectedProduct, formValues, t, onAfterUpdate, refreshProductFromApi]
  );

  const handleDelete = useCallback(async () => {
    if (!selectedProduct) return;

    try {
      setIsSubmitting(true);
      const deletedId = selectedProduct.id;
      await productService.deleteProduct(deletedId);
      onAfterDelete?.(deletedId);
      Alert.alert(t('common.success'), t('products.productDeleted'));
      goToList();
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
  }, [selectedProduct, t, onAfterDelete, goToList]);

  const confirmDelete = useCallback(() => {
    if (!selectedProduct) return;

    Alert.alert(t('products.deleteProduct'), t('products.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: handleDelete },
    ]);
  }, [selectedProduct, t, handleDelete]);

  return {
    screenMode,
    setScreenMode,
    selectedProduct,
    detailRefreshing,
    detailRefreshFailed,
    formValues,
    setFormValues,
    isSubmitting,
    canDelete,
    openProductDetail,
    goToList,
    openEditForm,
    submitUpdate,
    confirmDelete,
    refreshProductFromApi,
  };
}
