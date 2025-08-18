import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const ReportsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          📊 Rapports et Statistiques
        </Text>
        <Text style={styles.description}>
          Écran de rapports - Fonctionnalités à implémenter:
          {'\n'}• Rapport des ventes
          {'\n'}• Analyse des produits
          {'\n'}• Graphiques de performance
          {'\n'}• Export PDF/Excel
          {'\n'}• Statistiques mensuelles
        </Text>
      </View>
    </View>
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

export default ReportsScreen;
