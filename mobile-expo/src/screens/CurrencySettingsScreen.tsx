import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../contexts/CurrencyContext';
import { SUPPORTED_CURRENCIES, SupportedCurrency } from '../types/currency';

interface CurrencySettingsScreenProps {
  onBack: () => void;
}

const CurrencySettingsScreen: React.FC<CurrencySettingsScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const { currency, setCurrency } = useCurrency();
  const [isSaving, setIsSaving] = useState(false);

  const handleSelect = async (code: SupportedCurrency) => {
    if (code === currency || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await setCurrency(code);
      Alert.alert(t('common.success'), t('currency.changeSuccess'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('currency.changeError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={isSaving}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💱 {t('currency.title')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>{t('currency.description')}</Text>

        {SUPPORTED_CURRENCIES.map((code) => {
          const selected = currency === code;
          return (
            <TouchableOpacity
              key={code}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => handleSelect(code)}
              disabled={isSaving}
            >
              <View>
                <Text style={[styles.optionCode, selected && styles.optionTextSelected]}>
                  {code}
                </Text>
                <Text style={[styles.optionLabel, selected && styles.optionSubtextSelected]}>
                  {t(`currency.labels.${code}`)}
                </Text>
              </View>
              {selected ? <Text style={styles.checkmark}>✓</Text> : null}
            </TouchableOpacity>
          );
        })}

        {isSaving ? (
          <ActivityIndicator style={styles.loader} size="large" color="#667eea" />
        ) : null}
      </View>
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
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  optionSelected: {
    borderColor: '#667eea',
    backgroundColor: '#eef0ff',
  },
  optionCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  optionLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  optionTextSelected: {
    color: '#667eea',
  },
  optionSubtextSelected: {
    color: '#5568d3',
  },
  checkmark: {
    fontSize: 22,
    color: '#667eea',
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 20,
  },
});

export default CurrencySettingsScreen;
