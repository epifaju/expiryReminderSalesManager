/**
 * Tests unitaires pour le composant NetworkStatusBadge
 * Teste l'affichage et les interactions du badge d'état réseau
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import NetworkStatusBadge from '../../src/components/NetworkStatusBadge';

// Mock des hooks
jest.mock('../../src/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isOnline: true,
    isConnected: true,
    networkType: 'wifi',
    disconnectionDuration: null
  })
}));

jest.mock('../../src/hooks/useSyncQueue', () => ({
  useSyncQueue: () => ({
    pendingCount: 0,
    isSyncing: false
  })
}));

describe('NetworkStatusBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendu de base', () => {
    test('doit rendre le badge avec le texte correct', () => {
      const { getByText } = render(<NetworkStatusBadge />);
      
      expect(getByText('Synchronisé')).toBeTruthy();
    });

    test('doit afficher l\'icône correcte', () => {
      const { getByText } = render(<NetworkStatusBadge />);
      
      expect(getByText('✅')).toBeTruthy();
    });

    test('doit appliquer les styles de taille corrects', () => {
      const { getByTestId } = render(
        <NetworkStatusBadge size="small" testID="badge" />
      );
      
      const badge = getByTestId('badge');
      expect(badge).toBeTruthy();
    });
  });

  describe('Différentes tailles', () => {
    test('doit appliquer les styles small', () => {
      const { getByText } = render(<NetworkStatusBadge size="small" />);
      
      expect(getByText('Synchronisé')).toBeTruthy();
    });

    test('doit appliquer les styles medium', () => {
      const { getByText } = render(<NetworkStatusBadge size="medium" />);
      
      expect(getByText('Synchronisé')).toBeTruthy();
    });

    test('doit appliquer les styles large', () => {
      const { getByText } = render(<NetworkStatusBadge size="large" />);
      
      expect(getByText('Synchronisé')).toBeTruthy();
    });
  });

  describe('Différentes positions', () => {
    test('doit appliquer la position top-left', () => {
      const { getByText } = render(<NetworkStatusBadge position="top-left" />);
      
      expect(getByText('Synchronisé')).toBeTruthy();
    });

    test('doit appliquer la position top-right', () => {
      const { getByText } = render(<NetworkStatusBadge position="top-right" />);
      
      expect(getByText('Synchronisé')).toBeTruthy();
    });

    test('doit appliquer la position bottom-left', () => {
      const { getByText } = render(<NetworkStatusBadge position="bottom-left" />);
      
      expect(getByText('Synchronisé')).toBeTruthy();
    });

    test('doit appliquer la position bottom-right', () => {
      const { getByText } = render(<NetworkStatusBadge position="bottom-right" />);
      
      expect(getByText('Synchronisé')).toBeTruthy();
    });

    test('doit appliquer la position center', () => {
      const { getByText } = render(<NetworkStatusBadge position="center" />);
      
      expect(getByText('Synchronisé')).toBeTruthy();
    });
  });

  describe('Affichage du compteur', () => {
    test('doit afficher le compteur quand showPendingCount est true', () => {
      // Mock avec des éléments en attente
      jest.doMock('../../src/hooks/useSyncQueue', () => ({
        useSyncQueue: () => ({
          pendingCount: 5,
          isSyncing: false
        })
      }));

      const { getByText } = render(<NetworkStatusBadge showPendingCount={true} />);
      
      expect(getByText('5')).toBeTruthy();
    });

    test('ne doit pas afficher le compteur quand showPendingCount est false', () => {
      // Mock avec des éléments en attente
      jest.doMock('../../src/hooks/useSyncQueue', () => ({
        useSyncQueue: () => ({
          pendingCount: 5,
          isSyncing: false
        })
      }));

      const { queryByText } = render(<NetworkStatusBadge showPendingCount={false} />);
      
      expect(queryByText('5')).toBeNull();
    });

    test('doit afficher 99+ pour les grands nombres', () => {
      // Mock avec beaucoup d'éléments
      jest.doMock('../../src/hooks/useSyncQueue', () => ({
        useSyncQueue: () => ({
          pendingCount: 150,
          isSyncing: false
        })
      }));

      const { getByText } = render(<NetworkStatusBadge showPendingCount={true} />);
      
      expect(getByText('99+')).toBeTruthy();
    });
  });

  describe('Styles personnalisés', () => {
    test('doit appliquer les styles personnalisés', () => {
      const customStyle = { backgroundColor: 'red' };
      
      const { getByText } = render(
        <NetworkStatusBadge containerStyle={customStyle} />
      );
      
      expect(getByText('Synchronisé')).toBeTruthy();
    });

    test('doit appliquer les styles de texte personnalisés', () => {
      const customTextStyle = { fontSize: 20 };
      
      const { getByText } = render(
        <NetworkStatusBadge textStyle={customTextStyle} />
      );
      
      expect(getByText('Synchronisé')).toBeTruthy();
    });
  });

  describe('États différents', () => {
    test('doit afficher l\'état de synchronisation', () => {
      // Mock avec synchronisation en cours
      jest.doMock('../../src/hooks/useSyncQueue', () => ({
        useSyncQueue: () => ({
          pendingCount: 0,
          isSyncing: true
        })
      }));

      const { getByText } = render(<NetworkStatusBadge />);
      
      expect(getByText('Synchronisation...')).toBeTruthy();
      expect(getByText('🔄')).toBeTruthy();
    });

    test('doit afficher l\'état hors ligne', () => {
      // Mock hors ligne
      jest.doMock('../../src/hooks/useNetworkStatus', () => ({
        useNetworkStatus: () => ({
          isOnline: false,
          isConnected: false,
          networkType: null,
          disconnectionDuration: '2h 15min'
        })
      }));

      const { getByText } = render(<NetworkStatusBadge />);
      
      expect(getByText('Hors ligne')).toBeTruthy();
      expect(getByText('❌')).toBeTruthy();
    });

    test('doit afficher l\'état réseau local', () => {
      // Mock réseau local
      jest.doMock('../../src/hooks/useNetworkStatus', () => ({
        useNetworkStatus: () => ({
          isOnline: false,
          isConnected: true,
          networkType: 'wifi',
          disconnectionDuration: null
        })
      }));

      const { getByText } = render(<NetworkStatusBadge />);
      
      expect(getByText('Réseau local')).toBeTruthy();
      expect(getByText('🟡')).toBeTruthy();
    });

    test('doit afficher l\'état avec éléments en attente', () => {
      // Mock avec éléments en attente
      jest.doMock('../../src/hooks/useSyncQueue', () => ({
        useSyncQueue: () => ({
          pendingCount: 3,
          isSyncing: false
        })
      }));

      jest.doMock('../../src/hooks/useNetworkStatus', () => ({
        useNetworkStatus: () => ({
          isOnline: true,
          isConnected: true,
          networkType: 'wifi',
          disconnectionDuration: null
        })
      }));

      const { getByText } = render(<NetworkStatusBadge />);
      
      expect(getByText('3 à synchroniser')).toBeTruthy();
      expect(getByText('📤')).toBeTruthy();
    });
  });

  describe('Animation', () => {
    test('doit activer l\'animation quand showPulseAnimation est true', () => {
      const { getByText } = render(<NetworkStatusBadge showPulseAnimation={true} />);
      
      expect(getByText('Synchronisé')).toBeTruthy();
    });

    test('ne doit pas activer l\'animation quand showPulseAnimation est false', () => {
      const { getByText } = render(<NetworkStatusBadge showPulseAnimation={false} />);
      
      expect(getByText('Synchronisé')).toBeTruthy();
    });
  });

  describe('Accessibilité', () => {
    test('doit être accessible', () => {
      const { getByText } = render(<NetworkStatusBadge />);
      
      const badge = getByText('Synchronisé');
      expect(badge).toBeTruthy();
    });
  });

  describe('Props par défaut', () => {
    test('doit utiliser les props par défaut correctes', () => {
      const { getByText } = render(<NetworkStatusBadge />);
      
      expect(getByText('Synchronisé')).toBeTruthy();
      expect(getByText('✅')).toBeTruthy();
    });
  });
});

