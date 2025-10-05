import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import authService from '../services/authService';

interface RegisterScreenProps {
  onBackToLogin: () => void;
  onRegisterSuccess: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onBackToLogin, onRegisterSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!formData.username.trim()) {
      Alert.alert(t('common.error'), t('validation.usernameRequired'));
      return false;
    }
    
    if (formData.username.length < 3) {
      Alert.alert(t('common.error'), t('validation.usernameMinLength'));
      return false;
    }

    if (!formData.email.trim()) {
      Alert.alert(t('common.error'), t('validation.emailRequired'));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert(t('common.error'), t('validation.invalidEmail'));
      return false;
    }

    if (!formData.password) {
      Alert.alert(t('common.error'), t('validation.passwordRequired'));
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert(t('common.error'), t('validation.passwordMinLength'));
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert(t('common.error'), t('validation.passwordsNotMatch'));
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      console.log('Tentative d\'inscription avec les données:', {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: '***'
      });

      const registerData = {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        roles: ['ROLE_USER'] // Default role for new users
      };

      const response = await authService.register(registerData);
      
      console.log('Inscription réussie:', response);
      
      Alert.alert(
        t('common.success'), 
        t('auth.registerSuccess'),
        [
          {
            text: t('common.ok'),
            onPress: onRegisterSuccess
          }
        ]
      );
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      
      let errorMessage = 'Une erreur est survenue lors de l\'inscription';
      
      if (error.message) {
        if (error.message.includes('Username already exists')) {
          errorMessage = 'Ce nom d\'utilisateur existe déjà. Veuillez en choisir un autre.';
        } else if (error.message.includes('Email already in use')) {
          errorMessage = 'Cette adresse email est déjà utilisée. Veuillez en utiliser une autre.';
        } else if (error.message.includes('Impossible de se connecter')) {
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(t('auth.registerError'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>{t('app.name')}</Text>
      <Text style={styles.subtitle}>{t('auth.createAccount')}</Text>
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder={`${t('auth.username')} *`}
          value={formData.username}
          onChangeText={(text) => updateFormData('username', text)}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TextInput
          style={styles.input}
          placeholder={`${t('auth.email')} *`}
          value={formData.email}
          onChangeText={(text) => updateFormData('email', text)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TextInput
          style={styles.input}
          placeholder={`${t('auth.password')} *`}
          value={formData.password}
          onChangeText={(text) => updateFormData('password', text)}
          secureTextEntry
        />
        
        <TextInput
          style={styles.input}
          placeholder={`${t('auth.confirmPassword')} *`}
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
            {loading ? t('auth.registering') : t('auth.register')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.linkButton} onPress={onBackToLogin}>
          <Text style={styles.linkText}>{t('auth.haveAccount')}</Text>
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
