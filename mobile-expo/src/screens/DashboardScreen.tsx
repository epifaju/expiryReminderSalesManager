import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import axios from 'axios';

// Dynamic API URL based on platform with fallback options
const getApiUrls = () => {
  if (Platform.OS === 'web') {
    return ['http://localhost:8081'];
  } else {
    return [
      'http://10.0.2.2:8081',
      'http://192.168.1.27:8081',
      'http://localhost:8081'
    ];
  }
};

const API_URLS = getApiUrls();
const API_BASE_URL = API_URLS[0];

interface Product {
  id: number;
  name: string;
  stockQuantity: number;
  minStockLevel: number;
  sellingPrice: number;
  category: string;
}

interface DashboardStats {
  todaySales: number;
  totalProducts: number;
  monthlyRevenue: number;
  lowStock: number;
  expiringProducts: number;
  expiredProducts: number;
}

interface DashboardScreenProps {
  token: string;
  onNavigate: (tab: 'dashboard' | 'products' | 'sales' | 'reports' | 'settings') => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ token, onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    totalProducts: 0,
    monthlyRevenue: 0,
    lowStock: 0,
    expiringProducts: 0,
    expiredProducts: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      // Charger les données réelles depuis l'API
      const response = await axios.get(`${API_BASE_URL}/products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      let products = [];
      if (response.data && response.data.content) {
        products = response.data.content;
      } else if (Array.isArray(response.data)) {
        products = response.data;
      }

      // Calculer les statistiques basées sur les données réelles
      const lowStockProducts = products.filter((p: Product) => p.stockQuantity < p.minStockLevel);
      
      setStats({
        todaySales: 15, // Simulé pour l'instant
        totalProducts: products.length,
        monthlyRevenue: 12500, // Simulé pour l'instant
        lowStock: lowStockProducts.length,
        expiringProducts: 12, // Simulé pour l'instant
        expiredProducts: 3, // Simulé pour l'instant
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      // Fallback vers des données simulées
      setStats({
        todaySales: 15,
        totalProducts: 245,
        monthlyRevenue: 12500,
        lowStock: 8,
        expiringProducts: 12,
        expiredProducts: 3,
      });
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
      const response = await axios.get(`${API_BASE_URL}/products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      let products = [];
      if (response.data && response.data.content) {
        products = response.data.content;
      } else if (Array.isArray(response.data)) {
        products = response.data;
      }

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

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    color: string;
  }> = ({title, value, color}) => (
    <View style={[styles.statCard, {borderLeftColor: color}]}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
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
            />
            <StatCard
              title="📦 Produits en Stock"
              value={stats.totalProducts}
              color="#28a745"
            />
          </View>

          <View style={styles.statsRow}>
            <StatCard
              title="💰 Revenus du Mois"
              value={`${stats.monthlyRevenue} €`}
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
            />
            <StatCard
              title="❌ Produits Expirés"
              value={stats.expiredProducts}
              color="#dc3545"
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
            <View style={styles.activityItem}>
              <Text style={styles.activityIcon}>🛒</Text>
              <Text style={styles.activityText}>
                Vente #1234 - 45.50 € - Il y a 2h
              </Text>
            </View>
            
            <View style={styles.activityItem}>
              <Text style={styles.activityIcon}>📦</Text>
              <Text style={styles.activityText}>
                Produit ajouté: Café Premium - Il y a 4h
              </Text>
            </View>
            
            <View style={styles.activityItem}>
              <Text style={styles.activityIcon}>⚠️</Text>
              <Text style={styles.activityText}>
                Stock faible: Lait UHT (5 unités) - Il y a 6h
              </Text>
            </View>
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
    alignItems: 'center',
    marginBottom: 10,
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
});

export default DashboardScreen;
