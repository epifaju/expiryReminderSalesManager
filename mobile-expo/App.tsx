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
import DashboardScreen from './src/screens/DashboardScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import SalesScreen from './src/screens/SalesScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ExpiringProductsScreen from './src/screens/ExpiringProductsScreen';
import ReceiptsScreen from './src/screens/ReceiptsScreen';
import authService from './src/services/authService';

type TabType = 'dashboard' | 'products' | 'sales' | 'receipts' | 'reports' | 'expiring' | 'settings';

export default function App() {
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
      Alert.alert('Erreur', 'Veuillez saisir un nom d\'utilisateur et un mot de passe');
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
      Alert.alert('Succès', 'Connexion réussie !');
    } catch (error: any) {
      console.error('❌ Erreur de connexion complète:', error);
      console.error('📄 Message d\'erreur:', error.message);
      console.error('🔍 Réponse du serveur:', error.response?.data);
      console.error('📊 Status:', error.response?.status);
      
      let errorMessage = 'Impossible de se connecter au serveur';
      let errorTitle = 'Erreur de connexion';
      
      if (error.message.includes('Nom d\'utilisateur ou mot de passe incorrect')) {
        errorMessage = 'Nom d\'utilisateur ou mot de passe incorrect';
        errorTitle = 'Authentification échouée';
      } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        errorMessage = 'Le serveur met trop de temps à répondre. Vérifiez votre connexion réseau.';
        errorTitle = 'Timeout';
      } else if (error.message.includes('Impossible de se connecter au serveur')) {
        errorMessage = 'Impossible de se connecter au serveur. Assurez-vous que:\n\n• Le serveur backend est démarré\n• Votre connexion réseau fonctionne\n• L\'émulateur peut accéder au réseau';
        errorTitle = 'Connexion impossible';
      } else if (error.message.includes('Network Error') || error.code === 'NETWORK_ERROR') {
        errorMessage = 'Erreur de réseau. Vérifiez votre connexion internet et que le serveur backend est démarré.';
        errorTitle = 'Erreur réseau';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Erreur du serveur. Veuillez réessayer plus tard.';
        errorTitle = 'Erreur serveur';
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
      Alert.alert('Déconnexion', 'Vous avez été déconnecté avec succès');
    } catch (error: any) {
      console.error('Erreur de déconnexion:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de la déconnexion');
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
        <Text style={styles.title}>🛍️ Sales Manager Mobile</Text>
        <Text style={styles.subtitle}>Initialisation...</Text>
        <View style={{ alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 16, color: '#666' }}>⏳ Chargement...</Text>
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
        <Text style={styles.title}>Sales Manager Mobile</Text>
        <Text style={styles.subtitle}>Connexion</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Nom d'utilisateur"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
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
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.linkButton} 
          onPress={() => setShowRegister(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.linkText}>Pas de compte ? S'inscrire</Text>
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
          <Text style={[styles.navText, activeTab === 'dashboard' && styles.activeNavText]}>Accueil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'products' && styles.activeNavItem]}
          onPress={() => setActiveTab('products')}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, activeTab === 'products' && styles.activeNavIcon]}>📦</Text>
          <Text style={[styles.navText, activeTab === 'products' && styles.activeNavText]}>Produits</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'sales' && styles.activeNavItem]}
          onPress={() => setActiveTab('sales')}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, activeTab === 'sales' && styles.activeNavIcon]}>🛒</Text>
          <Text style={[styles.navText, activeTab === 'sales' && styles.activeNavText]}>Ventes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'receipts' && styles.activeNavItem]}
          onPress={() => setActiveTab('receipts')}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, activeTab === 'receipts' && styles.activeNavIcon]}>🧾</Text>
          <Text style={[styles.navText, activeTab === 'receipts' && styles.activeNavText]}>Reçus</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'reports' && styles.activeNavItem]}
          onPress={() => setActiveTab('reports')}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, activeTab === 'reports' && styles.activeNavIcon]}>📊</Text>
          <Text style={[styles.navText, activeTab === 'reports' && styles.activeNavText]}>Rapports</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'expiring' && styles.activeNavItem]}
          onPress={() => setActiveTab('expiring')}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, activeTab === 'expiring' && styles.activeNavIcon]}>⚠️</Text>
          <Text style={[styles.navText, activeTab === 'expiring' && styles.activeNavText]}>Expiration</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'settings' && styles.activeNavItem]}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
        >
          <Text style={[styles.navIcon, activeTab === 'settings' && styles.activeNavIcon]}>⚙️</Text>
          <Text style={[styles.navText, activeTab === 'settings' && styles.activeNavText]}>Paramètres</Text>
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
