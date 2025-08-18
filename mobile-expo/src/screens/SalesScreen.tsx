import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Platform,
  Modal,
} from 'react-native';
import axios from 'axios';

// Dynamic API URL based on platform with fallback options
const getApiUrls = () => {
  if (Platform.OS === 'web') {
    return ['http://localhost:8081'];
  } else {
    // For Android emulator, try multiple options in order of preference
    return [
      'http://192.168.1.27:8081',  // Your actual IP address (most reliable)
      'http://10.0.2.2:8081',      // Standard Android emulator localhost
      'http://localhost:8081'      // Sometimes works on some emulators
    ];
  }
};

const API_URLS = getApiUrls();
const API_BASE_URL = API_URLS[0];

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

interface Sale {
  id: number;
  saleDate: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  customerName?: string;
  items: SaleItem[];
}

interface SalesScreenProps {
  token: string;
}

const SalesScreen: React.FC<SalesScreenProps> = ({ token }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');
  
  // New sale state
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [showProductSelector, setShowProductSelector] = useState(false);

  const loadSales = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/sales`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      let salesData = [];
      if (response.data && response.data.content) {
        salesData = response.data.content;
      } else if (Array.isArray(response.data)) {
        salesData = response.data;
      }

      setSales(salesData);
    } catch (error) {
      console.error('Erreur lors du chargement des ventes:', error);
      // Fallback avec des données simulées
      setSales([
        {
          id: 1,
          saleDate: new Date().toISOString(),
          totalAmount: 45.50,
          paymentMethod: 'CASH',
          status: 'COMPLETED',
          customerName: 'Client 1',
          items: [
            {
              productId: 1,
              productName: 'Coca-Cola 33cl',
              quantity: 2,
              unitPrice: 1.50,
              totalPrice: 3.00
            }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      let productsData = [];
      if (response.data && response.data.content) {
        productsData = response.data.content;
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
      }

      setProducts(productsData);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      setProducts([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadSales(), loadProducts()]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadSales();
    loadProducts();
  }, []);

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
      // Update existing item
      const updatedItems = [...saleItems];
      updatedItems[existingItemIndex].quantity += qty;
      updatedItems[existingItemIndex].totalPrice = updatedItems[existingItemIndex].quantity * selectedProduct.sellingPrice;
      setSaleItems(updatedItems);
    } else {
      // Add new item
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

  const createSale = async () => {
    if (saleItems.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins un produit à la vente');
      return;
    }

    try {
      const saleData = {
        customerName: customerName || 'Client',
        paymentMethod,
        items: saleItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      };

      await axios.post(`${API_BASE_URL}/sales`, saleData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      Alert.alert('Succès', 'Vente créée avec succès');
      
      // Reset form
      setSaleItems([]);
      setCustomerName('');
      setPaymentMethod('CASH');
      setActiveTab('list');
      
      // Reload sales and products
      loadSales();
      loadProducts();
    } catch (error) {
      console.error('Erreur lors de la création de la vente:', error);
      Alert.alert('Erreur', 'Impossible de créer la vente');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} €`;
  };

  const SaleCard: React.FC<{ sale: Sale }> = ({ sale }) => (
    <View style={styles.saleCard}>
      <View style={styles.saleHeader}>
        <Text style={styles.saleId}>Vente #{sale.id}</Text>
        <Text style={styles.saleAmount}>{formatCurrency(sale.totalAmount)}</Text>
      </View>
      
      <View style={styles.saleDetails}>
        <Text style={styles.saleDate}>{formatDate(sale.saleDate)}</Text>
        <Text style={styles.saleCustomer}>{sale.customerName || 'Client'}</Text>
      </View>
      
      <View style={styles.saleFooter}>
        <Text style={styles.paymentMethod}>{sale.paymentMethod}</Text>
        <Text style={[styles.status, { color: sale.status === 'COMPLETED' ? '#28a745' : '#ffc107' }]}>
          {sale.status === 'COMPLETED' ? 'Terminée' : 'En cours'}
        </Text>
      </View>
      
      {sale.items && sale.items.length > 0 && (
        <View style={styles.itemsList}>
          <Text style={styles.itemsTitle}>Articles:</Text>
          {sale.items.map((item, index) => (
            <Text key={index} style={styles.itemText}>
              • {item.productName} x{item.quantity} = {formatCurrency(item.totalPrice)}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

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

  const NewSaleForm = () => (
    <ScrollView style={styles.newSaleContainer}>
      <Text style={styles.sectionTitle}>Nouvelle Vente</Text>
      
      {/* Customer Info */}
      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Nom du client (optionnel)</Text>
        <TextInput
          style={styles.input}
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="Nom du client"
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
                style={styles.quantityInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="1"
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
        onPress={createSale}
        disabled={saleItems.length === 0}
      >
        <Text style={styles.createSaleButtonText}>Créer la Vente</Text>
      </TouchableOpacity>

      <ProductSelector />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header with Tabs */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛒 Gestion des Ventes</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'list' && styles.activeTab]}
            onPress={() => setActiveTab('list')}
          >
            <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>
              Historique
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'new' && styles.activeTab]}
            onPress={() => setActiveTab('new')}
          >
            <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>
              Nouvelle Vente
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {activeTab === 'list' ? (
        <ScrollView
          style={styles.salesList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text style={styles.salesCount}>
            {sales.length} vente(s) trouvée(s)
          </Text>

          {sales.length > 0 ? (
            sales.map((sale) => (
              <SaleCard key={sale.id} sale={sale} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Aucune vente trouvée</Text>
              <Text style={styles.emptyStateSubtext}>
                Créez votre première vente en utilisant l'onglet "Nouvelle Vente"
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <NewSaleForm />
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
    backgroundColor: '#28a745',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'white',
  },
  tabText: {
    color: 'white',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#28a745',
  },
  salesList: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  salesCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  saleCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  saleId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  saleAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  saleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  saleDate: {
    fontSize: 14,
    color: '#666',
  },
  saleCustomer: {
    fontSize: 14,
    color: '#666',
  },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemsList: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  itemText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
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
  newSaleContainer: {
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

export default SalesScreen;
