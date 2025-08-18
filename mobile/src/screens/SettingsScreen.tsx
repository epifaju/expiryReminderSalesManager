import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

const SettingsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          ⚙️ Paramètres
        </Text>
        <Text style={styles.description}>
          Écran de paramètres - Fonctionnalités à implémenter:
          {'\n'}• Sélection de langue (FR, PT, Créole)
          {'\n'}• Configuration des notifications
          {'\n'}• Paramètres de stock
          {'\n'}• Sauvegarde/Restauration
          {'\n'}• Profil utilisateur
          {'\n'}• À propos de l'application
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

export default SettingsScreen;
