import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface Theme {
  isDark: boolean;
  colors: {
    background: string;
    surface: string;
    card: string;
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    headerBackground: string;
    headerText: string;
  };
}

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
}

const lightTheme: Theme = {
  isDark: false,
  colors: {
    background: '#f5f5f5',
    surface: '#ffffff',
    card: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    primary: '#667eea',
    border: '#e0e0e0',
    error: '#dc3545',
    success: '#28a745',
    warning: '#ffc107',
    info: '#1976d2',
    headerBackground: '#667eea',
    headerText: '#ffffff',
  },
};

const darkTheme: Theme = {
  isDark: true,
  colors: {
    background: '#121212',
    surface: '#1e1e1e',
    card: '#2a2a2a',
    text: '#ffffff',
    textSecondary: '#b0b0b0',
    primary: '#8b9dff',
    border: '#3a3a3a',
    error: '#ff6b6b',
    success: '#51cf66',
    warning: '#ffd43b',
    info: '#4dabf7',
    headerBackground: '#1e1e1e',
    headerText: '#ffffff',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [theme, setTheme] = useState<Theme>(lightTheme);

  // Charger le thème sauvegardé au démarrage
  useEffect(() => {
    loadThemeMode();
  }, []);

  // Appliquer le thème quand le mode change
  useEffect(() => {
    applyTheme();
  }, [themeMode, systemColorScheme]);

  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('theme_mode');
      if (savedMode) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Erreur chargement thème:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('theme_mode', mode);
      setThemeModeState(mode);
      console.log('✅ Thème changé:', mode);
    } catch (error) {
      console.error('Erreur sauvegarde thème:', error);
    }
  };

  const applyTheme = () => {
    let isDarkMode = false;

    if (themeMode === 'auto') {
      // En mode auto, suivre le système ou l'heure
      if (systemColorScheme) {
        isDarkMode = systemColorScheme === 'dark';
      } else {
        // Fallback: basé sur l'heure (20h-6h = nuit)
        const hour = new Date().getHours();
        isDarkMode = hour >= 20 || hour < 6;
      }
    } else {
      isDarkMode = themeMode === 'dark';
    }

    setTheme(isDarkMode ? darkTheme : lightTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        setThemeMode,
        isDark: theme.isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

