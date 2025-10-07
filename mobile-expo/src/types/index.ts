/**
 * Point d'entrée pour tous les types de l'application
 * Export centralisé de tous les modèles de données
 */

// Export de tous les types depuis models.ts
export * from './models';

// Types spécifiques à l'application (à ajouter selon les besoins)
export interface AppConfig {
  apiBaseUrl: string;
  syncInterval: number;
  maxRetries: number;
  batchSize: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
}

// Types pour les notifications
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Types pour les préférences utilisateur
export interface UserPreferences {
  language: 'fr' | 'pt' | 'en';
  currency: string;
  dateFormat: string;
  autoSync: boolean;
  wifiOnlySync: boolean;
  batterySaver: boolean;
  minBatteryPercent: number;
}

