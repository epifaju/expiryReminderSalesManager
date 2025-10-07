/**
 * Composant Notification de synchronisation
 * Toast notification pour les événements de synchronisation
 */

import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions,
  TouchableOpacity,
  Easing 
} from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSyncQueue } from '../hooks/useSyncQueue';

/**
 * Interface pour les props du composant
 */
export interface SyncNotificationProps {
  /** Style personnalisé */
  style?: any;
  /** Durée d'affichage en millisecondes */
  duration?: number;
  /** Position du toast */
  position?: 'top' | 'bottom';
  /** Callback lors de la fermeture */
  onClose?: () => void;
}

/**
 * Types de notifications
 */
type NotificationType = 'success' | 'error' | 'info' | 'warning';

/**
 * Interface pour une notification
 */
interface NotificationData {
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
}

/**
 * Composant Notification de synchronisation
 * Affiche des toasts pour les événements de synchronisation
 */
const SyncNotification: React.FC<SyncNotificationProps> = ({
  style,
  duration = 4000,
  position = 'top',
  onClose
}) => {
  const { isOnline } = useNetworkStatus();
  const { isSyncing, pendingCount, lastError } = useSyncQueue();
  
  const [notification, setNotification] = React.useState<NotificationData | null>(null);
  const [previousStates, setPreviousStates] = React.useState({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    lastError: null
  });

  const slideAnim = useRef(new Animated.Value(-200)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Affiche une notification
   */
  const showNotification = (data: NotificationData) => {
    setNotification(data);
    
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      hideNotification();
    }, duration);
  };

  /**
   * Cache la notification
   */
  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: position === 'top' ? -200 : 200,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setNotification(null);
      onClose?.();
    });
  };

  /**
   * Détermine la couleur selon le type de notification
   */
  const getNotificationColor = (type: NotificationType): string => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'warning':
        return '#FF9800';
      case 'info':
      default:
        return '#2196F3';
    }
  };

  /**
   * Détermine l'icône selon le type de notification
   */
  const getNotificationIcon = (type: NotificationType): string => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  /**
   * Surveille les changements d'état pour déclencher les notifications
   */
  useEffect(() => {
    // Notification de reconnexion
    if (isOnline && !previousStates.isOnline) {
      showNotification({
        type: 'success',
        title: 'Connexion rétablie',
        message: 'Synchronisation automatique en cours...',
        timestamp: Date.now()
      });
    }

    // Notification de déconnexion
    if (!isOnline && previousStates.isOnline) {
      showNotification({
        type: 'warning',
        title: 'Connexion perdue',
        message: 'Les données seront synchronisées au retour de connexion',
        timestamp: Date.now()
      });
    }

    // Notification de début de synchronisation
    if (isSyncing && !previousStates.isSyncing && pendingCount > 0) {
      showNotification({
        type: 'info',
        title: 'Synchronisation',
        message: `${pendingCount} éléments en cours de synchronisation`,
        timestamp: Date.now()
      });
    }

    // Notification de fin de synchronisation
    if (!isSyncing && previousStates.isSyncing && pendingCount === 0) {
      showNotification({
        type: 'success',
        title: 'Synchronisation terminée',
        message: 'Toutes les données sont à jour',
        timestamp: Date.now()
      });
    }

    // Notification d'éléments en attente
    if (pendingCount > previousStates.pendingCount && pendingCount > 0 && !isOnline) {
      showNotification({
        type: 'warning',
        title: 'Éléments en attente',
        message: `${pendingCount} éléments attendent la synchronisation`,
        timestamp: Date.now()
      });
    }

    // Notification d'erreur
    if (lastError && lastError !== previousStates.lastError) {
      showNotification({
        type: 'error',
        title: 'Erreur de synchronisation',
        message: lastError,
        timestamp: Date.now()
      });
    }

    // Mettre à jour les états précédents
    setPreviousStates({
      isOnline,
      isSyncing,
      pendingCount,
      lastError
    });
  }, [isOnline, isSyncing, pendingCount, lastError, previousStates]);

  // Nettoyage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!notification) {
    return null;
  }

  const backgroundColor = getNotificationColor(notification.type);
  const icon = getNotificationIcon(notification.type);

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.topPosition : styles.bottomPosition,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
        style
      ]}
    >
      <View style={[styles.notification, { backgroundColor }]}>
        <View style={styles.content}>
          <Text style={styles.icon}>{icon}</Text>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>{notification.title}</Text>
            <Text style={styles.message}>{notification.message}</Text>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={hideNotification}
            activeOpacity={0.7}
          >
            <Text style={styles.closeIcon}>×</Text>
          </TouchableOpacity>
        </View>

        {/* Barre de progression pour l'auto-dismiss */}
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                width: opacityAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
  },

  topPosition: {
    top: 60,
  },

  bottomPosition: {
    bottom: 100,
  },

  notification: {
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },

  icon: {
    fontSize: 20,
    marginRight: 12,
  },

  textContainer: {
    flex: 1,
  },

  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },

  message: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 16,
  },

  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  closeIcon: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },

  progressContainer: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  progressBar: {
    height: 2,
  },
});

export default SyncNotification;

