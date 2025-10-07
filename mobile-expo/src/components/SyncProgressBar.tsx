/**
 * Composant Barre de progression de synchronisation
 * Affichage de la progression des opérations de synchronisation
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useSyncQueue } from '../hooks/useSyncQueue';

/**
 * Interface pour les props du composant
 */
export interface SyncProgressBarProps {
  /** Style personnalisé pour le conteneur */
  containerStyle?: any;
  /** Hauteur de la barre */
  height?: number;
  /** Afficher le texte de progression */
  showText?: boolean;
  /** Afficher l'animation */
  animated?: boolean;
  /** Couleur personnalisée */
  color?: string;
}

/**
 * Composant Barre de progression de synchronisation
 * Affiche la progression en temps réel
 */
const SyncProgressBar: React.FC<SyncProgressBarProps> = ({
  containerStyle,
  height = 4,
  showText = true,
  animated = true,
  color = '#2196F3'
}) => {
  const { isSyncing, queueStats, pendingCount } = useSyncQueue();
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const indeterminateAnim = useRef(new Animated.Value(0)).current;

  /**
   * Calcule le pourcentage de progression
   */
  const calculateProgress = (): number => {
    if (!isSyncing) return 0;
    
    // Estimation basée sur le nombre d'éléments traités
    const totalProcessed = queueStats.pendingCount + 
      (queueStats.lastSyncTime ? 10 : 0); // Estimation des éléments déjà traités
    
    if (totalProcessed === 0) return 0;
    
    return Math.min((totalProcessed - pendingCount) / totalProcessed, 1);
  };

  /**
   * Animation de progression déterminée
   */
  useEffect(() => {
    if (isSyncing && animated) {
      const progress = calculateProgress();
      
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(0);
    }
  }, [isSyncing, pendingCount, animated, progressAnim]);

  /**
   * Animation de progression indéterminée
   */
  useEffect(() => {
    if (isSyncing && animated && pendingCount === 0) {
      // Mode indéterminé quand on ne connaît pas le total
      const indeterminateAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(indeterminateAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(indeterminateAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
      
      indeterminateAnimation.start();
      
      return () => indeterminateAnimation.stop();
    } else {
      indeterminateAnim.setValue(0);
    }
  }, [isSyncing, pendingCount, animated, indeterminateAnim]);

  /**
   * Détermine le texte de progression
   */
  const getProgressText = (): string => {
    if (!isSyncing) return '';
    
    if (pendingCount > 0) {
      return `${pendingCount} éléments restants`;
    }
    
    return 'Finalisation...';
  };

  /**
   * Détermine si on utilise le mode indéterminé
   */
  const isIndeterminate = (): boolean => {
    return isSyncing && pendingCount === 0;
  };

  const progressText = getProgressText();
  const progress = calculateProgress();

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Barre de progression */}
      <View style={[styles.progressTrack, { height }]}>
        {isSyncing && (
          <>
            {isIndeterminate() ? (
              // Mode indéterminé
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: color,
                    height,
                    width: indeterminateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['20%', '80%'],
                    }),
                    left: indeterminateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '20%'],
                    }),
                  }
                ]}
              />
            ) : (
              // Mode déterminé
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: color,
                    height,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  }
                ]}
              />
            )}
          </>
        )}
      </View>

      {/* Texte de progression */}
      {showText && progressText && (
        <View style={styles.textContainer}>
          <Text style={styles.progressText}>{progressText}</Text>
          {!isIndeterminate() && (
            <Text style={styles.progressPercent}>
              {Math.round(progress * 100)}%
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  progressTrack: {
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },

  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 2,
  },

  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },

  progressText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },

  progressPercent: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
});

export default SyncProgressBar;

