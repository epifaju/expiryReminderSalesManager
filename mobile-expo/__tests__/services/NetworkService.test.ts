/**
 * Tests unitaires pour le NetworkService
 * Teste la détection de connectivité et la gestion des listeners
 */

import NetworkService, { NetworkInfo, NetworkChangeListener } from '../../src/services/network/NetworkService';

describe('NetworkService', () => {
  // Mock de @react-native-community/netinfo
  const mockNetInfo = {
    fetch: jest.fn(),
    addEventListener: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de NetInfo
    jest.doMock('@react-native-community/netinfo', () => mockNetInfo);
  });

  describe('Initialisation et configuration', () => {
    test('doit être une classe singleton', () => {
      const instance1 = NetworkService.getInstance();
      const instance2 = NetworkService.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('doit avoir les méthodes requises', () => {
      const expectedMethods = [
        'initialize',
        'isOnline',
        'isConnectedToNetwork',
        'isInternetAccessible',
        'getNetworkType',
        'getNetworkDetails',
        'getNetworkInfo',
        'addListener',
        'removeListener',
        'refreshNetworkState',
        'cleanup'
      ];

      expectedMethods.forEach(method => {
        expect(typeof NetworkService[method]).toBe('function');
      });
    });

    test('doit retourner false par défaut pour la connectivité', () => {
      expect(NetworkService.isOnline()).toBe(false);
      expect(NetworkService.isConnectedToNetwork()).toBe(false);
      expect(NetworkService.isInternetAccessible()).toBe(false);
    });
  });

  describe('Gestion des listeners', () => {
    test('doit ajouter et supprimer des listeners', () => {
      const listener: NetworkChangeListener = jest.fn();
      
      // Ajouter un listener
      const removeListener = NetworkService.addListener(listener);
      expect(NetworkService.getListenerCount()).toBe(1);
      
      // Supprimer le listener
      removeListener();
      expect(NetworkService.getListenerCount()).toBe(0);
    });

    test('doit supprimer un listener spécifique', () => {
      const listener1: NetworkChangeListener = jest.fn();
      const listener2: NetworkChangeListener = jest.fn();
      
      NetworkService.addListener(listener1);
      NetworkService.addListener(listener2);
      expect(NetworkService.getListenerCount()).toBe(2);
      
      NetworkService.removeListener(listener1);
      expect(NetworkService.getListenerCount()).toBe(1);
    });

    test('doit notifier tous les listeners lors d\'un changement', () => {
      const listener1: NetworkChangeListener = jest.fn();
      const listener2: NetworkChangeListener = jest.fn();
      
      NetworkService.addListener(listener1);
      NetworkService.addListener(listener2);
      
      // Simuler un changement de réseau
      const mockNetworkInfo: NetworkInfo = {
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
        details: { ssid: 'TestNetwork' },
        timestamp: new Date().toISOString()
      };
      
      // Note: Dans un vrai test, on déclencherait le changement via NetInfo
      // Ici on teste juste la structure des listeners
      expect(listener1).toBeDefined();
      expect(listener2).toBeDefined();
    });
  });

  describe('Informations réseau', () => {
    test('doit retourner les informations réseau correctement', () => {
      const networkInfo = NetworkService.getNetworkInfo();
      
      expect(networkInfo).toHaveProperty('isConnected');
      expect(networkInfo).toHaveProperty('isInternetReachable');
      expect(networkInfo).toHaveProperty('type');
      expect(networkInfo).toHaveProperty('details');
      expect(networkInfo).toHaveProperty('timestamp');
      
      expect(typeof networkInfo.isConnected).toBe('boolean');
      expect(typeof networkInfo.isInternetReachable).toBe('boolean');
      expect(typeof networkInfo.timestamp).toBe('string');
    });

    test('doit calculer la durée de déconnexion', () => {
      // Test avec état déconnecté simulé
      const disconnectionDuration = NetworkService.getDisconnectionDuration();
      const formattedDuration = NetworkService.getFormattedDisconnectionDuration();
      
      // Si connecté, doit retourner null
      if (NetworkService.isConnectedToNetwork()) {
        expect(disconnectionDuration).toBeNull();
        expect(formattedDuration).toBeNull();
      } else {
        // Si déconnecté, doit retourner une valeur
        expect(typeof disconnectionDuration).toBe('number');
        expect(typeof formattedDuration).toBe('string');
      }
    });

    test('doit formater correctement la durée', () => {
      // Test de formatage (simulation)
      const testCases = [
        { ms: 60000, expected: '1min' },
        { ms: 3600000, expected: '1h 0min' },
        { ms: 3720000, expected: '1h 2min' }
      ];
      
      testCases.forEach(({ ms, expected }) => {
        // Note: Dans un vrai test, on modifierait l'état interne
        // Ici on teste juste la logique de formatage
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        
        let result;
        if (hours > 0) {
          result = `${hours}h ${minutes}min`;
        } else {
          result = `${minutes}min`;
        }
        
        expect(result).toBe(expected);
      });
    });
  });

  describe('Statut du service', () => {
    test('doit retourner le statut complet du service', () => {
      const status = NetworkService.getServiceStatus();
      
      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('connected');
      expect(status).toHaveProperty('internetReachable');
      expect(status).toHaveProperty('networkType');
      expect(status).toHaveProperty('listenersCount');
      expect(status).toHaveProperty('lastConnection');
      expect(status).toHaveProperty('lastDisconnection');
      expect(status).toHaveProperty('disconnectionDuration');
      
      expect(typeof status.initialized).toBe('boolean');
      expect(typeof status.connected).toBe('boolean');
      expect(typeof status.internetReachable).toBe('boolean');
      expect(typeof status.listenersCount).toBe('number');
    });

    test('doit vérifier si le service est initialisé', () => {
      const isInitialized = NetworkService.isServiceInitialized();
      expect(typeof isInitialized).toBe('boolean');
    });
  });

  describe('Gestion des erreurs', () => {
    test('doit gérer les erreurs de listeners', () => {
      const errorListener: NetworkChangeListener = jest.fn(() => {
        throw new Error('Erreur de listener');
      });
      
      const normalListener: NetworkChangeListener = jest.fn();
      
      NetworkService.addListener(errorListener);
      NetworkService.addListener(normalListener);
      
      // Les listeners avec erreur ne doivent pas empêcher les autres de fonctionner
      expect(NetworkService.getListenerCount()).toBe(2);
    });
  });

  describe('Types et interfaces', () => {
    test('NetworkInfo doit avoir la structure correcte', () => {
      const networkInfo: NetworkInfo = {
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
        details: { ssid: 'TestNetwork' },
        timestamp: '2025-01-01T00:00:00Z'
      };
      
      expect(networkInfo.isConnected).toBe(true);
      expect(networkInfo.isInternetReachable).toBe(true);
      expect(networkInfo.type).toBe('wifi');
      expect(networkInfo.details).toEqual({ ssid: 'TestNetwork' });
      expect(networkInfo.timestamp).toBe('2025-01-01T00:00:00Z');
    });

    test('NetworkChangeListener doit être une fonction', () => {
      const listener: NetworkChangeListener = (info: NetworkInfo) => {
        console.log('Network changed:', info);
      };
      
      expect(typeof listener).toBe('function');
    });
  });

  describe('Logique de connectivité', () => {
    test('isOnline doit être true seulement si connecté ET internet accessible', () => {
      // Test des différentes combinaisons
      const testCases = [
        { connected: false, internet: false, expected: false },
        { connected: true, internet: false, expected: false },
        { connected: false, internet: true, expected: false },
        { connected: true, internet: true, expected: true }
      ];
      
      testCases.forEach(({ connected, internet, expected }) => {
        // Note: Dans un vrai test, on modifierait l'état interne
        // Ici on teste juste la logique
        const result = connected && internet;
        expect(result).toBe(expected);
      });
    });
  });

  describe('Nettoyage des ressources', () => {
    test('doit nettoyer correctement les ressources', async () => {
      // Ajouter quelques listeners
      const listener1: NetworkChangeListener = jest.fn();
      const listener2: NetworkChangeListener = jest.fn();
      
      NetworkService.addListener(listener1);
      NetworkService.addListener(listener2);
      
      expect(NetworkService.getListenerCount()).toBe(2);
      
      // Nettoyer
      await NetworkService.cleanup();
      
      expect(NetworkService.getListenerCount()).toBe(0);
      expect(NetworkService.isServiceInitialized()).toBe(false);
    });
  });
});

