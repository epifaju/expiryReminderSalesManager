import React, { useState, useRef, useEffect } from 'react';
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

interface Product {
  id: number;
  name: string;
  sellingPrice: number;
  stockQuantity: number;
  category: string;
  unit: string;
}

interface SaleItem {
  productId: number;
  productName: string;
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
  }) => void;
  preselectedProduct?: Product | null;
}

const NewSaleForm: React.FC<NewSaleFormProps> = ({ products, onCreateSale, preselectedProduct }) => {
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [showProductSelector, setShowProductSelector] = useState(false);

  // Create refs for TextInputs
  const customerNameRef = useRef<TextInput>(null);
  const quantityRef = useRef<TextInput>(null);

  // Handle preselected product from scanner
  useEffect(() => {
    if (preselectedProduct) {
      setSelectedProduct(preselectedProduct);
    }
  }, [preselectedProduct]);

  const addItemToSale = () => {
    if (!selectedProduct || !quantity || parseInt(quantity) <= 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner un produit et une quantité valide');
      return;
    }

    const qty = parseInt(quantity);
    if (qty > selectedProduct.stockQuantity) {
      Alert.alert('Erreur', `Stock insuffisant. Stock disponible: ${selectedProduct.stockQuantity}`);
      return;
    }

    const existingItemIndex = saleItems.findIndex(item => item.productId === selectedProduct.id);
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...saleItems];
      updatedItems[existingItemIndex].quantity += qty;
      updatedItems[existingItemIndex].totalPrice = updatedItems[existingItemIndex].quantity * selectedProduct.sellingPrice;
      setSaleItems(updatedItems);
    } else {
      const newItem: SaleItem = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: qty,
        unitPrice: selectedProduct.sellingPrice,
        totalPrice: qty * selectedProduct.sellingPrice
      };
      setSaleItems([...saleItems, newItem]);
    }

    setSelectedProduct(null);
    setQuantity('1');
    setShowProductSelector(false);
  };

  const removeItemFromSale = (productId: number) => {
    setSaleItems(saleItems.filter(item => item.productId !== productId));
  };

  const getTotalAmount = () => {
    return saleItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const handleCreateSale = () => {
    if (saleItems.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins un produit à la vente');
      return;
    }

    onCreateSale({
      customerName,
      paymentMethod,
      saleItems
    });

    // Reset form
    setSaleItems([]);
    setCustomerName('');
    setPaymentMethod('CASH');
  };

  const formatCurrency = (amount: number) => {
    return `${Number(amount).toFixed(2)} €`;
  };

  const ProductSelector = () => (
    <Modal visible={showProductSelector} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sélectionner un produit</Text>
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
                  <Text style={styles.productPrice}>{formatCurrency(product.sellingPrice)}</Text>
                </View>
                <Text style={styles.productStock}>Stock: {product.stockQuantity}</Text>
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
        <Text style={styles.sectionTitle}>Nouvelle Vente</Text>
        
        {/* Customer Info */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Nom du client (optionnel)</Text>
          <TextInput
            ref={customerNameRef}
            style={styles.input}
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="Nom du client"
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
          <Text style={styles.formLabel}>Méthode de paiement</Text>
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
                  {method === 'CASH' ? 'Espèces' : method === 'CARD' ? 'Carte' : 'Virement'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Add Product */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Ajouter un produit</Text>
          <TouchableOpacity
            style={styles.addProductButton}
            onPress={() => setShowProductSelector(true)}
          >
            <Text style={styles.addProductButtonText}>
              {selectedProduct ? selectedProduct.name : 'Sélectionner un produit'}
            </Text>
          </TouchableOpacity>
          
          {selectedProduct && (
            <View style={styles.quantitySection}>
              <Text style={styles.formLabel}>Quantité</Text>
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
                  <Text style={styles.addItemButtonText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Sale Items */}
        {saleItems.length > 0 && (
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Articles de la vente</Text>
            {saleItems.map((item, index) => (
              <View key={index} style={styles.saleItemRow}>
                <View style={styles.saleItemInfo}>
                  <Text style={styles.saleItemName}>{item.productName}</Text>
                  <Text style={styles.saleItemDetails}>
                    {item.quantity} x {formatCurrency(item.unitPrice)} = {formatCurrency(item.totalPrice)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeItemButton}
                  onPress={() => removeItemFromSale(item.productId)}
                >
                  <Text style={styles.removeItemButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            <View style={styles.totalSection}>
              <Text style={styles.totalText}>Total: {formatCurrency(getTotalAmount())}</Text>
            </View>
          </View>
        )}

        {/* Create Sale Button */}
        <TouchableOpacity
          style={[styles.createSaleButton, saleItems.length === 0 && styles.createSaleButtonDisabled]}
          onPress={handleCreateSale}
          disabled={saleItems.length === 0}
        >
          <Text style={styles.createSaleButtonText}>Créer la Vente</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saleItemInfo: {
    flex: 1,
  },
  saleItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  saleItemDetails: {
    fontSize: 12,
    color: '#666',
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
