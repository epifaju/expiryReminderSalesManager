import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { initI18n } from '../i18n';
import { ThemeProvider } from '../contexts/ThemeContext';
import AppContent from './AppContent';

export default function AppWrapper() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    const initializeI18n = async () => {
      try {
        console.log('🔧 Initialisation i18n...');
        await initI18n();
        console.log('✅ i18n initialisé');
        setI18nReady(true);
      } catch (error) {
        console.error('❌ Erreur initialisation i18n:', error);
        // Même en cas d'erreur, on continue
        setI18nReady(true);
      }
    };

    initializeI18n();
  }, []);

  if (!i18nReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 20, fontSize: 16, color: '#666' }}>
          Initialisation i18n...
        </Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
