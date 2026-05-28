import React, { useState } from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView} from 'react-native';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';
import UserProfileScreen from './UserProfileScreen';
import ChangePasswordScreen from './ChangePasswordScreen';
import NotificationsScreen from './NotificationsScreen';
import DarkModeScreen from './DarkModeScreen';
import HelpScreen from './HelpScreen';
import ContactSupportScreen from './ContactSupportScreen';
import AboutScreen from './AboutScreen';
import BluetoothSettingsScreen from './BluetoothSettingsScreen';
import CurrencySettingsScreen from './CurrencySettingsScreen';
import TenantSelectionScreen from './TenantSelectionScreen';
import AdminTenantManagementScreen from './AdminTenantManagementScreen';
import { useCurrency } from '../contexts/CurrencyContext';
import authService from '../services/authService';

interface SettingsScreenProps {
  onLogout: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onLogout }) => {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showCurrencySettings, setShowCurrencySettings] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDarkMode, setShowDarkMode] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showBluetoothSettings, setShowBluetoothSettings] = useState(false);
  const [showTenantSelection, setShowTenantSelection] = useState(false);
  const [showAdminTenancy, setShowAdminTenancy] = useState(false);

  const isAdmin =
    authService
      .getUser()
      ?.roles?.some((role) => role === 'ROLE_ADMIN' || role === 'ADMIN' || role === 'ROLE_PLATFORM_ADMIN') ?? false;
  
  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      t('settings.logoutConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: onLogout,
        },
      ]
    );
  };

  // Si on affiche le profil utilisateur, afficher cet écran
  if (showUserProfile) {
    return <UserProfileScreen onBack={() => setShowUserProfile(false)} />;
  }

  // Si on affiche le changement de mot de passe, afficher cet écran
  if (showChangePassword) {
    return <ChangePasswordScreen onBack={() => setShowChangePassword(false)} />;
  }

  // Si on affiche les notifications, afficher cet écran
  if (showNotifications) {
    return <NotificationsScreen onBack={() => setShowNotifications(false)} />;
  }

  // Si on affiche le mode sombre, afficher cet écran
  if (showDarkMode) {
    return <DarkModeScreen onBack={() => setShowDarkMode(false)} />;
  }

  // Si on affiche l'aide, afficher cet écran
  if (showHelp) {
    return <HelpScreen onBack={() => setShowHelp(false)} />;
  }

  // Si on affiche le contact support, afficher cet écran
  if (showContactSupport) {
    return <ContactSupportScreen onBack={() => setShowContactSupport(false)} />;
  }

  // Si on affiche À propos, afficher cet écran
  if (showAbout) {
    return <AboutScreen onBack={() => setShowAbout(false)} />;
  }

  if (showBluetoothSettings) {
    return <BluetoothSettingsScreen onBack={() => setShowBluetoothSettings(false)} />;
  }

  if (showCurrencySettings) {
    return <CurrencySettingsScreen onBack={() => setShowCurrencySettings(false)} />;
  }

  if (showTenantSelection) {
    return <TenantSelectionScreen onBack={() => setShowTenantSelection(false)} />;
  }

  if (showAdminTenancy) {
    return <AdminTenantManagementScreen onBack={() => setShowAdminTenancy(false)} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ {t('settings.title')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowUserProfile(true)}
          >
            <Text style={styles.settingIcon}>👤</Text>
            <Text style={styles.settingText}>{t('settings.userProfile')}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowChangePassword(true)}
          >
            <Text style={styles.settingIcon}>🔒</Text>
            <Text style={styles.settingText}>{t('settings.changePassword')}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.application')}</Text>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowTenantSelection(true)}
          >
            <Text style={styles.settingIcon}>🏪</Text>
            <Text style={styles.settingText}>{t('settings.organisationStore')}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => setShowAdminTenancy(true)}
            >
              <Text style={styles.settingIcon}>🛠️</Text>
              <Text style={styles.settingText}>Administration (SaaS)</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowNotifications(true)}
          >
            <Text style={styles.settingIcon}>🔔</Text>
            <Text style={styles.settingText}>{t('settings.notifications')}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowDarkMode(true)}
          >
            <Text style={styles.settingIcon}>🌙</Text>
            <Text style={styles.settingText}>{t('settings.darkMode')}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <LanguageSelector />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowCurrencySettings(true)}
          >
            <Text style={styles.settingIcon}>💱</Text>
            <Text style={styles.settingText}>{t('currency.title')}</Text>
            <Text style={styles.settingValue}>{currency}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowBluetoothSettings(true)}
          >
            <Text style={styles.settingIcon}>📶</Text>
            <Text style={styles.settingText}>{t('bluetooth.settings_title')}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.data')}</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>💾</Text>
            <Text style={styles.settingText}>{t('settings.backup')}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>📤</Text>
            <Text style={styles.settingText}>{t('settings.exportData')}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.support')}</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowHelp(true)}
          >
            <Text style={styles.settingIcon}>❓</Text>
            <Text style={styles.settingText}>{t('settings.help')}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowContactSupport(true)}
          >
            <Text style={styles.settingIcon}>📧</Text>
            <Text style={styles.settingText}>{t('settings.contactSupport')}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowAbout(true)}
          >
            <Text style={styles.settingIcon}>ℹ️</Text>
            <Text style={styles.settingText}>{t('settings.about')}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 {t('auth.logout')}</Text>
        </TouchableOpacity>

        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>{t('app.name')}</Text>
          <Text style={styles.versionNumber}>{t('settings.version')} 1.0.0</Text>
        </View>
        
        {/* Extra space at bottom to ensure scrollability */}
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 25,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
    marginRight: 8,
  },
  settingArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionInfo: {
    alignItems: 'center',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  versionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  versionNumber: {
    fontSize: 12,
    color: '#999',
  },
});

export default SettingsScreen;
