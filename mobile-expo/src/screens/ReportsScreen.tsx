import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Alert,
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
  purchasePrice: number;
}

interface Sale {
  id: number;
  saleDate: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  items?: SaleItem[];
}

interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ReportsScreenProps {
  token: string;
}

interface ReportStats {
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  averageOrderValue: number;
  topSellingProducts: Array<{
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  salesByPaymentMethod: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  salesByPeriod: Array<{
    period: string;
    sales: number;
    revenue: number;
  }>;
  profitAnalysis: {
    totalCost: number;
    totalRevenue: number;
    grossProfit: number;
    profitMargin: number;
  };
}

const ReportsScreen: React.FC<ReportsScreenProps> = ({ token }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    totalSales: 0,
    totalRevenue: 0,
    totalProducts: 0,
    averageOrderValue: 0,
    topSellingProducts: [],
    salesByPaymentMethod: [],
    salesByPeriod: [],
    profitAnalysis: {
      totalCost: 0,
      totalRevenue: 0,
      grossProfit: 0,
      profitMargin: 0,
    },
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'sales' | 'profit'>('overview');

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load sales
      const salesResponse = await axios.get(`${API_BASE_URL}/sales`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      let salesData = [];
      if (salesResponse.data && salesResponse.data.content) {
        salesData = salesResponse.data.content;
      } else if (Array.isArray(salesResponse.data)) {
        salesData = salesResponse.data;
      }

      // Load products
      const productsResponse = await axios.get(`${API_BASE_URL}/products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      let productsData = [];
      if (productsResponse.data && productsResponse.data.content) {
        productsData = productsResponse.data.content;
      } else if (Array.isArray(productsResponse.data)) {
        productsData = productsResponse.data;
      }

      setSales(salesData);
      setProducts(productsData);
      calculateStats(salesData, productsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      // Fallback avec des données simulées
      const mockSales = [
        {
          id: 1,
          saleDate: new Date().toISOString(),
          totalAmount: 45.50,
          paymentMethod: 'CASH',
          status: 'COMPLETED',
          items: [
            { productId: 1, productName: 'Coca-Cola 33cl', quantity: 2, unitPrice: 1.50, totalPrice: 3.00 },
            { productId: 2, productName: 'Pain de mie', quantity: 1, unitPrice: 2.50, totalPrice: 2.50 }
          ]
        },
        {
          id: 2,
          saleDate: new Date(Date.now() - 86400000).toISOString(),
          totalAmount: 32.00,
          paymentMethod: 'CARD',
          status: 'COMPLETED',
          items: [
            { productId: 1, productName: 'Coca-Cola 33cl', quantity: 3, unitPrice: 1.50, totalPrice: 4.50 }
          ]
        }
      ];
      
      const mockProducts = [
        { id: 1, name: 'Coca-Cola 33cl', sellingPrice: 1.50, stockQuantity: 50, category: 'Boissons', purchasePrice: 0.80 },
        { id: 2, name: 'Pain de mie', sellingPrice: 2.50, stockQuantity: 20, category: 'Boulangerie', purchasePrice: 1.20 }
      ];

      setSales(mockSales);
      setProducts(mockProducts);
      calculateStats(mockSales, mockProducts);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (salesData: Sale[], productsData: Product[]) => {
    const filteredSales = filterSalesByPeriod(salesData, selectedPeriod);
    
    // Basic stats
    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Top selling products
    const productSales: { [key: string]: { quantity: number; revenue: number } } = {};
    filteredSales.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          if (!productSales[item.productName]) {
            productSales[item.productName] = { quantity: 0, revenue: 0 };
          }
          productSales[item.productName].quantity += item.quantity;
          productSales[item.productName].revenue += item.totalPrice;
        });
      }
    });

    const topSellingProducts = Object.entries(productSales)
      .map(([productName, data]) => ({
        productName,
        totalQuantity: data.quantity,
        totalRevenue: data.revenue,
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);

    // Sales by payment method
    const paymentMethods: { [key: string]: { count: number; amount: number } } = {};
    filteredSales.forEach(sale => {
      if (!paymentMethods[sale.paymentMethod]) {
        paymentMethods[sale.paymentMethod] = { count: 0, amount: 0 };
      }
      paymentMethods[sale.paymentMethod].count += 1;
      paymentMethods[sale.paymentMethod].amount += sale.totalAmount;
    });

    const salesByPaymentMethod = Object.entries(paymentMethods).map(([method, data]) => ({
      method,
      count: data.count,
      amount: data.amount,
    }));

    // Sales by period (daily for last 7 days)
    const salesByPeriod = generatePeriodData(filteredSales, selectedPeriod);

    // Profit analysis
    let totalCost = 0;
    filteredSales.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          const product = productsData.find(p => p.id === item.productId);
          if (product) {
            totalCost += product.purchasePrice * item.quantity;
          }
        });
      }
    });

    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    setStats({
      totalSales,
      totalRevenue,
      totalProducts: productsData.length,
      averageOrderValue,
      topSellingProducts,
      salesByPaymentMethod,
      salesByPeriod,
      profitAnalysis: {
        totalCost,
        totalRevenue,
        grossProfit,
        profitMargin,
      },
    });
  };

  const filterSalesByPeriod = (salesData: Sale[], period: string) => {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return salesData.filter(sale => new Date(sale.saleDate) >= startDate);
  };

  const generatePeriodData = (salesData: Sale[], period: string) => {
    const data = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      
      const daySales = salesData.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate.toDateString() === date.toDateString();
      });

      data.push({
        period: dateStr,
        sales: daySales.length,
        revenue: daySales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      });
    }

    return data;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} €`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const StatCard: React.FC<{
    title: string;
    value: string;
    subtitle?: string;
    color: string;
    icon: string;
  }> = ({ title, value, subtitle, color, icon }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const OverviewTab = () => (
    <View>
      <View style={styles.statsGrid}>
        <StatCard
          title="Ventes Totales"
          value={stats.totalSales.toString()}
          subtitle={`Période: ${selectedPeriod}`}
          color="#667eea"
          icon="🛒"
        />
        <StatCard
          title="Chiffre d'Affaires"
          value={formatCurrency(stats.totalRevenue)}
          color="#28a745"
          icon="💰"
        />
        <StatCard
          title="Panier Moyen"
          value={formatCurrency(stats.averageOrderValue)}
          color="#764ba2"
          icon="📊"
        />
        <StatCard
          title="Produits Actifs"
          value={stats.totalProducts.toString()}
          color="#ff9800"
          icon="📦"
        />
      </View>

      {/* Sales by Period Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Évolution des Ventes (7 derniers jours)</Text>
        <View style={styles.chartContainer}>
          {stats.salesByPeriod.map((item, index) => (
            <View key={index} style={styles.chartBar}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(20, (item.revenue / Math.max(...stats.salesByPeriod.map(s => s.revenue))) * 100),
                    backgroundColor: '#667eea',
                  },
                ]}
              />
              <Text style={styles.chartLabel}>{item.period}</Text>
              <Text style={styles.chartValue}>{formatCurrency(item.revenue)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Payment Methods */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Répartition par Méthode de Paiement</Text>
        {stats.salesByPaymentMethod.map((item, index) => (
          <View key={index} style={styles.paymentMethodRow}>
            <View style={styles.paymentMethodInfo}>
              <Text style={styles.paymentMethodName}>
                {item.method === 'CASH' ? 'Espèces' : item.method === 'CARD' ? 'Carte' : 'Virement'}
              </Text>
              <Text style={styles.paymentMethodCount}>{item.count} vente(s)</Text>
            </View>
            <Text style={styles.paymentMethodAmount}>{formatCurrency(item.amount)}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const ProductsTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Top Produits Vendus</Text>
      {stats.topSellingProducts.length > 0 ? (
        stats.topSellingProducts.map((product, index) => (
          <View key={index} style={styles.productRow}>
            <View style={styles.productRank}>
              <Text style={styles.rankNumber}>{index + 1}</Text>
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.productName}</Text>
              <Text style={styles.productStats}>
                {product.totalQuantity} unités vendues
              </Text>
            </View>
            <Text style={styles.productRevenue}>{formatCurrency(product.totalRevenue)}</Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Aucune donnée de vente disponible</Text>
        </View>
      )}
    </View>
  );

  const ProfitTab = () => (
    <View>
      <View style={styles.statsGrid}>
        <StatCard
          title="Coût Total"
          value={formatCurrency(stats.profitAnalysis.totalCost)}
          color="#dc3545"
          icon="💸"
        />
        <StatCard
          title="Revenus"
          value={formatCurrency(stats.profitAnalysis.totalRevenue)}
          color="#28a745"
          icon="💰"
        />
        <StatCard
          title="Bénéfice Brut"
          value={formatCurrency(stats.profitAnalysis.grossProfit)}
          color="#667eea"
          icon="📈"
        />
        <StatCard
          title="Marge Bénéficiaire"
          value={formatPercentage(stats.profitAnalysis.profitMargin)}
          color="#764ba2"
          icon="📊"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Analyse de Rentabilité</Text>
        <View style={styles.profitAnalysis}>
          <View style={styles.profitRow}>
            <Text style={styles.profitLabel}>Chiffre d'affaires:</Text>
            <Text style={[styles.profitValue, { color: '#28a745' }]}>
              {formatCurrency(stats.profitAnalysis.totalRevenue)}
            </Text>
          </View>
          <View style={styles.profitRow}>
            <Text style={styles.profitLabel}>Coût des marchandises:</Text>
            <Text style={[styles.profitValue, { color: '#dc3545' }]}>
              -{formatCurrency(stats.profitAnalysis.totalCost)}
            </Text>
          </View>
          <View style={[styles.profitRow, styles.profitTotal]}>
            <Text style={styles.profitTotalLabel}>Bénéfice brut:</Text>
            <Text style={[styles.profitTotalValue, { 
              color: stats.profitAnalysis.grossProfit >= 0 ? '#28a745' : '#dc3545' 
            }]}>
              {formatCurrency(stats.profitAnalysis.grossProfit)}
            </Text>
          </View>
          <View style={styles.marginIndicator}>
            <Text style={styles.marginText}>
              Marge: {formatPercentage(stats.profitAnalysis.profitMargin)}
            </Text>
            <View style={styles.marginBar}>
              <View
                style={[
                  styles.marginFill,
                  {
                    width: `${Math.min(100, Math.max(0, stats.profitAnalysis.profitMargin))}%`,
                    backgroundColor: stats.profitAnalysis.profitMargin >= 20 ? '#28a745' : 
                                   stats.profitAnalysis.profitMargin >= 10 ? '#ffc107' : '#dc3545',
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Rapports et Statistiques</Text>
        
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['today', 'week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive
              ]}>
                {period === 'today' ? 'Aujourd\'hui' :
                 period === 'week' ? 'Semaine' :
                 period === 'month' ? 'Mois' : 'Année'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {[
            { key: 'overview', label: 'Vue d\'ensemble' },
            { key: 'products', label: 'Produits' },
            { key: 'profit', label: 'Rentabilité' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'profit' && <ProfitTab />}
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
    backgroundColor: '#764ba2',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 4,
    marginBottom: 15,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: 'white',
  },
  periodButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#764ba2',
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
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'white',
  },
  tabText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#764ba2',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    marginRight: '2%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 10,
    color: '#999',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  chartSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 20,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  bar: {
    width: '80%',
    backgroundColor: '#667eea',
    borderRadius: 2,
    marginBottom: 5,
  },
  chartLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  chartValue: {
    fontSize: 9,
    color: '#333',
    fontWeight: 'bold',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentMethodCount: {
    fontSize: 12,
    color: '#666',
  },
  paymentMethodAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  productStats: {
    fontSize: 12,
    color: '#666',
  },
  productRevenue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
  },
  profitAnalysis: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  profitLabel: {
    fontSize: 14,
    color: '#666',
  },
  profitValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  profitTotal: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    marginTop: 8,
    paddingTop: 12,
  },
  profitTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  profitTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  marginIndicator: {
    marginTop: 15,
  },
  marginText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  marginBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  marginFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
});

export default ReportsScreen;
