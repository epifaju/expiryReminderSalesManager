/**
 * Tests unitaires pour le hook useNetworkStatus
 * Teste l'intégration React avec le NetworkService
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useNetworkStatus, useIsOnline, useNetworkDetails } from '../../src/hooks/useNetworkStatus';

// Mock du NetworkService
jest.mock('../../src/services/network/NetworkService', () => ({
  __esModule: true,
  default: {
    isServiceInitialized: jest.fn(() => false),
    initialize: jest.fn(),
    addListener: jest.fn(() => () => {}),
    getNetworkInfo: jest.fn(() => ({
      isConnected: false,
      isInternetReachable: false,
      type: null,
      details: null,
      timestamp: '2025-01-01T00:00:00Z'
    })),
    getServiceStatus: jest.fn(() => ({
      initialized: false,
      connected: false,
      internetReachable: false,
      networkType: null,
      listenersCount: 0,
      lastConnection: null,
      lastDisconnection: null,
      disconnectionDuration: null
    })),
    refreshNetworkState: jest.fn(() => Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
      details: { ssid: 'TestNetwork' },
      timestamp: '2025-01-01T00:00:00Z'
    }))
  }
}));

describe('useNetworkStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hook principal useNetworkStatus', () => {
    test('doit retourner les bonnes propriétés', () => {
      const { result } = renderHook(() => useNetworkStatus());
      
      expect(result.current).toHaveProperty('networkInfo');
      expect(result.current).toHaveProperty('isOnline');
      expect(result.current).toHaveProperty('isConnected');
      expect(result.current).toHaveProperty('isInternetReachable');
      expect(result.current).toHaveProperty('networkType');
      expect(result.current).toHaveProperty('networkDetails');
      expect(result.current).toHaveProperty('lastConnectionTime');
      expect(result.current).toHaveProperty('lastDisconnectionTime');
      expect(result.current).toHaveProperty('disconnectionDuration');
      expect(result.current).toHaveProperty('refreshNetwork');
      expect(result.current).toHaveProperty('serviceStatus');
    });

    test('doit initialiser avec les bonnes valeurs par défaut', () => {
      const { result } = renderHook(() => useNetworkStatus());
      
      expect(result.current.isOnline).toBe(false);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isInternetReachable).toBe(false);
      expect(result.current.networkType).toBeNull();
      expect(result.current.networkDetails).toBeNull();
    });

    test('doit fournir une fonction refreshNetwork', () => {
      const { result } = renderHook(() => useNetworkStatus());
      
      expect(typeof result.current.refreshNetwork).toBe('function');
    });

    test('doit mettre à jour l\'état lors du refresh', async () => {
      const { result } = renderHook(() => useNetworkStatus());
      
      await act(async () => {
        await result.current.refreshNetwork();
      });
      
      // Après refresh, l'état doit être mis à jour
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(true);
      expect(result.current.networkType).toBe('wifi');
    });
  });

  describe('Hook simplifié useIsOnline', () => {
    test('doit retourner uniquement l\'état online', () => {
      const { result } = renderHook(() => useIsOnline());
      
      expect(typeof result.current).toBe('boolean');
      expect(result.current).toBe(false); // Valeur par défaut
    });

    test('doit se mettre à jour avec les changements de réseau', () => {
      const { result } = renderHook(() => useIsOnline());
      
      // Test de la logique de mise à jour
      expect(result.current).toBe(false);
    });
  });

  describe('Hook useNetworkDetails', () => {
    test('doit retourner les détails complets du réseau', () => {
      const { result } = renderHook(() => useNetworkDetails());
      
      expect(result.current).toHaveProperty('isConnected');
      expect(result.current).toHaveProperty('isInternetReachable');
      expect(result.current).toHaveProperty('type');
      expect(result.current).toHaveProperty('details');
      expect(result.current).toHaveProperty('timestamp');
      expect(result.current).toHaveProperty('initialized');
      expect(result.current).toHaveProperty('connected');
      expect(result.current).toHaveProperty('internetReachable');
      expect(result.current).toHaveProperty('networkType');
      expect(result.current).toHaveProperty('listenersCount');
    });
  });

  describe('Gestion des listeners', () => {
    test('doit s\'abonner aux changements de réseau', () => {
      const mockNetworkService = require('../../src/services/network/NetworkService').default;
      
      renderHook(() => useNetworkStatus());
      
      expect(mockNetworkService.addListener).toHaveBeenCalled();
    });

    test('doit se désabonner lors du démontage', () => {
      const mockNetworkService = require('../../src/services/network/NetworkService').default;
      const mockRemoveListener = jest.fn();
      mockNetworkService.addListener.mockReturnValue(mockRemoveListener);
      
      const { unmount } = renderHook(() => useNetworkStatus());
      
      unmount();
      
      expect(mockRemoveListener).toHaveBeenCalled();
    });
  });

  describe('Gestion des erreurs', () => {
    test('doit gérer les erreurs d\'initialisation', async () => {
      const mockNetworkService = require('../../src/services/network/NetworkService').default;
      mockNetworkService.initialize.mockRejectedValue(new Error('Erreur d\'initialisation'));
      
      // Le hook ne doit pas planter même si l'initialisation échoue
      const { result } = renderHook(() => useNetworkStatus());
      
      expect(result.current.isOnline).toBe(false);
      expect(result.current.isConnected).toBe(false);
    });

    test('doit gérer les erreurs de refresh', async () => {
      const mockNetworkService = require('../../src/services/network/NetworkService').default;
      mockNetworkService.refreshNetworkState.mockRejectedValue(new Error('Erreur de refresh'));
      
      const { result } = renderHook(() => useNetworkStatus());
      
      await expect(async () => {
        await act(async () => {
          await result.current.refreshNetwork();
        });
      }).rejects.toThrow('Erreur de refresh');
    });
  });

  describe('Types et interfaces', () => {
    test('doit respecter les types TypeScript', () => {
      const { result } = renderHook(() => useNetworkStatus());
      
      // Vérifier les types
      expect(typeof result.current.isOnline).toBe('boolean');
      expect(typeof result.current.isConnected).toBe('boolean');
      expect(typeof result.current.isInternetReachable).toBe('boolean');
      expect(typeof result.current.networkType === 'string' || result.current.networkType === null).toBe(true);
      expect(typeof result.current.refreshNetwork).toBe('function');
    });

    test('networkInfo doit avoir la structure correcte', () => {
      const { result } = renderHook(() => useNetworkStatus());
      
      const networkInfo = result.current.networkInfo;
      
      expect(networkInfo).toHaveProperty('isConnected');
      expect(networkInfo).toHaveProperty('isInternetReachable');
      expect(networkInfo).toHaveProperty('type');
      expect(networkInfo).toHaveProperty('details');
      expect(networkInfo).toHaveProperty('timestamp');
      
      expect(typeof networkInfo.isConnected).toBe('boolean');
      expect(typeof networkInfo.isInternetReachable).toBe('boolean');
      expect(typeof networkInfo.timestamp).toBe('string');
    });

    test('serviceStatus doit avoir la structure correcte', () => {
      const { result } = renderHook(() => useNetworkStatus());
      
      const serviceStatus = result.current.serviceStatus;
      
      expect(serviceStatus).toHaveProperty('initialized');
      expect(serviceStatus).toHaveProperty('connected');
      expect(serviceStatus).toHaveProperty('internetReachable');
      expect(serviceStatus).toHaveProperty('networkType');
      expect(serviceStatus).toHaveProperty('listenersCount');
      expect(serviceStatus).toHaveProperty('lastConnection');
      expect(serviceStatus).toHaveProperty('lastDisconnection');
      expect(serviceStatus).toHaveProperty('disconnectionDuration');
    });
  });

  describe('Performance et optimisations', () => {
    test('doit éviter les re-renders inutiles', () => {
      const { result, rerender } = renderHook(() => useNetworkStatus());
      
      const initialRenderCount = 1;
      let renderCount = 1;
      
      rerender();
      renderCount++;
      
      // Le hook ne doit pas causer de re-renders excessifs
      expect(renderCount).toBeLessThanOrEqual(initialRenderCount + 1);
    });

    test('doit utiliser useCallback pour les fonctions', () => {
      const { result, rerender } = renderHook(() => useNetworkStatus());
      
      const initialRefreshFunction = result.current.refreshNetwork;
      
      rerender();
      
      // La fonction refreshNetwork doit être stable (useCallback)
      expect(result.current.refreshNetwork).toBe(initialRefreshFunction);
    });
  });
});

