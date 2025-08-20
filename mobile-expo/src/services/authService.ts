import axios from 'axios';
import { Platform } from 'react-native';
import { initializeApiClient, updateApiClientBaseUrl, setTokenProvider } from './apiClient';

// Dynamic API URL based on platform with fallback options
const getApiUrls = () => {
  if (Platform.OS === 'web') {
    return ['http://localhost:8080'];
  } else {
    // For Android emulator, try multiple options in order of preference
    // Backend Spring Boot runs on port 8080
    return [
      'http://192.168.1.27:8080',  // Your actual IP address
      'http://10.0.2.2:8080',      // Standard Android emulator localhost
      'http://localhost:8080',     // Sometimes works on some emulators
      'http://127.0.0.1:8080'      // Local loopback
    ];
  }
};

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
}

export interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    // Set up the token provider callback to break the circular dependency
    setTokenProvider(() => this.getToken());
  }

  // Initialize auth service (simplified version without persistent storage)
  async initialize(): Promise<boolean> {
    // For now, just return false - no persistent storage
    return false;
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
  async register(registerData: RegisterData): Promise<AuthResponse> {
    let lastError = null;
    
    // Try each URL in sequence
    for (let i = 0; i < API_URLS.length; i++) {
      const currentUrl = API_URLS[i];
      try {
        console.log(`Tentative d'inscription ${i + 1}/${API_URLS.length} avec URL:`, currentUrl);
        
        const response = await axios.post(`${currentUrl}/auth/signup`, registerData, {
          timeout: 5000,
        });

        if (response.data) {
          console.log('Inscription réussie:', response.data);
          return response.data;
        }
      } catch (error: any) {
        console.error(`Erreur d'inscription avec URL ${currentUrl}:`, error.message);
        lastError = error;
        
        if (i < API_URLS.length - 1) {
          continue;
        }
      }
    }
    
    const errorMessage = lastError?.response?.data?.message || lastError?.message || 'Impossible de créer le compte';
    throw new Error(errorMessage);
  }

  // Store authentication data (simplified version without persistent storage)
  private async storeAuthData(authResponse: AuthResponse): Promise<void> {
    try {
      this.token = authResponse.token;
      this.user = authResponse.user;
      // For now, just store in memory - no persistent storage
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw new Error('Erreur lors de la sauvegarde des données d\'authentification');
    }
  }

  // Logout method (simplified version without persistent storage)
  async logout(): Promise<void> {
    try {
      // Clear memory
      this.token = null;
      this.user = null;
      
      console.log('Déconnexion réussie');
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
    return this.token;
  }

  // Get current user
  getUser(): User | null {
    return this.user;
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
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
