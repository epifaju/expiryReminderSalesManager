import React, { useState } from 'react';
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
import axios from 'axios';
import DashboardScreen from './src/screens/DashboardScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import SalesScreen from './src/screens/SalesScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Dynamic API URL based on platform with fallback options
const getApiUrls = () => {
  if (Platform.OS === 'web') {
    return ['http://localhost:8081'];
  } else {
    // For Android emulator, try multiple options
    return [
      'http://10.0.2.2:8081',      // Standard Android emulator localhost
      'http://192.168.1.27:8081',  // Your actual IP address
      'http://localhost:8081'      // Sometimes works on some emulators
    ];
  }
};

const API_URLS = getApiUrls();
const API_BASE_URL = API_URLS[0]; // Default to first URL

type TabType = 'dashboard' | 'products' | 'sales' | 'reports' | 'settings';

export default function App() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const tryLogin = async (baseUrl: string) => {
    console.log('Tentative de connexion à:', `${baseUrl}/auth/signin`);
    
    const response = await axios.post(`${baseUrl}/auth/signin`, {
      username,
      password,
    }, {
      timeout: 5000, // 5 seconds timeout
    });

    return response;
  };

  const login = async () => {
    console.log('Platform:', Platform.OS);
    console.log('URLs disponibles:', API_URLS);
    
    let lastError = null;
    
    // Try each URL in sequence
    for (let i = 0; i < API_URLS.length; i++) {
      const currentUrl = API_URLS[i];
      try {
        console.log(`Essai ${i + 1}/${API_URLS.length} avec URL:`, currentUrl);
        
        const response = await tryLogin(currentUrl);
        
        console.log('Réponse reçue:', response.data);

        if (response.data && response.data.token) {
          setToken(response.data.token);
          setIsLoggedIn(true);
          Alert.alert('Succès', `Connexion réussie !\nURL utilisée: ${currentUrl}`);
          return; // Success, exit the function
        }
      } catch (error: any) {
        console.error(`Erreur avec URL ${currentUrl}:`, error.message);
        lastError = error;
        
        // If this is not the last URL, continue to the next one
        if (i < API_URLS.length - 1) {
          console.log('Tentative avec la prochaine URL...');
          continue;
        }
      }
    }
    
    // If we get here, all URLs failed
    console.error('Toutes les URLs ont échoué. Dernière erreur:', lastError);
    const errorMessage = lastError?.response?.data?.message || lastError?.message || 'Impossible de se connecter au serveur';
    Alert.alert('Erreur', `${errorMessage}\n\nURLs essayées:\n${API_URLS.join('\n')}\n\nPlatform: ${Platform.OS}`);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setToken('');
    setActiveTab('dashboard');
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen token={token} onNavigate={setActiveTab} />;
      case 'products':
        return <ProductsScreen token={token} />;
      case 'sales':
        return <SalesScreen token={token} />;
      case 'reports':
        return <ReportsScreen token={token} />;
      case 'settings':
        return <SettingsScreen onLogout={logout} />;
      default:
        return <DashboardScreen token={token} onNavigate={setActiveTab} />;
    }
  };

  if (!isLoggedIn) {
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
        
        <TouchableOpacity style={styles.button} onPress={login}>
          <Text style={styles.buttonText}>Se connecter</Text>
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
        >
          <Text style={[styles.navIcon, activeTab === 'dashboard' && styles.activeNavIcon]}>🏠</Text>
          <Text style={[styles.navText, activeTab === 'dashboard' && styles.activeNavText]}>Accueil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'products' && styles.activeNavItem]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={[styles.navIcon, activeTab === 'products' && styles.activeNavIcon]}>📦</Text>
          <Text style={[styles.navText, activeTab === 'products' && styles.activeNavText]}>Produits</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'sales' && styles.activeNavItem]}
          onPress={() => setActiveTab('sales')}
        >
          <Text style={[styles.navIcon, activeTab === 'sales' && styles.activeNavIcon]}>🛒</Text>
          <Text style={[styles.navText, activeTab === 'sales' && styles.activeNavText]}>Ventes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'reports' && styles.activeNavItem]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[styles.navIcon, activeTab === 'reports' && styles.activeNavIcon]}>📊</Text>
          <Text style={[styles.navText, activeTab === 'reports' && styles.activeNavText]}>Rapports</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'settings' && styles.activeNavItem]}
          onPress={() => setActiveTab('settings')}
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
});
