import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import axios from 'axios';

// Dynamic API URL based on platform with fallback options
const getApiUrls = () => {
  if (Platform.OS === 'web') {
    return ['http://localhost:8081'];
  } else {
    // For Android emulator, try multiple options in order of preference
    return [
      'http://192.168.1.27:8081',  // Your actual IP address (most reliable)
      'http://10.0.2.2:8081',      // Standard Android emulator localhost
      'http://localhost:8081'      // Sometimes works on some emulators
    ];
  }
};

const API_URLS = getApiUrls();
const API_BASE_URL = API_URLS[0];

interface RegisterScreenProps {
  onBackToLogin: () => void;
  onRegisterSuccess: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onBackToLogin, onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!formData.username.trim()) {
      Alert.alert('Erreur', 'Le nom d\'utilisateur est requis');
      return false;
    }
    
    if (formData.username.length < 3) {
      Alert.alert('Erreur', 'Le nom d\'utilisateur doit contenir au moins 3 caractères');
      return false;
    }

    if (!formData.email.trim()) {
      Alert.alert('Erreur', 'L\'email est requis');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide');
      return false;
    }

    if (!formData.password) {
      Alert.alert('Erreur', 'Le mot de passe est requis');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return false;
    }

    return true;
  };

  const tryRegister = async (baseUrl: string) => {
    console.log('Tentative d\'inscription à:', `${baseUrl}/auth/signup`);
    
    const response = await axios.post(`${baseUrl}/auth/signup`, {
      username: formData.username.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      roles: ['ROLE_USER'] // Default role for new users
    }, {
      timeout: 10000, // 10 seconds timeout
    });

    return response;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    console.log('Platform:', Platform.OS);
    console.log('URLs disponibles:', API_URLS);
    
    let lastError = null;
    
    // Try each URL in sequence
    for (let i = 0; i < API_URLS.length; i++) {
      const currentUrl = API_URLS[i];
      try {
        console.log(`Essai ${i + 1}/${API_URLS.length} avec URL:`, currentUrl);
        
        const response = await tryRegister(currentUrl);
        
        console.log('Réponse reçue:', response.data);

        if (response.status === 200) {
          Alert.alert(
            'Succès', 
            'Inscription réussie ! Vous pouvez maintenant vous connecter.',
            [
              {
                text: 'OK',
                onPress: onRegisterSuccess
              }
            ]
          );
          setLoading(false);
          return; // Success, exit the function
        }
      } catch (error: any) {
        console.error(`Erreur avec URL ${currentUrl}:`, error.message);
        lastError = error;
        
        // Handle specific error cases
        if (error.response?.status === 409) {
          // Conflict - user already exists
          const errorMessage = error.response?.data?.message || 'Un utilisateur avec ce nom ou cet email existe déjà';
          Alert.alert('Erreur', errorMessage);
          setLoading(false);
          return;
        }
        
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
    setLoading(false);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Sales Manager Mobile</Text>
      <Text style={styles.subtitle}>Créer un compte</Text>
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nom d'utilisateur *"
          value={formData.username}
          onChangeText={(text) => updateFormData('username', text)}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Email *"
          value={formData.email}
          onChangeText={(text) => updateFormData('email', text)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Mot de passe *"
          value={formData.password}
          onChangeText={(text) => updateFormData('password', text)}
          secureTextEntry
        />
        
        <TextInput
          style={styles.input}
          placeholder="Confirmer le mot de passe *"
          value={formData.confirmPassword}
          onChangeText={(text) => updateFormData('confirmPassword', text)}
          secureTextEntry
        />

        <Text style={styles.requirements}>
          • Le nom d'utilisateur doit contenir au moins 3 caractères{'\n'}
          • Le mot de passe doit contenir au moins 6 caractères{'\n'}
          • L'email doit être valide
        </Text>
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Inscription en cours...' : 'S\'inscrire'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.linkButton} onPress={onBackToLogin}>
          <Text style={styles.linkText}>Déjà un compte ? Se connecter</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 50,
    justifyContent: 'center',
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
  form: {
    width: '100%',
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
  requirements: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    alignItems: 'center',
    padding: 10,
  },
  linkText: {
    color: '#007bff',
    fontSize: 16,
  },
});

export default RegisterScreen;
