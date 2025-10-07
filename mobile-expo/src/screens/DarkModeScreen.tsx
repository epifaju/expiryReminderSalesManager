import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';

interface DarkModeScreenProps {
  onBack: () => void;
}

const DarkModeScreen: React.FC<DarkModeScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const { theme, themeMode, setThemeMode } = useTheme();
  const [selectedMode, setSelectedMode] = useState<ThemeMode>(themeMode);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setSelectedMode(themeMode);
  }, [themeMode]);

  const selectMode = async (mode: ThemeMode) => {
    try {
      setSelectedMode(mode);
      await setThemeMode(mode);
      
      // Afficher un message de confirmation
      Alert.alert(
        t('common.success'),
        t('darkMode.modeChanged'),
        [{ text: t('common.ok') }]
      );
    } catch (error) {
      console.error('Erreur sauvegarde thème:', error);
      Alert.alert(t('common.error'), t('darkMode.saveError'));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🌙 {t('settings.darkMode')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={[styles.backButtonText, { color: theme.colors.headerText }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.headerText }]}>🌙 {t('settings.darkMode')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.isDark ? theme.colors.card : '#e3f2fd' }]}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={[styles.infoText, { color: theme.isDark ? theme.colors.text : '#1976d2' }]}>{t('darkMode.description')}</Text>
        </View>

        {/* Mode Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('darkMode.selectMode')}</Text>

          {/* Mode Clair */}
          <TouchableOpacity
            style={[
              styles.modeOption,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              selectedMode === 'light' && styles.selectedOption,
            ]}
            onPress={() => selectMode('light')}
          >
            <View style={[styles.modeIconContainer, { backgroundColor: theme.isDark ? '#3a3a3a' : '#f5f5f5' }]}>
              <Text style={styles.modeIcon}>☀️</Text>
            </View>
            <View style={styles.modeInfo}>
              <Text style={[styles.modeTitle, { color: theme.colors.text }]}>{t('darkMode.light')}</Text>
              <Text style={[styles.modeDescription, { color: theme.colors.textSecondary }]}>{t('darkMode.lightDescription')}</Text>
            </View>
            {selectedMode === 'light' && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Mode Sombre */}
          <TouchableOpacity
            style={[
              styles.modeOption,
              selectedMode === 'dark' && styles.selectedOption,
            ]}
            onPress={() => selectMode('dark')}
          >
            <View style={styles.modeIconContainer}>
              <Text style={styles.modeIcon}>🌙</Text>
            </View>
            <View style={styles.modeInfo}>
              <Text style={styles.modeTitle}>{t('darkMode.dark')}</Text>
              <Text style={styles.modeDescription}>{t('darkMode.darkDescription')}</Text>
            </View>
            {selectedMode === 'dark' && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Mode Automatique */}
          <TouchableOpacity
            style={[
              styles.modeOption,
              selectedMode === 'auto' && styles.selectedOption,
            ]}
            onPress={() => selectMode('auto')}
          >
            <View style={styles.modeIconContainer}>
              <Text style={styles.modeIcon}>🔄</Text>
            </View>
            <View style={styles.modeInfo}>
              <Text style={styles.modeTitle}>{t('darkMode.auto')}</Text>
              <Text style={styles.modeDescription}>{t('darkMode.autoDescription')}</Text>
            </View>
            {selectedMode === 'auto' && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Preview Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('darkMode.preview')}</Text>
          
          {selectedMode === 'light' && (
            <View style={[styles.previewCard, styles.lightPreview]}>
              <Text style={styles.previewTitle}>{t('darkMode.light')}</Text>
              <Text style={styles.previewText}>
                {t('darkMode.previewText')}
              </Text>
            </View>
          )}

          {selectedMode === 'dark' && (
            <View style={[styles.previewCard, styles.darkPreview]}>
              <Text style={styles.previewTitleDark}>{t('darkMode.dark')}</Text>
              <Text style={styles.previewTextDark}>
                {t('darkMode.previewText')}
              </Text>
            </View>
          )}

          {selectedMode === 'auto' && (
            <View style={styles.autoPreviewContainer}>
              <View style={[styles.previewCard, styles.lightPreview, styles.halfPreview]}>
                <Text style={styles.previewTitle}>{t('darkMode.day')}</Text>
                <Text style={styles.previewText}>{t('darkMode.previewText')}</Text>
              </View>
              <View style={[styles.previewCard, styles.darkPreview, styles.halfPreview]}>
                <Text style={styles.previewTitleDark}>{t('darkMode.night')}</Text>
                <Text style={styles.previewTextDark}>{t('darkMode.previewText')}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Info about implementation */}
        <View style={styles.noteCard}>
          <Text style={styles.noteIcon}>💡</Text>
          <Text style={styles.noteText}>{t('darkMode.implementationNote')}</Text>
        </View>

        {/* Advantages Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('darkMode.advantages')}</Text>
          
          <View style={styles.advantageItem}>
            <Text style={styles.advantageIcon}>👁️</Text>
            <Text style={styles.advantageText}>{t('darkMode.advantage1')}</Text>
          </View>

          <View style={styles.advantageItem}>
            <Text style={styles.advantageIcon}>🔋</Text>
            <Text style={styles.advantageText}>{t('darkMode.advantage2')}</Text>
          </View>

          <View style={styles.advantageItem}>
            <Text style={styles.advantageIcon}>😴</Text>
            <Text style={styles.advantageText}>{t('darkMode.advantage3')}</Text>
          </View>

          <View style={styles.advantageItem}>
            <Text style={styles.advantageIcon}>🎨</Text>
            <Text style={styles.advantageText}>{t('darkMode.advantage4')}</Text>
          </View>
        </View>

        {/* Extra space at bottom */}
        <View style={{ height: 50 }} />
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
    backgroundColor: '#667eea',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  backButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  selectedOption: {
    borderColor: '#667eea',
    backgroundColor: '#f0f4ff',
  },
  modeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  modeIcon: {
    fontSize: 24,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  lightPreview: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  darkPreview: {
    backgroundColor: '#1a1a1a',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  previewTitleDark: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  previewTextDark: {
    fontSize: 14,
    color: '#b0b0b0',
    lineHeight: 20,
  },
  autoPreviewContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  halfPreview: {
    flex: 1,
  },
  noteCard: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  noteIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  advantageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  advantageIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  advantageText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default DarkModeScreen;

