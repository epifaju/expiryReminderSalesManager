/**
 * Hook React personnalisé pour utiliser le NetworkService
 * Fournit l'état de connectivité et les fonctions utilitaires
 */

import { useState, useEffect, useCallback } from 'react';
import NetworkService, { NetworkInfo, NetworkChangeListener } from '../services/network/NetworkService';

/**
 * Interface pour le retour du hook
 */
export interface UseNetworkStatusReturn {
  /** État de connectivité complet */
  networkInfo: NetworkInfo;
  /** Indique si l'appareil est en ligne (connecté ET internet accessible) */
  isOnline: boolean;
  /** Indique si l'appareil est connecté à un réseau */
  isConnected: boolean;
  /** Indique si internet est accessible */
  isInternetReachable: boolean;
  /** Type de connexion réseau */
  networkType: string | null;
  /** Détails de la connexion réseau */
  networkDetails: any;
  /** Dernière heure de connexion */
  lastConnectionTime: string | null;
  /** Dernière heure de déconnexion */
  lastDisconnectionTime: string | null;
  /** Durée de déconnexion formatée */
  disconnectionDuration: string | null;
  /** Fonction pour forcer une vérification réseau */
  refreshNetwork: () => Promise<NetworkInfo>;
  /** Statut du service */
  serviceStatus: ReturnType<typeof NetworkService.getServiceStatus>;
}

/**
 * Hook pour utiliser l'état de connectivité réseau
 * @returns Objet avec toutes les informations et fonctions de réseau
 */
export const useNetworkStatus = (): UseNetworkStatusReturn => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    isConnected: false,
    isInternetReachable: false,
    type: null,
    details: null,
    timestamp: new Date().toISOString()
  });

  const [serviceStatus, setServiceStatus] = useState(
    NetworkService.getServiceStatus()
  );

  /**
   * Gère les changements d'état du réseau
   */
  const handleNetworkChange: NetworkChangeListener = useCallback((info: NetworkInfo) => {
    console.log('[useNetworkStatus] Changement de réseau détecté:', info);
    setNetworkInfo(info);
    setServiceStatus(NetworkService.getServiceStatus());
  }, []);

  /**
   * Initialise le service réseau et s'abonne aux changements
   */
  useEffect(() => {
    let isMounted = true;
    let removeListener: (() => void) | null = null;

    const initializeNetwork = async () => {
      try {
        // Initialiser le service si pas déjà fait
        if (!NetworkService.isServiceInitialized()) {
          await NetworkService.initialize();
        }

        if (isMounted) {
          // S'abonner aux changements
          removeListener = NetworkService.addListener(handleNetworkChange);
          
          // Récupérer l'état initial
          const initialInfo = NetworkService.getNetworkInfo();
          const initialStatus = NetworkService.getServiceStatus();
          
          setNetworkInfo(initialInfo);
          setServiceStatus(initialStatus);
          
          console.log('[useNetworkStatus] Hook initialisé avec état:', initialInfo);
        }
      } catch (error) {
        console.error('[useNetworkStatus] Erreur lors de l\'initialisation:', error);
      }
    };

    initializeNetwork();

    // Cleanup function
    return () => {
      isMounted = false;
      if (removeListener) {
        removeListener();
      }
    };
  }, [handleNetworkChange]);

  /**
   * Force une vérification de l'état du réseau
   */
  const refreshNetwork = useCallback(async (): Promise<NetworkInfo> => {
    try {
      const refreshedInfo = await NetworkService.refreshNetworkState();
      setNetworkInfo(refreshedInfo);
      setServiceStatus(NetworkService.getServiceStatus());
      return refreshedInfo;
    } catch (error) {
      console.error('[useNetworkStatus] Erreur lors du rafraîchissement:', error);
      throw error;
    }
  }, []);

  return {
    networkInfo,
    isOnline: networkInfo.isConnected && networkInfo.isInternetReachable,
    isConnected: networkInfo.isConnected,
    isInternetReachable: networkInfo.isInternetReachable,
    networkType: networkInfo.type,
    networkDetails: networkInfo.details,
    lastConnectionTime: serviceStatus.lastConnection,
    lastDisconnectionTime: serviceStatus.lastDisconnection,
    disconnectionDuration: serviceStatus.disconnectionDuration,
    refreshNetwork,
    serviceStatus
  };
};

/**
 * Hook simplifié pour vérifier uniquement si l'appareil est en ligne
 * @returns true si en ligne, false sinon
 */
export const useIsOnline = (): boolean => {
  const { isOnline } = useNetworkStatus();
  return isOnline;
};

/**
 * Hook pour obtenir des informations réseau détaillées
 * @returns Objet avec toutes les informations réseau
 */
export const useNetworkDetails = () => {
  const { networkInfo, serviceStatus } = useNetworkStatus();
  
  return {
    ...networkInfo,
    ...serviceStatus
  };
};

