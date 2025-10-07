/**
 * Composant Indicateur réseau simple
 * Indicateur minimaliste pour l'état de connectivité
 */

import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSyncQueue } from '../hooks/useSyncQueue';

/**
 * Interface pour les props du composant
 */
export interface NetworkIndicatorProps {
  /** Taille de l'indicateur */
  size?: number;
  /** Style personnalisé */
  style?: any;
  /** Afficher l'animation de pulsation */
  showPulse?: boolean;
  /** Position dans un conteneur */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Composant Indicateur réseau simple
 * Cercle coloré avec animation optionnelle
 */
const NetworkIndicator: React.FC<NetworkIndicatorProps> = ({
  size = 12,
  style,
  showPulse = true,
  position
}) => {
  const { isOnline, isConnected } = useNetworkStatus();
  const { pendingCount, isSyncing } = useSyncQueue();

  // Animation de pulsation
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (showPulse && (isSyncing || pendingCount > 0)) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isSyncing, pendingCount, showPulse, pulseAnim]);

  /**
   * Détermine la couleur de l'indicateur
   */
  const getIndicatorColor = (): string => {
    if (isSyncing) return '#FF9800'; // Orange - Synchronisation
    if (pendingCount > 0 && !isOnline) return '#F44336'; // Rouge - Hors ligne avec attente
    if (pendingCount > 0 && isOnline) return '#FF5722'; // Rouge-orange - En attente
    if (isOnline) return '#4CAF50'; // Vert - En ligne
    if (isConnected) return '#FF9800'; // Orange - Réseau local
    return '#9E9E9E'; // Gris - Hors ligne
  };

  /**
   * Détermine les styles de position
   */
  const getPositionStyles = () => {
    if (!position) return {};
    
    switch (position) {
      case 'top-left':
        return { position: 'absolute', top: 8, left: 8 };
      case 'top-right':
        return { position: 'absolute', top: 8, right: 8 };
      case 'bottom-left':
        return { position: 'absolute', bottom: 8, left: 8 };
      case 'bottom-right':
        return { position: 'absolute', bottom: 8, right: 8 };
      default:
        return {};
    }
  };

  const backgroundColor = getIndicatorColor();
  const positionStyles = getPositionStyles();

  const animatedStyle = showPulse && (isSyncing || pendingCount > 0) ? {
    transform: [{ scale: pulseAnim }]
  } : {};

  return (
    <Animated.View
      style={[
        styles.indicator,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        positionStyles,
        style,
        animatedStyle
      ]}
    />
  );
};

const styles = StyleSheet.create({
  indicator: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
});

export default NetworkIndicator;

