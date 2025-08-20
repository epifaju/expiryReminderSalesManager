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
} from 'react-native';
import productService from '../services/productService';
import DatePicker from '../components/DatePicker';

interface Product {
  id: number;
  name: string;
  description: string;
  barcode: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  expiryDate: string;
  manufacturingDate: string;
  category: string;
  unit: string;
  isActive: boolean;
}

interface ProductsScreenProps {
  token: string;
}

const ProductsScreen: React.FC<ProductsScreenProps> = ({ token }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    barcode: '',
    purchasePrice: '',
    sellingPrice: '',
    stockQuantity: '',
    minStockLevel: '5',
    category: '',
    unit: 'pcs',
    manufacturingDate: '',
    expiryDate: '',
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await productService.getProducts();
      console.log('📦 Données produits reçues:', productsData);
      
      // S'assurer que nous avons un tableau
      const productsArray = Array.isArray(productsData) ? productsData : [];
      setProducts(productsArray);
      
      console.log('✅ Produits chargés:', productsArray.length);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      Alert.alert('Erreur', 'Impossible de charger les produits');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const addProduct = async () => {
    try {
      if (!newProduct.name || !newProduct.purchasePrice || !newProduct.sellingPrice) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
        return;
      }

      const productData = {
        ...newProduct,
        purchasePrice: parseFloat(newProduct.purchasePrice),
        sellingPrice: parseFloat(newProduct.sellingPrice),
        stockQuantity: parseInt(newProduct.stockQuantity) || 0,
        minStockLevel: parseInt(newProduct.minStockLevel) || 5,
        isActive: true,
      };

      await productService.createProduct(productData);

      Alert.alert('Succès', 'Produit ajouté avec succès');
      setShowAddForm(false);
      setNewProduct({
        name: '',
        description: '',
        barcode: '',
        purchasePrice: '',
        sellingPrice: '',
        stockQuantity: '',
        minStockLevel: '5',
        category: '',
        unit: 'pcs',
        manufacturingDate: '',
        expiryDate: '',
      });
      loadProducts();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du produit:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le produit');
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productCategory}>{product.category || 'Non catégorisé'}</Text>
      </View>
      <Text style={styles.productDescription}>{product.description}</Text>
      <View style={styles.productDetails}>
        <Text style={styles.productPrice}>Prix: {product.sellingPrice}€</Text>
        <Text style={styles.productStock}>Stock: {product.stockQuantity}</Text>
      </View>
      {product.stockQuantity < product.minStockLevel && (
        <Text style={styles.lowStockWarning}>⚠️ Stock faible</Text>
      )}
    </View>
  );

  if (showAddForm) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📦 Ajouter un Produit</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowAddForm(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nom du produit *"
            value={newProduct.name}
            onChangeText={(text) => setNewProduct({...newProduct, name: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={newProduct.description}
            onChangeText={(text) => setNewProduct({...newProduct, description: text})}
            multiline
          />
          
          <TextInput
            style={styles.input}
            placeholder="Code-barres"
            value={newProduct.barcode}
            onChangeText={(text) => setNewProduct({...newProduct, barcode: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Prix d'achat *"
            value={newProduct.purchasePrice}
            onChangeText={(text) => setNewProduct({...newProduct, purchasePrice: text})}
            keyboardType="numeric"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Prix de vente *"
            value={newProduct.sellingPrice}
            onChangeText={(text) => setNewProduct({...newProduct, sellingPrice: text})}
            keyboardType="numeric"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Quantité en stock"
            value={newProduct.stockQuantity}
            onChangeText={(text) => setNewProduct({...newProduct, stockQuantity: text})}
            keyboardType="numeric"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Stock minimum"
            value={newProduct.minStockLevel}
            onChangeText={(text) => setNewProduct({...newProduct, minStockLevel: text})}
            keyboardType="numeric"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Catégorie"
            value={newProduct.category}
            onChangeText={(text) => setNewProduct({...newProduct, category: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Unité (pcs, kg, l...)"
            value={newProduct.unit}
            onChangeText={(text) => setNewProduct({...newProduct, unit: text})}
          />

          <Text style={styles.sectionTitle}>📅 Dates (optionnel)</Text>
          
          <DatePicker
            label="Date de fabrication"
            value={newProduct.manufacturingDate}
            onDateChange={(date) => setNewProduct({...newProduct, manufacturingDate: date})}
            placeholder="Sélectionner la date de fabrication"
            maximumDate={new Date().toISOString().split('T')[0]} // Cannot be in the future
          />
          
          <DatePicker
            label="Date d'expiration"
            value={newProduct.expiryDate}
            onDateChange={(date) => setNewProduct({...newProduct, expiryDate: date})}
            placeholder="Sélectionner la date d'expiration"
            minimumDate={newProduct.manufacturingDate || new Date().toISOString().split('T')[0]} // Must be after manufacturing date
          />

          <TouchableOpacity style={styles.addButton} onPress={addProduct}>
            <Text style={styles.addButtonText}>Ajouter le Produit</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📦 Gestion des Produits</Text>
        <TouchableOpacity
          style={styles.addProductButton}
          onPress={() => setShowAddForm(true)}
        >
          <Text style={styles.addProductButtonText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un produit..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        style={styles.productsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.productsCount}>
          {filteredProducts.length} produit(s) trouvé(s)
        </Text>

        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Aucun produit trouvé</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Essayez une autre recherche' : 'Ajoutez votre premier produit'}
            </Text>
          </View>
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#667eea',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  addProductButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addProductButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
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
  formContainer: {
    flex: 1,
    padding: 20,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
});

export default ProductsScreen;
