/**
 * Composant Badge d'état réseau
 * Affiche l'état de connectivité et de synchronisation en temps réel
 */

import React from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSyncQueue } from '../hooks/useSyncQueue';

/**
 * Interface pour les props du composant
 */
export interface NetworkStatusBadgeProps {
  /** Style personnalisé pour le conteneur */
  containerStyle?: any;
  /** Style personnalisé pour le texte */
  textStyle?: any;
  /** Taille du badge */
  size?: 'small' | 'medium' | 'large';
  /** Afficher le nombre d'éléments en attente */
  showPendingCount?: boolean;
  /** Afficher l'animation de pulsation */
  showPulseAnimation?: boolean;
  /** Position du badge */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

/**
 * Composant Badge d'état réseau
 * Combine les informations de connectivité et de synchronisation
 */
const NetworkStatusBadge: React.FC<NetworkStatusBadgeProps> = ({
  containerStyle,
  textStyle,
  size = 'medium',
  showPendingCount = true,
  showPulseAnimation = true,
  position = 'top-right'
}) => {
  const { isOnline, isConnected, networkType, disconnectionDuration } = useNetworkStatus();
  const { pendingCount, isSyncing } = useSyncQueue();

  // Animation de pulsation
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (showPulseAnimation && isSyncing) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    }
  }, [isSyncing, showPulseAnimation, pulseAnim]);

  /**
   * Détermine la couleur du badge selon l'état
   */
  const getStatusColor = (): string => {
    if (isSyncing) return '#FF9800'; // Orange - Synchronisation en cours
    if (pendingCount > 0 && !isOnline) return '#F44336'; // Rouge - Hors ligne avec éléments en attente
    if (pendingCount > 0 && isOnline) return '#FF5722'; // Rouge-orange - En ligne avec éléments en attente
    if (isOnline) return '#4CAF50'; // Vert - En ligne, synchronisé
    if (isConnected) return '#FF9800'; // Orange - Réseau local sans internet
    return '#9E9E9E'; // Gris - Hors ligne
  };

  /**
   * Détermine le texte du statut
   */
  const getStatusText = (): string => {
    if (isSyncing) return 'Synchronisation...';
    if (!isOnline && pendingCount > 0) return `${pendingCount} en attente`;
    if (isOnline && pendingCount > 0) return `${pendingCount} à synchroniser`;
    if (isOnline) return 'Synchronisé';
    if (isConnected) return 'Réseau local';
    return 'Hors ligne';
  };

  /**
   * Détermine l'icône du statut
   */
  const getStatusIcon = (): string => {
    if (isSyncing) return '🔄';
    if (!isOnline && pendingCount > 0) return '⏳';
    if (isOnline && pendingCount > 0) return '📤';
    if (isOnline) return '✅';
    if (isConnected) return '🟡';
    return '❌';
  };

  /**
   * Détermine le texte de détail
   */
  const getDetailText = (): string | null => {
    if (disconnectionDuration && !isOnline) {
      return `Déconnecté depuis ${disconnectionDuration}`;
    }
    if (networkType && isOnline) {
      return `Via ${networkType}`;
    }
    return null;
  };

  /**
   * Détermine la taille du badge
   */
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          text: styles.smallText,
          icon: styles.smallIcon,
          detail: styles.smallDetail
        };
      case 'large':
        return {
          container: styles.largeContainer,
          text: styles.largeText,
          icon: styles.largeIcon,
          detail: styles.largeDetail
        };
      default: // medium
        return {
          container: styles.mediumContainer,
          text: styles.mediumText,
          icon: styles.mediumIcon,
          detail: styles.mediumDetail
        };
    }
  };

  /**
   * Détermine la position du badge
   */
  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return styles.topLeft;
      case 'top-right':
        return styles.topRight;
      case 'bottom-left':
        return styles.bottomLeft;
      case 'bottom-right':
        return styles.bottomRight;
      case 'center':
        return styles.center;
      default:
        return styles.topRight;
    }
  };

  const sizeStyles = getSizeStyles();
  const positionStyles = getPositionStyles();
  const backgroundColor = getStatusColor();
  const statusText = getStatusText();
  const statusIcon = getStatusIcon();
  const detailText = getDetailText();

  const animatedStyle = showPulseAnimation && isSyncing ? {
    transform: [{ scale: pulseAnim }]
  } : {};

  return (
    <Animated.View
      style={[
        styles.container,
        sizeStyles.container,
        positionStyles,
        { backgroundColor },
        containerStyle,
        animatedStyle
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.icon, sizeStyles.icon]}>
          {statusIcon}
        </Text>
        
        <View style={styles.textContainer}>
          <Text style={[styles.text, sizeStyles.text, textStyle]}>
            {statusText}
          </Text>
          
          {detailText && (
            <Text style={[styles.detail, sizeStyles.detail]}>
              {detailText}
            </Text>
          )}
        </View>

        {showPendingCount && pendingCount > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {pendingCount > 99 ? '99+' : pendingCount.toString()}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  
  // Tailles
  smallContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
  },
  mediumContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
  },
  largeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 100,
  },

  // Positions
  topLeft: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 1000,
  },
  topRight: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 1000,
  },
  bottomLeft: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    zIndex: 1000,
  },
  bottomRight: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 1000,
  },
  center: {
    alignSelf: 'center',
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  icon: {
    marginRight: 6,
  },
  smallIcon: {
    fontSize: 12,
  },
  mediumIcon: {
    fontSize: 16,
  },
  largeIcon: {
    fontSize: 20,
  },

  textContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },

  text: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'left',
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
  },

  detail: {
    color: 'white',
    opacity: 0.9,
    fontSize: 10,
    marginTop: 1,
  },
  smallDetail: {
    fontSize: 8,
  },
  mediumDetail: {
    fontSize: 10,
  },
  largeDetail: {
    fontSize: 11,
  },

  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
    minWidth: 20,
    alignItems: 'center',
  },

  countText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default NetworkStatusBadge;


