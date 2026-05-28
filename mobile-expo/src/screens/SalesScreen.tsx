import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import saleService, { SaleRequest, PaymentMethod } from '../services/saleService';
import apiClient from '../services/apiClient';
import { receiptService } from '../services/receiptService';
import NewSaleForm from '../components/NewSaleForm';
import BarcodeScanner from '../components/BarcodeScanner';
import UnknownBarcodeModal, { QuickProductFormData } from '../components/bluetooth/UnknownBarcodeModal';
import { formatPrice, formatDate } from '../utils/formatters';
import { registerSalesScanCallbacks } from '../hooks/scannerSaleBridge';
import { resolveSaleProductFromLocal } from '../utils/scannerSaleBridge';
import productDAO from '../dao/ProductDAO';
import { applyScannerSqlMigrations } from '../database/scannerSqlMigrations';
import { normalizeBarcode } from '../bluetooth/scannerUtils';
import { createQuickProduct } from '../services/scanner/scannerProductRepository';
import authService from '../services/authService';
import { LocalProduct } from '../types/localProduct';
import {
  playScanSuccessFeedback,
  playScanNotFoundFeedback,
} from '../bluetooth/scannerFeedback';
import { pendingProductSyncService } from '../services/scanner/PendingProductSyncService';
import NetworkService from '../services/network/NetworkService';
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
  barcode?: string;
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
  const { t, i18n } = useTranslation();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [unknownBarcode, setUnknownBarcode] = useState('');
  const [showUnknownModal, setShowUnknownModal] = useState(false);
  const [unknownPrefill, setUnknownPrefill] = useState<
    Partial<QuickProductFormData> | null
  >(null);
  const [pendingCartProduct, setPendingCartProduct] = useState<Product | null>(null);
  const productsRef = useRef(products);
  productsRef.current = products;
  const lastSaleScanRef = useRef<{ barcode: string; at: number } | null>(null);
  const saleScanInFlightRef = useRef(false);
  const lastSaleSuccessRef = useRef<{ barcode: string; at: number } | null>(null);

  const dismissUnknownModal = useCallback(() => {
    setShowUnknownModal(false);
    setUnknownBarcode('');
    setUnknownPrefill(null);
  }, []);

  const addToCartAndNotify = useCallback(
    (product: Product) => {
      dismissUnknownModal();
      setActiveTab('new');
      setPendingCartProduct(product);
      Alert.alert(t('common.success'), t('bluetooth.scan_success'));
    },
    [dismissUnknownModal, t]
  );

  const openUnknownProductModal = useCallback(async (barcode: string) => {
    const trimmed = normalizeBarcode(barcode);
    const recentSuccess = lastSaleSuccessRef.current;
    if (
      recentSuccess &&
      Date.now() - recentSuccess.at < 3000 &&
      (recentSuccess.barcode === trimmed ||
        trimmed.startsWith(recentSuccess.barcode) ||
        recentSuccess.barcode.startsWith(trimmed))
    ) {
      return;
    }

    const fromCatalog = productsRef.current.find((p) => p.barcode?.trim() === trimmed);
    if (fromCatalog?.id) {
      addToCartAndNotify(fromCatalog);
      return;
    }

    console.log('[SalesScreen] Produit inconnu, ouverture modal:', trimmed);
    setActiveTab('new');
    setUnknownBarcode(trimmed);
    try {
      const user = authService.getUser();
      const local = await productDAO.findByBarcode(trimmed, user ? String(user.id) : undefined);
      if (local) {
        setUnknownPrefill({
          name: local.name,
          sellingPrice: Number(local.price),
          stockQuantity: Number(local.stock_quantity ?? 1),
          expiryDate: local.expiration_date ?? undefined,
          category: local.category ?? undefined,
        });
      } else {
        setUnknownPrefill(null);
      }
    } catch (e) {
      setUnknownPrefill(null);
    }
    setShowUnknownModal(true);
  }, [addToCartAndNotify]);

  const loadProducts = useCallback(async (): Promise<Product[]> => {
    try {
      const response = await apiClient.get('/products');

      let productsData: Product[] = [];
      if (response.data && response.data.content) {
        productsData = response.data.content;
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
      }

      setProducts(productsData);
      productsRef.current = productsData;
      return productsData;
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      setProducts([]);
      productsRef.current = [];
      return [];
    }
  }, []);

  /** Résolution unique : catalogue API → SQLite → création rapide (évite double modal). */
  const processSaleBarcode = useCallback(
    async (barcode: string, localHint: LocalProduct | null = null) => {
      const trimmed = normalizeBarcode(barcode);
      if (!trimmed) {
        return;
      }

      if (saleScanInFlightRef.current) {
        return;
      }

      const now = Date.now();
      const last = lastSaleScanRef.current;
      if (last && now - last.at < 1500) {
        return;
      }
      lastSaleScanRef.current = { barcode: trimmed, at: now };
      saleScanInFlightRef.current = true;

      let catalog = productsRef.current;
      const fromCatalog = catalog.find((p) => p.barcode?.trim() === trimmed);
      if (fromCatalog?.id) {
        void playScanSuccessFeedback();
        lastSaleSuccessRef.current = { barcode: trimmed, at: Date.now() };
        addToCartAndNotify(fromCatalog);
        return;
      }

      /**
       * Règle POS:
       * - Pour une vente, la "liste des produits" fait foi (catalogue backend).
       * - Si le produit n'existe pas encore côté backend, on ouvre immédiatement le modal
       *   "Produit inconnu" (même s'il existe en SQLite local).
       *
       * Ça évite le flux actuel où l'erreur 400 n'apparaît qu'au moment du POST /sales.
       */
      void playScanNotFoundFeedback();
      void openUnknownProductModal(trimmed);
    },
    [addToCartAndNotify, dismissUnknownModal, loadProducts, openUnknownProductModal, t]
  );

  const processSaleBarcodeSafe = useCallback(
    async (barcode: string, localHint: LocalProduct | null = null) => {
      try {
        await processSaleBarcode(barcode, localHint);
      } finally {
        saleScanInFlightRef.current = false;
      }
    },
    [processSaleBarcode]
  );

  useEffect(() => {
    registerSalesScanCallbacks({
      onBarcodeResolved: (barcode, local) => {
        void processSaleBarcodeSafe(barcode, local);
      },
      onScanError: (message) => Alert.alert(t('common.error'), message),
    });
    return () => registerSalesScanCallbacks(null);
  }, [processSaleBarcodeSafe, t]);

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

  const handleQuickCreateProduct = async (data: QuickProductFormData) => {
    const user = authService.getUser();
    if (!user) {
      Alert.alert(t('common.error'), t('errors.authFailed'));
      return;
    }

    try {
      const local = await createQuickProduct(data, String(user.id));
      // Ne ferme pas le modal tant que la sync n'a pas réussi (sinon en cas de 409
      // on perd le contexte et on affiche une erreur globale).

      let catalog = await loadProducts();
      let saleProduct = resolveSaleProductFromLocal(local, catalog);

      if (NetworkService.isOnline()) {
        const syncResult = await pendingProductSyncService.syncAll();
        if (syncResult.failed > 0) {
          const conflict = syncResult.errors.find(
            (e) => e.includes('Erreur 409') || e.toLowerCase().includes('code-barres existe déjà')
          );
          if (conflict) {
            // Propagé au modal "Produit inconnu" qui proposera un nouveau code-barres.
            throw new Error(conflict.replace(/^[^:]+:\s*/, ''));
          }
        }
        if (syncResult.synced > 0) {
          catalog = await loadProducts();
          saleProduct = resolveSaleProductFromLocal(local, catalog);
        }
      }

      const addedToCart = Boolean(saleProduct?.id);
      if (addedToCart && saleProduct) {
        setShowUnknownModal(false);
        setUnknownBarcode('');
        dismissUnknownModal();
        setActiveTab('new');
        setPendingCartProduct(saleProduct as Product);
      }

      Alert.alert(
        t('common.success'),
        addedToCart ? t('bluetooth.scan_success') : t('bluetooth.product_created')
      );
    } catch (error) {
      console.error('Erreur création produit rapide:', error);
      // Les erreurs (409 code-barres, etc.) sont gérées dans le modal.
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
          barcode: item.barcode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: 0
        }))
      };

      await saleService.createSale(requestData);

      Alert.alert(t('common.success'), t('sales.saleCreated'));
      
      // Switch to list tab and reload data
      setActiveTab('list');
      loadSales();
      loadProducts();
      setScannedProduct(null); // Réinitialiser le produit scanné
    } catch (error: any) {
      console.error('Erreur lors de la création de la vente:', error);
      const message = String(error?.message || '');
      if (message.includes('Product not found')) {
        const match = message.match(/barcode='([^']+)'/);
        const fallbackBarcode = saleData.saleItems.find((i) => i.barcode)?.barcode;
        const barcode = match?.[1] || fallbackBarcode || '';
        if (barcode) {
          void openUnknownProductModal(barcode);
          return;
        }
      }
      Alert.alert(t('common.error'), t('sales.saleError'));
    }
  };

  const formatDateLocal = (dateString: string) => {
    const date = new Date(dateString);
    return formatDate(date, i18n.language);
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return formatPrice(0, i18n.language);
    }
    return formatPrice(amount, i18n.language);
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
          <Text style={styles.saleId}>{t('sales.sale')} #{sale.id}</Text>
          <Text style={styles.saleAmount}>{formatCurrency(displayAmount)}</Text>
        </View>
        
        <View style={styles.saleDetails}>
          <Text style={styles.saleDate}>{formatDateLocal(sale.saleDate)}</Text>
          <Text style={styles.saleCustomer}>{sale.customerName || t('sales.customer')}</Text>
        </View>
        
        <View style={styles.saleFooter}>
          <Text style={styles.paymentMethod}>{sale.paymentMethod}</Text>
          <Text style={[styles.status, { color: sale.status === 'COMPLETED' ? '#28a745' : '#ffc107' }]}>
            {sale.status === 'COMPLETED' ? t('sales.status.completed') : t('sales.status.inProgress')}
          </Text>
        </View>
        
        {/* Bouton de génération de reçu - VERSION 2.0 */}
        <View style={styles.receiptSection}>
          <TouchableOpacity
            style={styles.receiptButton}
            onPress={() => {
              console.log('🔍 Bouton reçu cliqué pour la vente:', sale.id);
              Alert.alert(
                t('sales.receipt.confirmTitle'),
                t('sales.receipt.confirmMessage', { saleId: sale.id }),
                [
                  { text: t('sales.receipt.cancel'), style: 'cancel' },
                  { 
                    text: t('sales.receipt.generate'), 
                    onPress: async () => {
                      try {
                        console.log('🔄 Début de la création du reçu pour la vente:', sale.id);
                        
                        // Appeler le service de création de reçu
                        const receipt = await receiptService.createReceipt(sale.id);
                        
                        console.log('✅ Reçu créé avec succès:', receipt);
                        
                        // Vérifier que le reçu a été créé correctement
                        if (!receipt) {
                          throw new Error('Reçu non retourné par le serveur');
                        }
                        
                        if (!receipt.receiptNumber) {
                          throw new Error('Reçu créé sans numéro de reçu');
                        }
                        
                        Alert.alert(
                          t('sales.receipt.successTitle'),
                          t('sales.receipt.successMessage', { 
                            receiptNumber: receipt.receiptNumber,
                            saleId: sale.id,
                            amount: receipt.finalAmount,
                            date: new Date(receipt.createdAt).toLocaleDateString(i18n.language === 'pt' ? 'pt-PT' : 'fr-FR')
                          }),
                          [
                            {
                              text: t('sales.receipt.viewReceipts'),
                              onPress: () => {
                                // Optionnel: naviguer vers l'écran des reçus
                                console.log('Aller à l\'écran des reçus');
                              },
                            },
                            { text: t('common.ok') },
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
                          t('sales.receipt.errorTitle'),
                          t('sales.receipt.errorMessage', { 
                            errorMessage: errorMessage,
                            saleId: sale.id 
                          }),
                          [{ text: t('common.ok') }]
                        );
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.receiptButtonText}>🧾 {t('sales.generateReceipt')}</Text>
          </TouchableOpacity>
        </View>
        
        {((sale.saleItems && sale.saleItems.length > 0) || (sale.items && sale.items.length > 0)) && (
          <View style={styles.itemsList}>
            <Text style={styles.itemsTitle}>{t('sales.items')}:</Text>
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
        <Text style={styles.headerTitle}>🛒 {t('sales.title')}</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'list' && styles.activeTab]}
            onPress={() => setActiveTab('list')}
          >
            <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>
              {t('sales.history')}
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
              {t('sales.newSale')}
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
            <Text style={styles.scannerButtonText}>🔍 {t('sales.scanProduct')}</Text>
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
            {sales.length} {t('sales.salesFound')}
          </Text>

          {sales.length > 0 ? (
            sales.map((sale) => (
              <SaleCard key={sale.id} sale={sale} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{t('sales.noSalesFound')}</Text>
              <Text style={styles.emptyStateSubtext}>
                {t('sales.createFirstSale')}
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <NewSaleForm 
          products={products} 
          onCreateSale={handleCreateSale} 
          preselectedProduct={scannedProduct}
          pendingCartProduct={pendingCartProduct}
          onPendingCartProductHandled={() => setPendingCartProduct(null)}
        />
      )}

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

      {/* Scanner de code-barres pour les ventes */}
      <BarcodeScanner
        isVisible={showScanner}
        onScan={(scannedBarcode) => {
          setShowScanner(false);
          void processSaleBarcodeSafe(scannedBarcode);
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
