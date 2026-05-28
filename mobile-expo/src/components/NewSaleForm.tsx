import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../utils/formatters';

interface Product {
  id: number;
  name: string;
  sellingPrice: number;
  stockQuantity: number;
  category: string;
  unit: string;
  barcode?: string;
}

interface SaleItem {
  productId: number;
  productName: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface NewSaleFormProps {
  products: Product[];
  onCreateSale: (saleData: {
    customerName: string;
    paymentMethod: string;
    saleItems: SaleItem[];
  }) => Promise<void>;
  preselectedProduct?: Product | null;
  /** Produit à ajouter au panier (scanner Bluetooth) — quantité 1 */
  pendingCartProduct?: Product | null;
  onPendingCartProductHandled?: () => void;
}

const NewSaleForm: React.FC<NewSaleFormProps> = ({
  products,
  onCreateSale,
  preselectedProduct,
  pendingCartProduct,
  onPendingCartProductHandled,
}) => {
  const { t, i18n } = useTranslation();
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [quantityDrafts, setQuantityDrafts] = useState<Record<number, string>>({});

  // Create refs for TextInputs
  const customerNameRef = useRef<TextInput>(null);
  const quantityRef = useRef<TextInput>(null);

  // Handle preselected product from scanner
  useEffect(() => {
    if (preselectedProduct) {
      setSelectedProduct(preselectedProduct);
    }
  }, [preselectedProduct]);

  const alertInsufficientStock = useCallback(
    (stock: number) => {
      Alert.alert(t('common.error'), `${t('sales.insufficientStock')} ${stock}`);
    },
    [t]
  );

  const applyCartQuantity = useCallback(
    (productId: number, targetQty: number, unitPrice?: number): boolean => {
      if (targetQty <= 0) {
        setSaleItems((prev) => prev.filter((item) => item.productId !== productId));
        setQuantityDrafts((prev) => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
        return true;
      }

      const product = products.find((p) => p.id === productId);
      const stock = product?.stockQuantity ?? Number.MAX_SAFE_INTEGER;
      if (targetQty > stock) {
        alertInsufficientStock(stock);
        return false;
      }

      setSaleItems((prev) => {
        const index = prev.findIndex((item) => item.productId === productId);
        if (index < 0) {
          return prev;
        }
        const item = prev[index];
        const price = unitPrice ?? item.unitPrice;
        const next = [...prev];
        next[index] = {
          ...item,
          quantity: targetQty,
          unitPrice: price,
          totalPrice: targetQty * price,
        };
        return next;
      });
      return true;
    },
    [products, alertInsufficientStock]
  );

  const changeCartQuantityBy = useCallback(
    (productId: number, delta: number) => {
      setSaleItems((prev) => {
        const item = prev.find((i) => i.productId === productId);
        if (!item) {
          return prev;
        }
        const targetQty = item.quantity + delta;
        if (targetQty <= 0) {
          setQuantityDrafts((drafts) => {
            const next = { ...drafts };
            delete next[productId];
            return next;
          });
          return prev.filter((i) => i.productId !== productId);
        }

        const product = products.find((p) => p.id === productId);
        const stock = product?.stockQuantity ?? Number.MAX_SAFE_INTEGER;
        if (targetQty > stock) {
          setTimeout(() => alertInsufficientStock(stock), 0);
          return prev;
        }

        return prev.map((i) =>
          i.productId === productId
            ? {
                ...i,
                quantity: targetQty,
                totalPrice: targetQty * i.unitPrice,
              }
            : i
        );
      });
    },
    [products, alertInsufficientStock]
  );

  const appendProductToCart = useCallback(
    (product: Product, qty: number) => {
      if (qty <= 0) {
        return;
      }

      setSaleItems((prev) => {
        const existing = prev.find((item) => item.productId === product.id);
        const targetQty = (existing?.quantity ?? 0) + qty;

        if (targetQty > product.stockQuantity) {
          setTimeout(() => alertInsufficientStock(product.stockQuantity), 0);
          return prev;
        }

        if (existing) {
          return prev.map((item) =>
            item.productId === product.id
              ? {
                  ...item,
                  quantity: targetQty,
                  totalPrice: targetQty * product.sellingPrice,
                }
              : item
          );
        }

        return [
          ...prev,
          {
            productId: product.id,
            productName: product.name,
            barcode: product.barcode,
            quantity: qty,
            unitPrice: product.sellingPrice,
            totalPrice: qty * product.sellingPrice,
          },
        ];
      });
    },
    [alertInsufficientStock]
  );

  const getQuantityInputValue = (item: SaleItem) =>
    quantityDrafts[item.productId] ?? String(item.quantity);

  const handleLineQuantityChange = (productId: number, text: string) => {
    const digits = text.replace(/\D/g, '');
    setQuantityDrafts((prev) => ({ ...prev, [productId]: digits }));
  };

  const commitLineQuantity = (productId: number) => {
    const draft = quantityDrafts[productId];
    if (draft === undefined) {
      return;
    }

    setQuantityDrafts((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });

    if (draft === '') {
      return;
    }

    const parsed = parseInt(draft, 10);
    if (Number.isNaN(parsed)) {
      return;
    }

    applyCartQuantity(productId, parsed);
  };

  useEffect(() => {
    if (!pendingCartProduct) {
      return;
    }
    appendProductToCart(pendingCartProduct, 1);
    onPendingCartProductHandled?.();
  }, [pendingCartProduct, appendProductToCart, onPendingCartProductHandled]);

  const addItemToSale = () => {
    if (!selectedProduct || !quantity || parseInt(quantity) <= 0) {
      Alert.alert(t('errors.title'), t('sales.selectProductAndQuantity'));
      return;
    }

    const qty = parseInt(quantity, 10);
    appendProductToCart(selectedProduct, qty);

    setSelectedProduct(null);
    setQuantity('1');
    setShowProductSelector(false);
  };

  const removeItemFromSale = (productId: number) => {
    setSaleItems((prev) => prev.filter((item) => item.productId !== productId));
    setQuantityDrafts((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const getTotalAmount = () => {
    return saleItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const handleCreateSale = async () => {
    if (saleItems.length === 0) {
      Alert.alert(t('errors.title'), t('sales.addAtLeastOneProduct'));
      return;
    }

    try {
      await onCreateSale({
        customerName,
        paymentMethod,
        saleItems,
      });

      // Reset form (uniquement si succès)
      setSaleItems([]);
      setQuantityDrafts({});
      setCustomerName('');
      setPaymentMethod('CASH');
    } catch {
      // L'écran parent gère déjà les erreurs (modal produit inconnu, alert, etc.)
    }
  };


  const ProductSelector = () => (
    <Modal visible={showProductSelector} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('sales.selectProduct')}</Text>
            <TouchableOpacity onPress={() => setShowProductSelector(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.productList}>
            {products.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productItem}
                onPress={() => {
                  setSelectedProduct(product);
                  setShowProductSelector(false);
                }}
              >
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>{formatPrice(product.sellingPrice, i18n.language)}</Text>
                </View>
                <Text style={styles.productStock}>{t('products.stock')}: {product.stockQuantity}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={styles.container} 
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={styles.sectionTitle}>{t('sales.newSale')}</Text>
        
        {/* Customer Info */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>{t('sales.customerNameOptional')}</Text>
          <TextInput
            ref={customerNameRef}
            style={styles.input}
            value={customerName}
            onChangeText={setCustomerName}
            placeholder={t('sales.customerName')}
            autoCorrect={false}
            autoCapitalize="words"
            blurOnSubmit={false}
            returnKeyType="done"
            textContentType="name"
            enablesReturnKeyAutomatically={false}
          />
        </View>

        {/* Payment Method */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>{t('sales.paymentMethod')}</Text>
          <View style={styles.paymentMethods}>
            {['CASH', 'CARD', 'TRANSFER'].map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentButton,
                  paymentMethod === method && styles.paymentButtonActive
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text style={[
                  styles.paymentButtonText,
                  paymentMethod === method && styles.paymentButtonTextActive
                ]}>
                  {method === 'CASH' ? t('sales.paymentMethods.cash') : method === 'CARD' ? t('sales.paymentMethods.card') : t('sales.paymentMethods.transfer')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Add Product */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>{t('sales.addProduct')}</Text>
          <TouchableOpacity
            style={styles.addProductButton}
            onPress={() => setShowProductSelector(true)}
          >
            <Text style={styles.addProductButtonText}>
              {selectedProduct ? selectedProduct.name : t('sales.selectProduct')}
            </Text>
          </TouchableOpacity>
          
          {selectedProduct && (
            <View style={styles.quantitySection}>
              <Text style={styles.formLabel}>{t('sales.quantity')}</Text>
              <View style={styles.quantityContainer}>
                <TextInput
                  ref={quantityRef}
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholder="1"
                  autoCorrect={false}
                  blurOnSubmit={false}
                  returnKeyType="done"
                  selectTextOnFocus={true}
                  enablesReturnKeyAutomatically={false}
                />
                <TouchableOpacity style={styles.addItemButton} onPress={addItemToSale}>
                  <Text style={styles.addItemButtonText}>{t('sales.add')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Sale Items */}
        {saleItems.length > 0 && (
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>{t('sales.saleItems')}</Text>
            {saleItems.map((item) => (
              <View key={item.productId} style={styles.saleItemRow}>
                <View style={styles.saleItemTopRow}>
                  <View style={styles.saleItemInfo}>
                    <Text style={styles.saleItemName}>{item.productName}</Text>
                    <Text style={styles.saleItemUnitPrice}>
                      {formatPrice(item.unitPrice, i18n.language)} / {t('sales.unit')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeItemButton}
                    onPress={() => removeItemFromSale(item.productId)}
                    accessibilityLabel={t('sales.removeItem')}
                  >
                    <Text style={styles.removeItemButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.quantityStepperRow}>
                  <TouchableOpacity
                    style={styles.qtyStepButton}
                    onPress={() => changeCartQuantityBy(item.productId, -1)}
                    accessibilityLabel={t('sales.decreaseQuantity')}
                  >
                    <Text style={styles.qtyStepButtonText}>−</Text>
                  </TouchableOpacity>

                  <TextInput
                    style={styles.lineQuantityInput}
                    value={getQuantityInputValue(item)}
                    onChangeText={(text) => handleLineQuantityChange(item.productId, text)}
                    onBlur={() => commitLineQuantity(item.productId)}
                    keyboardType="number-pad"
                    selectTextOnFocus
                    maxLength={6}
                  />

                  <TouchableOpacity
                    style={styles.qtyStepButton}
                    onPress={() => changeCartQuantityBy(item.productId, 1)}
                    accessibilityLabel={t('sales.increaseQuantity')}
                  >
                    <Text style={styles.qtyStepButtonText}>+</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.saleItemLineTotal}>
                  {t('sales.lineTotal')}: {formatPrice(item.totalPrice, i18n.language)}
                </Text>
              </View>
            ))}
            
            <View style={styles.totalSection}>
              <Text style={styles.totalText}>{t('sales.total')}: {formatPrice(getTotalAmount(), i18n.language)}</Text>
            </View>
          </View>
        )}

        {/* Create Sale Button */}
        <TouchableOpacity
          style={[styles.createSaleButton, saleItems.length === 0 && styles.createSaleButtonDisabled]}
          onPress={handleCreateSale}
          disabled={saleItems.length === 0}
        >
          <Text style={styles.createSaleButtonText}>{t('sales.createSale')}</Text>
        </TouchableOpacity>

        <ProductSelector />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  paymentButtonActive: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  paymentButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  paymentButtonTextActive: {
    color: 'white',
  },
  addProductButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addProductButtonText: {
    color: '#333',
    fontSize: 16,
  },
  quantitySection: {
    marginTop: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  quantityInput: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  addItemButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addItemButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  saleItemRow: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saleItemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  saleItemInfo: {
    flex: 1,
    paddingRight: 8,
  },
  saleItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  saleItemUnitPrice: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quantityStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
  },
  qtyStepButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyStepButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  lineQuantityInput: {
    minWidth: 56,
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saleItemLineTotal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#28a745',
    textAlign: 'right',
  },
  removeItemButton: {
    backgroundColor: '#dc3545',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeItemButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalSection: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    textAlign: 'center',
  },
  createSaleButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  createSaleButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createSaleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  productList: {
    maxHeight: 400,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  productPrice: {
    fontSize: 12,
    color: '#28a745',
  },
  productStock: {
    fontSize: 12,
    color: '#666',
  },
});

export default NewSaleForm;
