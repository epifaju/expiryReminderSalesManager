import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationsScreenProps {
  onBack: () => void;
}

interface NotificationSettings {
  enabled: boolean;
  sales: boolean;
  lowStock: boolean;
  expiringProducts: boolean;
  reports: boolean;
  systemUpdates: boolean;
  sound: boolean;
  vibration: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

const defaultSettings: NotificationSettings = {
  enabled: true,
  sales: true,
  lowStock: true,
  expiringProducts: true,
  reports: false,
  systemUpdates: true,
  sound: true,
  vibration: true,
  emailNotifications: false,
  pushNotifications: true,
};

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notification_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Erreur chargement paramètres notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem('notification_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      console.log('✅ Paramètres de notifications sauvegardés');
    } catch (error) {
      console.error('Erreur sauvegarde paramètres notifications:', error);
      Alert.alert(t('common.error'), t('notifications.saveError'));
    }
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    
    // Si on désactive les notifications générales, désactiver tout
    if (key === 'enabled' && !newSettings.enabled) {
      Object.keys(newSettings).forEach(k => {
        newSettings[k as keyof NotificationSettings] = false;
      });
    }
    
    // Si on active une notification spécifique, activer les notifications générales
    if (key !== 'enabled' && newSettings[key]) {
      newSettings.enabled = true;
    }
    
    saveSettings(newSettings);
  };

  const resetToDefaults = () => {
    Alert.alert(
      t('notifications.resetTitle'),
      t('notifications.resetMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('notifications.reset'),
          onPress: () => saveSettings(defaultSettings),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🔔 {t('settings.notifications')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔔 {t('settings.notifications')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>{t('notifications.description')}</Text>
        </View>

        {/* Notifications principales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notifications.general')}</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('notifications.enable')}</Text>
              <Text style={styles.settingDescription}>{t('notifications.enableDescription')}</Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={() => toggleSetting('enabled')}
              trackColor={{ false: '#d3d3d3', true: '#667eea' }}
              thumbColor={settings.enabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Types de notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notifications.types')}</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.labelRow}>
                <Text style={styles.settingIcon}>🛒</Text>
                <Text style={styles.settingLabel}>{t('notifications.sales')}</Text>
              </View>
              <Text style={styles.settingDescription}>{t('notifications.salesDescription')}</Text>
            </View>
            <Switch
              value={settings.sales}
              onValueChange={() => toggleSetting('sales')}
              trackColor={{ false: '#d3d3d3', true: '#667eea' }}
              thumbColor={settings.sales ? '#fff' : '#f4f3f4'}
              disabled={!settings.enabled}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.labelRow}>
                <Text style={styles.settingIcon}>📦</Text>
                <Text style={styles.settingLabel}>{t('notifications.lowStock')}</Text>
              </View>
              <Text style={styles.settingDescription}>{t('notifications.lowStockDescription')}</Text>
            </View>
            <Switch
              value={settings.lowStock}
              onValueChange={() => toggleSetting('lowStock')}
              trackColor={{ false: '#d3d3d3', true: '#667eea' }}
              thumbColor={settings.lowStock ? '#fff' : '#f4f3f4'}
              disabled={!settings.enabled}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.labelRow}>
                <Text style={styles.settingIcon}>⚠️</Text>
                <Text style={styles.settingLabel}>{t('notifications.expiringProducts')}</Text>
              </View>
              <Text style={styles.settingDescription}>{t('notifications.expiringDescription')}</Text>
            </View>
            <Switch
              value={settings.expiringProducts}
              onValueChange={() => toggleSetting('expiringProducts')}
              trackColor={{ false: '#d3d3d3', true: '#667eea' }}
              thumbColor={settings.expiringProducts ? '#fff' : '#f4f3f4'}
              disabled={!settings.enabled}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.labelRow}>
                <Text style={styles.settingIcon}>📊</Text>
                <Text style={styles.settingLabel}>{t('notifications.reports')}</Text>
              </View>
              <Text style={styles.settingDescription}>{t('notifications.reportsDescription')}</Text>
            </View>
            <Switch
              value={settings.reports}
              onValueChange={() => toggleSetting('reports')}
              trackColor={{ false: '#d3d3d3', true: '#667eea' }}
              thumbColor={settings.reports ? '#fff' : '#f4f3f4'}
              disabled={!settings.enabled}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.labelRow}>
                <Text style={styles.settingIcon}>🔄</Text>
                <Text style={styles.settingLabel}>{t('notifications.systemUpdates')}</Text>
              </View>
              <Text style={styles.settingDescription}>{t('notifications.systemDescription')}</Text>
            </View>
            <Switch
              value={settings.systemUpdates}
              onValueChange={() => toggleSetting('systemUpdates')}
              trackColor={{ false: '#d3d3d3', true: '#667eea' }}
              thumbColor={settings.systemUpdates ? '#fff' : '#f4f3f4'}
              disabled={!settings.enabled}
            />
          </View>
        </View>

        {/* Comportement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notifications.behavior')}</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.labelRow}>
                <Text style={styles.settingIcon}>🔊</Text>
                <Text style={styles.settingLabel}>{t('notifications.sound')}</Text>
              </View>
              <Text style={styles.settingDescription}>{t('notifications.soundDescription')}</Text>
            </View>
            <Switch
              value={settings.sound}
              onValueChange={() => toggleSetting('sound')}
              trackColor={{ false: '#d3d3d3', true: '#667eea' }}
              thumbColor={settings.sound ? '#fff' : '#f4f3f4'}
              disabled={!settings.enabled}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.labelRow}>
                <Text style={styles.settingIcon}>📳</Text>
                <Text style={styles.settingLabel}>{t('notifications.vibration')}</Text>
              </View>
              <Text style={styles.settingDescription}>{t('notifications.vibrationDescription')}</Text>
            </View>
            <Switch
              value={settings.vibration}
              onValueChange={() => toggleSetting('vibration')}
              trackColor={{ false: '#d3d3d3', true: '#667eea' }}
              thumbColor={settings.vibration ? '#fff' : '#f4f3f4'}
              disabled={!settings.enabled}
            />
          </View>
        </View>

        {/* Canaux de notification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notifications.channels')}</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.labelRow}>
                <Text style={styles.settingIcon}>📧</Text>
                <Text style={styles.settingLabel}>{t('notifications.email')}</Text>
              </View>
              <Text style={styles.settingDescription}>{t('notifications.emailDescription')}</Text>
            </View>
            <Switch
              value={settings.emailNotifications}
              onValueChange={() => toggleSetting('emailNotifications')}
              trackColor={{ false: '#d3d3d3', true: '#667eea' }}
              thumbColor={settings.emailNotifications ? '#fff' : '#f4f3f4'}
              disabled={!settings.enabled}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.labelRow}>
                <Text style={styles.settingIcon}>📱</Text>
                <Text style={styles.settingLabel}>{t('notifications.push')}</Text>
              </View>
              <Text style={styles.settingDescription}>{t('notifications.pushDescription')}</Text>
            </View>
            <Switch
              value={settings.pushNotifications}
              onValueChange={() => toggleSetting('pushNotifications')}
              trackColor={{ false: '#d3d3d3', true: '#667eea' }}
              thumbColor={settings.pushNotifications ? '#fff' : '#f4f3f4'}
              disabled={!settings.enabled}
            />
          </View>
        </View>

        {/* Bouton de réinitialisation */}
        <View style={styles.resetSection}>
          <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
            <Text style={styles.resetButtonText}>🔄 {t('notifications.reset')}</Text>
          </TouchableOpacity>
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  settingIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  resetSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#ff9800',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NotificationsScreen;

