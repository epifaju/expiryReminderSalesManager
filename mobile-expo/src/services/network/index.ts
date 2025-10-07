/**
 * Point d'entrée pour tous les services réseau
 * Export centralisé des services de connectivité
 */

// Export du service principal
export { default as NetworkService } from './NetworkService';

// Export des types
export type { NetworkInfo, NetworkChangeListener } from './NetworkService';

// Export des hooks
export { useNetworkStatus, useIsOnline, useNetworkDetails } from '../../hooks/useNetworkStatus';
export type { UseNetworkStatusReturn } from '../../hooks/useNetworkStatus';

