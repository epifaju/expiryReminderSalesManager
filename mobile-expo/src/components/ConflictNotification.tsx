/**
 * Notification de conflit
 * 
 * Composant pour afficher une notification discrète en cas de conflit
 * Peut être affiché en haut ou en bas de l'écran
 * 
 * @author Sales Manager Team
 * @version 1.0
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useConflicts } from '../hooks/useConflicts';
import { useNavigation } from '@react-navigation/native';

interface ConflictNotificationProps {
  onPress?: () => void;
  position?: 'top' | 'bottom';
}

/**
 * Composant de notification
 */
export const ConflictNotification: React.FC<ConflictNotificationProps> = ({
  onPress,
  position = 'top',
}) => {
  const { pendingConflicts, hasPendingConflicts } = useConflicts();
  const navigation = useNavigation();
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Navigation par défaut vers l'écran de résolution
      (navigation as any).navigate('ConflictResolution');
    }
  };
  
  if (!hasPendingConflicts) return null;
  
  return (
    <TouchableOpacity
      style={[
        styles.notification,
        position === 'top' ? styles.notificationTop : styles.notificationBottom,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.notificationIcon}>⚠️</Text>
        <View style={styles.notificationText}>
          <Text style={styles.notificationTitle}>
            {pendingConflicts.length} conflit{pendingConflicts.length > 1 ? 's' : ''} détecté{pendingConflicts.length > 1 ? 's' : ''}
          </Text>
          <Text style={styles.notificationSubtitle}>
            Appuyez pour résoudre
          </Text>
        </View>
        <Text style={styles.notificationArrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Banner de conflit (version inline)
 */
export const ConflictBanner: React.FC<{
  count: number;
  onPress: () => void;
}> = ({ count, onPress }) => {
  if (count === 0) return null;
  
  return (
    <TouchableOpacity
      style={styles.banner}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.bannerContent}>
        <Text style={styles.bannerIcon}>⚠️</Text>
        <Text style={styles.bannerText}>
          {count} conflit{count > 1 ? 's' : ''} de synchronisation
        </Text>
        <Text style={styles.bannerAction}>Résoudre →</Text>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Indicateur de conflit (petit badge)
 */
export const ConflictIndicator: React.FC = () => {
  const { pendingCount } = useConflicts();
  
  if (pendingCount === 0) return null;
  
  return (
    <View style={styles.indicator}>
      <View style={styles.indicatorDot} />
      <Text style={styles.indicatorText}>{pendingCount}</Text>
    </View>
  );
};

/**
 * Styles
 */
const styles = StyleSheet.create({
  notification: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationTop: {
    paddingTop: 8,
  },
  notificationBottom: {
    paddingBottom: 8,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  notificationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  notificationSubtitle: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 2,
  },
  notificationArrow: {
    fontSize: 24,
    color: '#92400E',
  },
  
  // Banner
  banner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
    margin: 12,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  bannerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E',
  },
  bannerAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  
  // Indicator
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  indicatorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#991B1B',
  },
});

export default ConflictNotification;

