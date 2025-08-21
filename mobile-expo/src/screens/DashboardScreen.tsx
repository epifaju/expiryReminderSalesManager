import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import productService from '../services/productService';
import { reportService } from '../services/reportService';

interface Product {
  id: number;
  name: string;
  stockQuantity: number;
  minStockLevel: number;
  sellingPrice: number;
  category: string;
}

interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  subtotal?: number;
  productPurchasePrice?: number;
  discount?: number;
}

interface Sale {
  id: number;
  saleDate: string;
  totalAmount?: number;
  finalAmount?: number;
  customerName?: string;
  paymentMethod?: string;
  status?: string;
  saleItems?: SaleItem[];
  items?: SaleItem[]; // Legacy support
}

interface DashboardStats {
  todaySales: number;
  totalProducts: number;
  monthlyRevenue: number;
  lowStock: number;
  expiringProducts: number;
  expiredProducts: number;
}

interface ActivityItem {
  id: string;
  type: 'sale' | 'product' | 'stock_alert' | 'expiry';
  icon: string;
  text: string;
  timestamp: Date;
}

interface DashboardScreenProps {
  token: string;
  onNavigate: (tab: 'dashboard' | 'products' | 'sales' | 'reports' | 'expiring' | 'settings') => void;
  isActive?: boolean; // Nouveau prop pour savoir si l'écran est actif
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ token, onNavigate, isActive = true }) => {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    totalProducts: 0,
    monthlyRevenue: 0,
    lowStock: 0,
    expiringProducts: 0,
    expiredProducts: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fonction pour formater les montants monétaires
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;
    
    return date.toLocaleDateString('fr-FR');
  };

  const loadDashboardData = async () => {
    try {
      // Charger les données réelles depuis l'API
      const [products, sales, expiringProducts, expiredProducts] = await Promise.all([
        productService.getProducts(),
        reportService.getSales(),
        productService.getExpiringProducts(7), // Produits expirant dans 7 jours
        productService.getExpiredProducts()
      ]);

      // Calculer les ventes d'aujourd'hui - nombre de produits vendus, pas nombre de transactions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaySales = sales.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        saleDate.setHours(0, 0, 0, 0);
        return saleDate.getTime() === today.getTime();
      });

      // Calculer le nombre total de produits vendus aujourd'hui
      const todayProductsSold = todaySales.reduce((total, sale) => {
        const items = sale.saleItems || sale.items || [];
        const saleQuantity = items.reduce((saleTotal, item) => {
          return saleTotal + (item.quantity || 0);
        }, 0);
        return total + saleQuantity;
      }, 0);

      console.log('📊 Dashboard - Calculs des ventes aujourd\'hui:', {
        totalSalesTransactions: todaySales.length,
        totalProductsSold: todayProductsSold,
        expiringProductsCount: expiringProducts.length,
        expiredProductsCount: expiredProducts.length,
        todaySalesDetails: todaySales.map(sale => ({
          id: sale.id,
          items: sale.saleItems || sale.items || [],
          itemCount: (sale.saleItems || sale.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)
        }))
      });

      // Calculer les statistiques basées sur les données réelles
      const lowStockProducts = products.filter((p: Product) => p.stockQuantity < p.minStockLevel);
      
      // Calculer les revenus du mois avec une meilleure précision
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Filtrer les ventes du mois courant
      const monthlySales = sales.filter(sale => {
        if (!sale.saleDate) return false;
        const saleDate = new Date(sale.saleDate);
        // Vérifier que la date est valide
        if (isNaN(saleDate.getTime())) return false;
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
      });

      // Calculer le revenu total du mois
      const monthlyRevenue = monthlySales.reduce((sum, sale) => {
        // Prioriser finalAmount, puis totalAmount, en s'assurant que c'est un nombre valide
        let amount = 0;
        if (typeof sale.finalAmount === 'number' && !isNaN(sale.finalAmount)) {
          amount = sale.finalAmount;
        } else if (typeof sale.totalAmount === 'number' && !isNaN(sale.totalAmount)) {
          amount = sale.totalAmount;
        }
        return sum + amount;
      }, 0);

      console.log('💰 Dashboard - Calcul des revenus du mois:', {
        currentMonth: currentMonth + 1, // +1 car getMonth() retourne 0-11
        currentYear,
        totalSales: sales.length,
        monthlySalesCount: monthlySales.length,
        monthlyRevenue,
        monthlySalesDetails: monthlySales.map(sale => ({
          id: sale.id,
          date: sale.saleDate,
          finalAmount: sale.finalAmount,
          totalAmount: sale.totalAmount,
          usedAmount: sale.finalAmount || sale.totalAmount || 0
        }))
      });

      // Générer l'activité récente basée sur les données réelles
      const activity: ActivityItem[] = [];

      // Ajouter les ventes récentes (dernières 48h)
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const recentSales = sales
        .filter(sale => {
          const saleDate = new Date(sale.saleDate);
          return saleDate >= twoDaysAgo;
        })
        .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
        .slice(0, 3); // Prendre les 3 ventes les plus récentes

      recentSales.forEach((sale: Sale, index: number) => {
        const amount = sale.finalAmount || sale.totalAmount || 0;
        const customerName = sale.customerName || 'Client';
        activity.push({
          id: `sale-${sale.id}`,
          type: 'sale',
          icon: '🛒',
          text: `Vente #${sale.id} - ${formatCurrency(amount)} - ${customerName}`,
          timestamp: new Date(sale.saleDate)
        });
      });

      // Ajouter les alertes de stock faible
      lowStockProducts.slice(0, 2).forEach((product: Product, index: number) => {
        activity.push({
          id: `stock-${product.id}`,
          type: 'stock_alert',
          icon: '⚠️',
          text: `Stock faible: ${product.name} (${product.stockQuantity} unités)`,
          timestamp: new Date(Date.now() - (index + 1) * 3600000) // Simuler des timestamps échelonnés
        });
      });

      // Ajouter les produits expirants
      expiringProducts.slice(0, 2).forEach((product: Product, index: number) => {
        activity.push({
          id: `expiring-${product.id}`,
          type: 'expiry',
          icon: '⏰',
          text: `Expire bientôt: ${product.name}`,
          timestamp: new Date(Date.now() - (index + 3) * 3600000) // Simuler des timestamps échelonnés
        });
      });

      // Trier par timestamp décroissant et prendre les 5 plus récents
      const sortedActivity = activity
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);

      setRecentActivity(sortedActivity);
      
      setStats({
        todaySales: todayProductsSold, // Nombre de produits vendus aujourd'hui, pas nombre de transactions
        totalProducts: products.length,
        monthlyRevenue: Math.round(monthlyRevenue),
        lowStock: lowStockProducts.length,
        expiringProducts: expiringProducts.length,
        expiredProducts: expiredProducts.length,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      // Fallback vers des données simulées en cas d'erreur
      setStats({
        todaySales: 0,
        totalProducts: 0,
        monthlyRevenue: 0,
        lowStock: 0,
        expiringProducts: 0,
        expiredProducts: 0,
      });
      setRecentActivity([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Effet pour recharger les données quand l'écran devient actif
  useEffect(() => {
    if (isActive) {
      console.log('🔄 Dashboard devient actif - rechargement des données...');
      loadDashboardData();
    }
  }, [isActive]);

  // Fonctions pour les actions rapides
  const handleNewSale = () => {
    onNavigate('sales');
  };

  const handleAddProduct = () => {
    onNavigate('products');
  };

  const handleViewReports = () => {
    onNavigate('reports');
  };

  const handleStockAlerts = async () => {
    try {
      const products = await productService.getProducts();

      const lowStockProducts = products.filter((p: Product) => p.stockQuantity < p.minStockLevel);
      
      if (lowStockProducts.length === 0) {
        Alert.alert('Alertes Stock', 'Aucun produit en stock faible pour le moment.');
      } else {
        const alertMessage = lowStockProducts
          .map((p: Product) => `• ${p.name}: ${p.stockQuantity} unités (min: ${p.minStockLevel})`)
          .join('\n');
        
        Alert.alert(
          'Alertes Stock',
          `${lowStockProducts.length} produit(s) en stock faible:\n\n${alertMessage}`,
          [
            { text: 'OK', style: 'default' },
            { text: 'Voir Produits', onPress: () => onNavigate('products') }
          ]
        );
      }
    } catch (error) {
      console.error('Erreur lors du chargement des alertes stock:', error);
      Alert.alert('Erreur', 'Impossible de charger les alertes stock');
    }
  };

  // Fonctions de navigation pour les cartes de statistiques
  const handleTodaySalesClick = () => {
    onNavigate('sales');
  };

  const handleProductsStockClick = () => {
    onNavigate('products');
  };

  const handleExpiringProductsClick = () => {
    onNavigate('expiring');
  };

  const handleExpiredProductsClick = () => {
    onNavigate('expiring');
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    color: string;
    onPress?: () => void;
  }> = ({title, value, color, onPress}) => (
    <TouchableOpacity 
      style={[styles.statCard, {borderLeftColor: color}]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {onPress && (
        <Text style={styles.clickHint}>Appuyez pour voir</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🛍️ Sales Manager</Text>
          <Text style={styles.headerSubtitle}>
            Tableau de bord - Gestion de ventes et stock
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard
              title="📊 Ventes Aujourd'hui"
              value={stats.todaySales}
              color="#667eea"
              onPress={handleTodaySalesClick}
            />
            <StatCard
              title="📦 Produits en Stock"
              value={stats.totalProducts}
              color="#28a745"
              onPress={handleProductsStockClick}
            />
          </View>

          <View style={styles.statsRow}>
            <StatCard
              title="💰 Revenus du Mois"
              value={formatCurrency(stats.monthlyRevenue)}
              color="#764ba2"
            />
            <StatCard
              title="⚠️ Stock Faible"
              value={stats.lowStock}
              color="#ffc107"
            />
          </View>

          <View style={styles.statsRow}>
            <StatCard
              title="⏰ Produits Expirants"
              value={stats.expiringProducts}
              color="#ff9800"
              onPress={handleExpiringProductsClick}
            />
            <StatCard
              title="❌ Produits Expirés"
              value={stats.expiredProducts}
              color="#dc3545"
              onPress={handleExpiredProductsClick}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>
          
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.actionButton, {backgroundColor: '#28a745'}]}
              onPress={handleNewSale}
            >
              <Text style={styles.actionIcon}>🛒</Text>
              <Text style={styles.actionText}>Nouvelle Vente</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, {backgroundColor: '#667eea'}]}
              onPress={handleAddProduct}
            >
              <Text style={styles.actionIcon}>📦</Text>
              <Text style={styles.actionText}>Ajouter Produit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.actionButton, {backgroundColor: '#764ba2'}]}
              onPress={handleViewReports}
            >
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionText}>Voir Rapports</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, {backgroundColor: '#dc3545'}]}
              onPress={handleStockAlerts}
            >
              <Text style={styles.actionIcon}>⚠️</Text>
              <Text style={styles.actionText}>Alertes Stock</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activité Récente</Text>
          
          <View style={styles.activityCard}>
            {recentActivity.length > 0 ? (
              recentActivity.map((item) => (
                <View key={item.id} style={styles.activityItem}>
                  <Text style={styles.activityIcon}>{item.icon}</Text>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>{item.text}</Text>
                    <Text style={styles.activityTime}>{formatTimeAgo(item.timestamp)}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.activityItem}>
                <Text style={styles.activityIcon}>📝</Text>
                <Text style={styles.activityText}>
                  Aucune activité récente
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  statsContainer: {
    paddingHorizontal: 10,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    margin: 5,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  clickHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
  section: {
    paddingHorizontal: 15,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    margin: 5,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 5,
  },
  actionText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default DashboardScreen;
