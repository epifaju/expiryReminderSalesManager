import apiClient, {handleApiError} from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types pour l'authentification
export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
}

export interface JwtResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
  roles: string[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  /**
   * Connexion utilisateur
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<JwtResponse>('/api/auth/signin', credentials);
      const data = response.data;

      // Stocker le token et les données utilisateur
      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify({
        id: data.id,
        username: data.username,
        email: data.email,
        roles: data.roles,
      }));

      return {
        user: {
          id: data.id,
          username: data.username,
          email: data.email,
          roles: data.roles,
        },
        token: data.token,
      };
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Inscription utilisateur
   */
  async signup(userData: SignupRequest): Promise<{message: string}> {
    try {
      const response = await apiClient.post('/api/auth/signup', userData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Déconnexion utilisateur
   */
  async logout(): Promise<void> {
    try {
      // Supprimer les données locales
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      
      // Optionnel: appeler l'endpoint de déconnexion du backend si disponible
      // await apiClient.post('/api/auth/signout');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      return !!token;
    } catch (error) {
      return false;
    }
  }

  /**
   * Récupérer les données utilisateur stockées
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Récupérer le token stocké
   */
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      return null;
    }
  }

  /**
   * Vérifier la validité du token (optionnel)
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await apiClient.get('/api/auth/validate');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Rafraîchir le token (si implémenté dans le backend)
   */
  async refreshToken(): Promise<string | null> {
    try {
      const response = await apiClient.post('/api/auth/refresh');
      const newToken = response.data.token;
      
      if (newToken) {
        await AsyncStorage.setItem('auth_token', newToken);
        return newToken;
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      return null;
    }
  }
}

export default new AuthService();
