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
import saleService, { SaleRequest, PaymentMethod } from '../services/saleService';
import apiClient from '../services/apiClient';
import { receiptService } from '../services/receiptService';
import NewSaleForm from '../components/NewSaleForm';
import BarcodeScanner from '../components/BarcodeScanner';
// import CreateReceiptButton from '../components/CreateReceiptButton';

interface Product {
  id: number;
  name: string;
  sellingPrice: number;
  stockQuantity: number;
  category: string;
  unit: string;
  barcode: string;
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
  saleNumber?: string;
  saleDate: string;
  totalAmount: number;
  finalAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  paymentMethod: string;
  status: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
  saleItems?: SaleItem[];
  totalProfit?: number;
  totalQuantity?: number;
  // Support for legacy field name
  items?: SaleItem[];
}

interface SalesScreenProps {
  token: string;
}

const SalesScreen: React.FC<SalesScreenProps> = ({ token }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);

  const loadSales = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/sales');

      console.log('🔍 Raw sales response:', JSON.stringify(response.data, null, 2));

      let salesData = [];
      if (response.data && response.data.content) {
        salesData = response.data.content;
      } else if (Array.isArray(response.data)) {
        salesData = response.data;
      }

      console.log('📊 Processed sales data:', JSON.stringify(salesData, null, 2));

      // Log each sale to understand the structure
      salesData.forEach((sale: any, index: number) => {
        console.log(`📋 Sale ${index + 1}:`, {
          id: sale.id,
          totalAmount: sale.totalAmount,
          finalAmount: sale.finalAmount,
          saleItems: sale.saleItems,
          items: sale.items
        });
      });

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
      const response = await apiClient.get('/products');

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

  const handleCreateSale = async (saleData: {
    customerName: string;
    paymentMethod: string;
    saleItems: SaleItem[];
  }) => {
    try {
      const requestData: SaleRequest = {
        customerName: saleData.customerName || undefined,
        paymentMethod: saleData.paymentMethod as PaymentMethod,
        saleDate: new Date().toISOString(),
        saleItems: saleData.saleItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: 0
        }))
      };

      await saleService.createSale(requestData);

      Alert.alert('Succès', 'Vente créée avec succès');
      
      // Switch to list tab and reload data
      setActiveTab('list');
      loadSales();
      loadProducts();
      setScannedProduct(null); // Réinitialiser le produit scanné
    } catch (error) {
      console.error('Erreur lors de la création de la vente:', error);
      Alert.alert('Erreur', 'Impossible de créer la vente');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '0.00 €';
    }
    return `${Number(amount).toFixed(2)} €`;
  };

  const SaleCard: React.FC<{ sale: Sale }> = ({ sale }) => {
    // Calculate total from items if totalAmount is not available
    const calculateTotalFromItems = () => {
      const items = sale.saleItems || sale.items || [];
      return items.reduce((total, item) => {
        const itemTotal = item.totalPrice || (item.unitPrice * item.quantity) || 0;
        return total + itemTotal;
      }, 0);
    };

    const displayAmount = sale.totalAmount || sale.finalAmount || calculateTotalFromItems();
    
    return (
      <View style={styles.saleCard}>
        <View style={styles.saleHeader}>
          <Text style={styles.saleId}>Vente #{sale.id}</Text>
          <Text style={styles.saleAmount}>{formatCurrency(displayAmount)}</Text>
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
        
        {/* Bouton de génération de reçu - VERSION 2.0 */}
        <View style={styles.receiptSection}>
          <TouchableOpacity
            style={styles.receiptButton}
            onPress={() => {
              console.log('🔍 Bouton reçu cliqué pour la vente:', sale.id);
              Alert.alert(
                '✅ Reçu - Version 2.0',
                `Générer un reçu pour la vente ${sale.id}?\n\nModifications prises en compte !`,
                [
                  { text: 'Annuler', style: 'cancel' },
                  { 
                    text: 'Générer', 
                    onPress: async () => {
                      try {
                        console.log('🔄 Début de la création du reçu pour la vente:', sale.id);
                        
                        // Appeler le service de création de reçu
                        const receipt = await receiptService.createReceipt(sale.id);
                        
                        console.log('✅ Reçu créé avec succès:', receipt);
                        
                        Alert.alert(
                          '✅ Reçu créé avec succès',
                          `Le reçu ${receipt.receiptNumber} a été généré pour la vente ${sale.id}.\n\nMontant: ${receipt.finalAmount}€\nDate: ${new Date(receipt.createdAt).toLocaleDateString('fr-FR')}`,
                          [
                            {
                              text: 'Voir les reçus',
                              onPress: () => {
                                // Optionnel: naviguer vers l'écran des reçus
                                console.log('Aller à l\'écran des reçus');
                              },
                            },
                            { text: 'OK' },
                          ]
                        );
                      } catch (error: any) {
                        console.error('❌ Erreur création reçu:', error);
                        
                        // Message d'erreur plus détaillé
                        let errorMessage = 'Impossible de créer le reçu';
                        if (error.message) {
                          errorMessage = error.message;
                        } else if (error.response?.data?.error) {
                          errorMessage = error.response.data.error;
                        } else if (error.response?.status) {
                          errorMessage = `Erreur serveur (${error.response.status})`;
                        }
                        
                        Alert.alert(
                          '❌ Erreur de création',
                          `${errorMessage}\n\nVente ID: ${sale.id}\nVérifiez que la vente existe et que vous avez les permissions nécessaires.`,
                          [{ text: 'OK' }]
                        );
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.receiptButtonText}>🧾 Générer Reçu v2.0</Text>
          </TouchableOpacity>
        </View>
        
        {((sale.saleItems && sale.saleItems.length > 0) || (sale.items && sale.items.length > 0)) && (
          <View style={styles.itemsList}>
            <Text style={styles.itemsTitle}>Articles:</Text>
            {(sale.saleItems || sale.items || []).map((item, index) => (
              <Text key={index} style={styles.itemText}>
                • {item.productName} x{item.quantity} = {formatCurrency(item.totalPrice || (item.unitPrice * item.quantity))}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };


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
            onPress={() => {
              setActiveTab('new');
              setScannedProduct(null); // Réinitialiser le produit scanné lors du changement d'onglet
            }}
          >
            <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>
              Nouvelle Vente
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scanner Button for New Sale */}
      {activeTab === 'new' && (
        <View style={styles.scannerButtonContainer}>
          <TouchableOpacity
            style={styles.scannerButton}
            onPress={() => setShowScanner(true)}
          >
            <Text style={styles.scannerButtonText}>🔍 Scanner un Produit</Text>
          </TouchableOpacity>
        </View>
      )}

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
        <NewSaleForm 
          products={products} 
          onCreateSale={handleCreateSale} 
          preselectedProduct={scannedProduct}
        />
      )}

      {/* Scanner de code-barres pour les ventes */}
      <BarcodeScanner
        isVisible={showScanner}
        onScan={(scannedBarcode) => {
          setShowScanner(false);
          const foundProduct = products.find(p => p.barcode === scannedBarcode);
          if (foundProduct) {
            setScannedProduct(foundProduct);
            Alert.alert(
              'Produit trouvé',
              `${foundProduct.name} - ${foundProduct.sellingPrice}€`,
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert(
              'Produit non trouvé',
              `Aucun produit avec le code-barres: ${scannedBarcode}`
            );
          }
        }}
        onClose={() => setShowScanner(false)}
        title="Scanner un produit pour la vente"
      />
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
  receiptSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  receiptButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  scannerButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  scannerButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  scannerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SalesScreen;
