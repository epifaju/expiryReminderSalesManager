import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import DashboardScreen from '../screens/DashboardScreen';
import ProductsScreen from '../screens/ProductsScreen';
import SalesScreen from '../screens/SalesScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ExpiringProductsScreen from '../screens/ExpiringProductsScreen';
import ReceiptsScreen from '../screens/ReceiptsScreen';
import authService from '../services/authService';

type TabType = 'dashboard' | 'products' | 'sales' | 'receipts' | 'reports' | 'expiring' | 'settings';

export default function AppContent() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showRegister, setShowRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [appReady, setAppReady] = useState(false);

  // Initialize auth service on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔧 Initialisation de l\'app...');
        const isAuthenticated = await authService.initialize();
        if (isAuthenticated) {
          setIsLoggedIn(true);
          setToken(authService.getToken() || '');
        }
      } catch (error) {
        console.error('❌ Erreur initialisation:', error);
      } finally {
        // TOUJOURS marquer l'app comme prête, même en cas d'erreur
        console.log('✅ App prête à utiliser');
        setAppReady(true);
      }
    };

    initializeAuth();
  }, []);

  const login = async () => {
    if (isLoading) return;
    
    // Basic validation
    if (!username.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('validation.fillRequiredFields'));
      return;
    }
    
    setIsLoading(true);
    console.log('🚀 Début de la tentative de connexion...');
    
    try {
      console.log('📝 Tentative de connexion avec:', { username, password: '***' });
      const authResponse = await authService.login({ username, password });
      
      console.log('✅ Connexion réussie:', authResponse);
      console.log('🔑 Token reçu:', authResponse.token ? `${authResponse.token.substring(0, 30)}...` : 'AUCUN TOKEN');
      setToken(authResponse.token);
      setIsLoggedIn(true);
      Alert.alert(t('common.success'), t('auth.loginSuccess'));
    } catch (error: any) {
      console.error('❌ Erreur de connexion complète:', error);
      console.error('📄 Message d\'erreur:', error.message);
      console.error('🔍 Réponse du serveur:', error.response?.data);
      console.error('📊 Status:', error.response?.status);
      
      let errorMessage = t('errors.connectionError');
      let errorTitle = t('auth.loginError');
      
      if (error.message.includes('Nom d\'utilisateur ou mot de passe incorrect')) {
        errorMessage = t('errors.authFailed');
        errorTitle = t('auth.loginError');
      } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        errorMessage = t('errors.timeoutError');
        errorTitle = t('auth.loginError');
      } else if (error.message.includes('Impossible de se connecter au serveur')) {
        errorMessage = t('errors.serverConnection');
        errorTitle = t('auth.loginError');
      } else if (error.message.includes('Network Error') || error.code === 'NETWORK_ERROR') {
        errorMessage = t('errors.networkUnavailable');
        errorTitle = t('auth.loginError');
      } else if (error.response?.status >= 500) {
        errorMessage = t('errors.serverUnavailable');
        errorTitle = t('auth.loginError');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setIsLoading(false);
      console.log('🏁 Fin de la tentative de connexion');
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setIsLoggedIn(false);
      setToken('');
      setActiveTab('dashboard');
      Alert.alert(t('auth.logout'), t('auth.logoutSuccess'));
    } catch (error: any) {
      console.error('Erreur de déconnexion:', error);
      Alert.alert(t('common.error'), error.message || t('errors.unknownError'));
    }
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen token={token} onNavigate={setActiveTab} isActive={true} />;
      case 'products':
        return <ProductsScreen token={token} />;
      case 'sales':
        return <SalesScreen token={token} />;
      case 'receipts':
        return <ReceiptsScreen />;
      case 'reports':
        return <ReportsScreen token={token} />;
      case 'expiring':
        return <ExpiringProductsScreen token={token} />;
      case 'settings':
        return <SettingsScreen onLogout={logout} />;
      default:
        return <DashboardScreen token={token} onNavigate={setActiveTab} isActive={true} />;
    }
  };

  // Affichage de chargement pendant l'initialisation
  if (!appReady) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🛍️ {t('app.name')}</Text>
        <Text style={styles.subtitle}>{t('app.initialization')}</Text>
        <View style={{ alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 16, color: '#666' }}>{t('app.loading')}</Text>
        </View>
      </View>
    );
  }

  if (!isLoggedIn) {
    if (showRegister) {
      return (
        <RegisterScreen
          onBackToLogin={() => setShowRegister(false)}
          onRegisterSuccess={() => setShowRegister(false)}
        />
      );
    }

    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <Text style={styles.title}>{t('app.name')}</Text>
        <Text style={styles.subtitle}>{t('auth.login')}</Text>
        
        <TextInput
          style={styles.input}
          placeholder={t('auth.username')}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={login}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>
            {isLoading ? t('auth.connecting') : t('auth.login')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.linkButton} 
          onPress={() => setShowRegister(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.linkText}>{t('auth.noAccount')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="auto" />
      
      {/* Main Content */}
      <View style={styles.content}>
        {renderScreen()}
      </View>
      
      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'dashboard' && styles.activeNavItem]}
          onPress={() => setActiveTab('dashboard')}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, activeTab === 'dashboard' && styles.activeNavIcon]}>🏠</Text>
          <Text style={[styles.navText, activeTab === 'dashboard' && styles.activeNavText]}>{t('navigation.home')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'products' && styles.activeNavItem]}
          onPress={() => setActiveTab('products')}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, activeTab === 'products' && styles.activeNavIcon]}>📦</Text>
          <Text style={[styles.navText, activeTab === 'products' && styles.activeNavText]}>{t('navigation.products')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'sales' && styles.activeNavItem]}
          onPress={() => setActiveTab('sales')}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, activeTab === 'sales' && styles.activeNavIcon]}>🛒</Text>
          <Text style={[styles.navText, activeTab === 'sales' && styles.activeNavText]}>{t('navigation.sales')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'receipts' && styles.activeNavItem]}
          onPress={() => setActiveTab('receipts')}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, activeTab === 'receipts' && styles.activeNavIcon]}>🧾</Text>
          <Text style={[styles.navText, activeTab === 'receipts' && styles.activeNavText]}>{t('navigation.receipts')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'reports' && styles.activeNavItem]}
          onPress={() => setActiveTab('reports')}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, activeTab === 'reports' && styles.activeNavIcon]}>📊</Text>
          <Text style={[styles.navText, activeTab === 'reports' && styles.activeNavText]}>{t('navigation.reports')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'expiring' && styles.activeNavItem]}
          onPress={() => setActiveTab('expiring')}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, activeTab === 'expiring' && styles.activeNavIcon]}>⚠️</Text>
          <Text style={[styles.navText, activeTab === 'expiring' && styles.activeNavText]}>{t('navigation.expiring')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'settings' && styles.activeNavItem]}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, activeTab === 'settings' && styles.activeNavIcon]}>⚙️</Text>
          <Text style={[styles.navText, activeTab === 'settings' && styles.activeNavText]}>{t('navigation.settings')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
    justifyContent: 'center',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
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
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  activeNavIcon: {
    fontSize: 22,
  },
  navText: {
    fontSize: 12,
    color: '#666',
  },
  activeNavText: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  linkButton: {
    alignItems: 'center',
    padding: 10,
    marginTop: 15,
  },
  linkText: {
    color: '#007bff',
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
});
