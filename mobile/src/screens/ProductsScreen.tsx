import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

const ProductsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          📦 Gestion des Produits
        </Text>
        <Text style={styles.description}>
          Écran de gestion des produits - Fonctionnalités à implémenter:
          {'\n'}• Liste des produits
          {'\n'}• Ajouter/Modifier produits
          {'\n'}• Scanner code-barres
          {'\n'}• Gestion du stock
          {'\n'}• Alertes d'expiration
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  description: {
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
  },
});

export default ProductsScreen;
