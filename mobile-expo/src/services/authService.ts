import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApiClient, updateApiClientBaseUrl, setTokenProvider } from './apiClient';
import { getApiUrls } from '../config/apiConfig';
import profileService from './profileService';
import { normalizeCurrency, SupportedCurrency } from '../types/currency';
import { persistCurrency, setGlobalCurrency, clearCurrencyCache } from '../utils/currencyStore';

const API_URLS = getApiUrls();

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  roles?: string[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
  preferredCurrency?: SupportedCurrency;
  preferredLanguage?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;
  private authListeners: Array<() => void> = [];

  constructor() {
    // Set up the token provider callback to break the circular dependency
    setTokenProvider(() => this.getToken());
  }

  // Initialize auth service with persistent storage
  async initialize(): Promise<boolean> {
    try {
      console.log('🔄 Initialisation du service d\'authentification...');
      
      // Récupérer le token et l'utilisateur depuis AsyncStorage
      const token = await AsyncStorage.getItem('auth_token');
      const userStr = await AsyncStorage.getItem('auth_user');
      
      if (token && userStr) {
        this.token = token;
        this.user = JSON.parse(userStr);
        if (this.user?.preferredCurrency) {
          setGlobalCurrency(normalizeCurrency(this.user.preferredCurrency));
        }
        console.log('✅ Données utilisateur restaurées:', this.user?.username);
        return true;
      }
      
      console.log('ℹ️ Aucune donnée d\'authentification trouvée');
      return false;
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      return false;
    }
  }

  // Try login with multiple API URLs
  private async tryLogin(baseUrl: string, credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('🔗 Tentative de connexion à:', `${baseUrl}/auth/signin`);
    console.log('📤 Données envoyées:', { username: credentials.username, password: '***' });
    
    try {
      const response = await axios.post(`${baseUrl}/auth/signin`, credentials, {
        timeout: 15000, // 15 seconds timeout (increased)
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        validateStatus: function (status) {
          return status < 500; // Accept any status code less than 500
        }
      });

      console.log('📥 Réponse du serveur:', response.status, response.statusText);
      console.log('📄 Données reçues:', response.data);
      
      if (response.status === 200 && response.data) {
        return response.data;
      } else if (response.status === 401) {
        throw new Error('Nom d\'utilisateur ou mot de passe incorrect');
      } else if (response.status >= 400) {
        throw new Error(`Erreur du serveur: ${response.status} - ${response.data?.message || response.statusText}`);
      } else {
        throw new Error('Réponse inattendue du serveur');
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de la requête:', error.message);
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Impossible de se connecter au serveur ${baseUrl}`);
      } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        throw new Error(`Timeout - Le serveur ${baseUrl} ne répond pas`);
      } else if (error.response) {
        console.error('📄 Réponse d\'erreur:', error.response.data);
        throw new Error(error.response.data?.message || error.message);
      } else {
        throw error;
      }
    }
  }

  // Login method
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('Platform:', Platform.OS);
    console.log('URLs disponibles:', API_URLS);
    
    let lastError = null;
    
    // Try each URL in sequence
    for (let i = 0; i < API_URLS.length; i++) {
      const currentUrl = API_URLS[i];
      try {
        console.log(`Essai ${i + 1}/${API_URLS.length} avec URL:`, currentUrl);
        
        const authResponse = await this.tryLogin(currentUrl, credentials);
        
        console.log('Réponse reçue:', authResponse);

        if (authResponse && authResponse.token) {
          // Store authentication data
          await this.storeAuthData(authResponse);
          
          // Initialize API client with the working URL
          console.log('🔄 Initializing API client with working URL:', currentUrl);
          updateApiClientBaseUrl(currentUrl);
          
          return authResponse;
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
    throw new Error(`${errorMessage}\n\nURLs essayées:\n${API_URLS.join('\n')}\n\nPlatform: ${Platform.OS}`);
  }

  // Register method
  async register(registerData: RegisterData): Promise<any> {
    let lastError = null;
    
    // Try each URL in sequence
    for (let i = 0; i < API_URLS.length; i++) {
      const currentUrl = API_URLS[i];
      try {
        console.log(`Tentative d'inscription ${i + 1}/${API_URLS.length} avec URL:`, currentUrl);
        console.log('Données d\'inscription:', { ...registerData, password: '***' });
        
        const response = await axios.post(`${currentUrl}/auth/signup`, registerData, {
          timeout: 15000, // Increased timeout
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          validateStatus: function (status) {
            return status < 500; // Accept any status code less than 500
          }
        });

        console.log('Réponse d\'inscription:', response.status, response.data);

        if (response.status === 200 && response.data) {
          console.log('Inscription réussie:', response.data);
          
          // Update API client with the working URL for future requests
          updateApiClientBaseUrl(currentUrl);
          
          return response.data;
        } else if (response.status === 409) {
          // Conflict - user already exists
          const errorMessage = response.data?.message || 'Un utilisateur avec ce nom ou cet email existe déjà';
          throw new Error(errorMessage);
        } else if (response.status >= 400) {
          throw new Error(`Erreur du serveur: ${response.status} - ${response.data?.message || response.statusText}`);
        }
      } catch (error: any) {
        console.error(`Erreur d'inscription avec URL ${currentUrl}:`, error.message);
        lastError = error;
        
        // Handle specific error cases
        if (error.response?.status === 409) {
          throw new Error(error.response?.data?.message || 'Un utilisateur avec ce nom ou cet email existe déjà');
        }
        
        if (i < API_URLS.length - 1) {
          console.log('Tentative avec la prochaine URL...');
          continue;
        }
      }
    }
    
    // If we get here, all URLs failed
    console.error('Toutes les URLs ont échoué. Dernière erreur:', lastError);
    const errorMessage = lastError?.response?.data?.message || lastError?.message || 'Impossible de créer le compte';
    throw new Error(`${errorMessage}\n\nURLs essayées:\n${API_URLS.join('\n')}`);
  }

  // Store authentication data with persistent storage
  private async storeAuthData(authResponse: any): Promise<void> {
    try {
      // Le backend peut renvoyer deux formats différents :
      // Format 1 (attendu): { token, user: { id, username, email, roles } }
      // Format 2 (actuel): { token, id, username, email, roles }
      
      // Vérifier que le token existe
      if (!authResponse.token) {
        throw new Error('Token manquant dans la réponse');
      }
      
      this.token = authResponse.token;
      
      // Vérifier si les données utilisateur sont dans un objet 'user' ou au même niveau
      if (authResponse.user) {
        // Format 1: Structure avec objet user
        this.user = {
          ...authResponse.user,
          preferredCurrency: normalizeCurrency(authResponse.user.preferredCurrency),
        };
      } else if (authResponse.id && authResponse.username && authResponse.email) {
        // Format 2: Structure plate - construire l'objet user
        this.user = {
          id: authResponse.id,
          username: authResponse.username,
          email: authResponse.email,
          roles: authResponse.roles || [],
          preferredCurrency: normalizeCurrency(authResponse.preferredCurrency),
          preferredLanguage: authResponse.preferredLanguage,
        };
      } else {
        throw new Error('Format de réponse invalide - données utilisateur manquantes');
      }

      const savedUser = this.user;
      if (savedUser?.preferredCurrency) {
        setGlobalCurrency(savedUser.preferredCurrency);
        await persistCurrency(savedUser.id, savedUser.preferredCurrency);
      }
      
      // Persister les données dans AsyncStorage (this.token est garanti non-null ici)
      await AsyncStorage.setItem('auth_token', this.token as string);
      await AsyncStorage.setItem('auth_user', JSON.stringify(this.user));
      this.notifyAuthChange();
      
      console.log('💾 Token stocké avec persistance:', this.token ? `${this.token.substring(0, 20)}...` : 'ERREUR');
      console.log('👤 Utilisateur stocké avec persistance:', this.user?.username || 'ERREUR');
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw new Error('Erreur lors de la sauvegarde des données d\'authentification');
    }
  }

  // Logout method with persistent storage cleanup
  async logout(): Promise<void> {
    try {
      const userId = this.user?.id;
      // Clear memory
      this.token = null;
      this.user = null;
      
      // Clear AsyncStorage
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      if (userId != null) {
        await clearCurrencyCache(userId);
      }
      this.notifyAuthChange();
      
      console.log('✅ Déconnexion réussie - Données effacées');
    } catch (error) {
      console.error('Error during logout:', error);
      throw new Error('Erreur lors de la déconnexion');
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.token !== null && this.user !== null;
  }

  // Get current token
  getToken(): string | null {
    console.log('🔑 getToken() appelé:', this.token ? `Token disponible (${this.token.substring(0, 20)}...)` : 'Aucun token disponible');
    return this.token;
  }

  // Get current user
  getUser(): User | null {
    return this.user;
  }

  updateLocalUser(updates: Partial<User>): void {
    if (!this.user) {
      return;
    }
    this.user = { ...this.user, ...updates };
    void AsyncStorage.setItem('auth_user', JSON.stringify(this.user));
  }

  onAuthChange(listener: () => void): () => void {
    this.authListeners.push(listener);
    return () => {
      this.authListeners = this.authListeners.filter((l) => l !== listener);
    };
  }

  private notifyAuthChange(): void {
    this.authListeners.forEach((listener) => listener());
  }

  // Get authorization header
  getAuthHeader(): { Authorization: string } | {} {
    if (this.token) {
      return { Authorization: `Bearer ${this.token}` };
    }
    return {};
  }

  // Refresh token (if needed in the future)
  async refreshToken(): Promise<void> {
    // Implementation for token refresh if needed
    // This would depend on your backend implementation
    console.log('Token refresh not implemented yet');
  }

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<User> {
    if (!this.user) {
      throw new Error('No user logged in');
    }

    try {
      // In a real app, you would make an API call here
      // For now, we'll simulate an API call and update locally
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update user locally
      this.user = { ...this.user, ...updates };
      
      console.log('Profile updated:', this.user);
      return this.user;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Unable to update profile');
    }
  }

  // Update user email
  async updateEmail(newEmail: string): Promise<void> {
    if (!this.user) {
      throw new Error('No user logged in');
    }

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        throw new Error('Invalid email format');
      }

      const profile = await profileService.updateProfile({ email: newEmail });
      this.updateLocalUser({
        email: profile.email,
        preferredCurrency: profile.preferredCurrency,
        preferredLanguage: profile.preferredLanguage,
        firstName: profile.firstName,
        lastName: profile.lastName,
      });
      console.log('✅ Email mis à jour:', newEmail);
    } catch (error: any) {
      console.error('Error updating email:', error);
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Unable to update profile';
      throw new Error(message);
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!this.user) {
      throw new Error('No user logged in');
    }

    try {
      console.log('🔐 Tentative de changement de mot de passe...');

      // Validation basique
      if (!currentPassword || !newPassword) {
        throw new Error('Tous les champs sont requis');
      }

      if (newPassword.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }

      if (currentPassword === newPassword) {
        throw new Error('Le nouveau mot de passe doit être différent de l\'ancien');
      }

      await profileService.changePassword(currentPassword, newPassword);
      console.log('✅ Mot de passe changé avec succès');
      
      // Important: Ne pas stocker le mot de passe côté client
      // Le backend s'occupe de la gestion sécurisée des mots de passe
      
    } catch (error: any) {
      console.error('❌ Erreur changement mot de passe:', error);
      
      // Gérer les différents types d'erreurs
      if (error.response?.status === 401) {
        throw new Error('Mot de passe actuel incorrect');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Données invalides');
      } else if (error.message) {
        throw error;
      } else {
        throw new Error('Erreur lors du changement de mot de passe');
      }
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
