/**
 * Tests d'intégration pour les composants UI et la synchronisation
 * Valide l'interaction entre les composants UI et le service de synchronisation
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useSyncService } from '../../src/hooks/useSyncService';
import {
  NetworkStatusBadge,
  SyncStatusCard,
  SyncProgressBar,
  SyncNotification
} from '../../src/components';
import SyncService from '../../src/services/sync/SyncService';
import { NetworkService } from '../../src/services/network';
import {
  SyncState,
  EntityType,
  OperationType,
  SyncOperation
} from '../../src/types/sync';

// Mock des dépendances
jest.mock('../../src/services/sync/SyncService');
jest.mock('../../src/services/network');
jest.mock('../../src/hooks/useSyncService');

// Mock des composants React Native
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn()
    }
  };
});

describe('Intégration Composants UI et Synchronisation', () => {
  let mockSyncService: jest.Mocked<SyncService>;
  let mockNetworkService: jest.Mocked<any>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock SyncService
    mockSyncService = {
      getInstance: jest.fn(),
      initialize: jest.fn(),
      syncBatch: jest.fn(),
      syncDelta: jest.fn(),
      syncAll: jest.fn(),
      forceSync: jest.fn(),
      getServerStatus: jest.fn(),
      getCurrentState: jest.fn(),
      getProgress: jest.fn(),
      getSyncMetadata: jest.fn(),
      getConfig: jest.fn(),
      updateConfig: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      cleanup: jest.fn()
    } as any;

    (SyncService.getInstance as jest.Mock).mockReturnValue(mockSyncService);

    // Mock NetworkService
    mockNetworkService = {
      getInstance: jest.fn(() => ({
        isOnline: jest.fn(() => true),
        addListener: jest.fn(),
        removeListener: jest.fn()
      }))
    };

    (NetworkService.getInstance as jest.Mock).mockReturnValue(mockNetworkService.getInstance());
  });

  describe('NetworkStatusBadge Integration', () => {
    it('should display online status correctly', () => {
      // Arrange: Mock hook return values
      (useSyncService as jest.Mock).mockReturnValue({
        isOnline: true,
        isSyncing: false,
        syncProgress: {
          state: SyncState.IDLE,
          currentOperation: '',
          progress: 0,
          totalOperations: 0,
          completedOperations: 0,
          errors: 0,
          conflicts: 0
        },
        hasErrors: false,
        hasConflicts: false
      });

      // Act: Render component
      const { getByText } = render(<NetworkStatusBadge />);

      // Assert: Verify online status is displayed
      expect(getByText('En ligne')).toBeTruthy();
    });

    it('should display syncing status correctly', () => {
      // Arrange: Mock hook return values for syncing state
      (useSyncService as jest.Mock).mockReturnValue({
        isOnline: true,
        isSyncing: true,
        syncProgress: {
          state: SyncState.SYNCING,
          currentOperation: 'Synchronisation en cours...',
          progress: 50,
          totalOperations: 10,
          completedOperations: 5,
          errors: 0,
          conflicts: 0
        },
        hasErrors: false,
        hasConflicts: false
      });

      // Act: Render component
      const { getByText } = render(<NetworkStatusBadge />);

      // Assert: Verify syncing status is displayed
      expect(getByText('Synchronisation...')).toBeTruthy();
    });

    it('should display error status correctly', () => {
      // Arrange: Mock hook return values for error state
      (useSyncService as jest.Mock).mockReturnValue({
        isOnline: true,
        isSyncing: false,
        syncProgress: {
          state: SyncState.ERROR,
          currentOperation: 'Erreur de synchronisation',
          progress: 0,
          totalOperations: 0,
          completedOperations: 0,
          errors: 1,
          conflicts: 0
        },
        hasErrors: true,
        hasConflicts: false
      });

      // Act: Render component
      const { getByText } = render(<NetworkStatusBadge />);

      // Assert: Verify error status is displayed
      expect(getByText('Erreur')).toBeTruthy();
    });
  });

  describe('SyncStatusCard Integration', () => {
    it('should display sync metadata correctly', () => {
      // Arrange: Mock hook return values with metadata
      const mockMetadata = {
        lastSyncTimestamp: new Date().toISOString(),
        lastSyncType: 'batch' as const,
        lastSyncStatus: 'success' as const,
        totalSyncCount: 5,
        successfulSyncCount: 4,
        failedSyncCount: 1,
        deviceId: 'test-device',
        appVersion: '1.0.0'
      };

      (useSyncService as jest.Mock).mockReturnValue({
        syncMetadata: mockMetadata,
        syncConfig: {
          batchSize: 50,
          maxRetries: 3,
          timeoutMs: 30000
        },
        isSyncing: false,
        syncProgress: {
          state: SyncState.IDLE,
          currentOperation: '',
          progress: 0,
          totalOperations: 0,
          completedOperations: 0,
          errors: 0,
          conflicts: 0
        }
      });

      // Act: Render component
      const { getByText } = render(<SyncStatusCard />);

      // Assert: Verify metadata is displayed
      expect(getByText('Dernière synchronisation')).toBeTruthy();
      expect(getByText('Total: 5')).toBeTruthy();
      expect(getByText('Succès: 4')).toBeTruthy();
    });

    it('should trigger manual sync when button is pressed', async () => {
      // Arrange: Mock hook return values
      const mockSyncAll = jest.fn().mockResolvedValue({
        batch: { successCount: 1 },
        delta: { totalModified: 0 }
      });

      (useSyncService as jest.Mock).mockReturnValue({
        syncAll: mockSyncAll,
        syncMetadata: null,
        syncConfig: {},
        isSyncing: false,
        syncProgress: {
          state: SyncState.IDLE,
          currentOperation: '',
          progress: 0,
          totalOperations: 0,
          completedOperations: 0,
          errors: 0,
          conflicts: 0
        }
      });

      // Act: Render component and press sync button
      const { getByText } = render(<SyncStatusCard />);
      const syncButton = getByText('Synchroniser');
      fireEvent.press(syncButton);

      // Assert: Verify sync was triggered
      await waitFor(() => {
        expect(mockSyncAll).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('SyncProgressBar Integration', () => {
    it('should display progress correctly', () => {
      // Arrange: Mock hook return values with progress
      (useSyncService as jest.Mock).mockReturnValue({
        syncProgress: {
          state: SyncState.SYNCING,
          currentOperation: 'Synchronisation des produits...',
          progress: 75,
          totalOperations: 10,
          completedOperations: 7,
          errors: 1,
          conflicts: 0
        }
      });

      // Act: Render component
      const { getByText } = render(<SyncProgressBar />);

      // Assert: Verify progress is displayed
      expect(getByText('Synchronisation des produits...')).toBeTruthy();
      expect(getByText('75%')).toBeTruthy();
      expect(getByText('7/10')).toBeTruthy();
    });

    it('should display indeterminate progress for unknown total', () => {
      // Arrange: Mock hook return values with indeterminate progress
      (useSyncService as jest.Mock).mockReturnValue({
        syncProgress: {
          state: SyncState.SYNCING,
          currentOperation: 'Synchronisation en cours...',
          progress: 0,
          totalOperations: 0,
          completedOperations: 0,
          errors: 0,
          conflicts: 0
        }
      });

      // Act: Render component
      const { getByTestId } = render(<SyncProgressBar />);

      // Assert: Verify indeterminate progress is displayed
      expect(getByTestId('indeterminate-progress')).toBeTruthy();
    });
  });

  describe('SyncNotification Integration', () => {
    it('should display success notification', () => {
      // Arrange: Mock hook return values for success
      (useSyncService as jest.Mock).mockReturnValue({
        lastSyncResult: {
          success: true,
          totalProcessed: 5,
          successCount: 5,
          errorCount: 0,
          conflictCount: 0,
          processingTimeMs: 1000,
          errors: [],
          conflicts: []
        },
        lastError: null
      });

      // Act: Render component
      const { getByText } = render(<SyncNotification />);

      // Assert: Verify success notification is displayed
      expect(getByText('Synchronisation réussie')).toBeTruthy();
      expect(getByText('5 éléments synchronisés')).toBeTruthy();
    });

    it('should display error notification', () => {
      // Arrange: Mock hook return values for error
      (useSyncService as jest.Mock).mockReturnValue({
        lastSyncResult: null,
        lastError: new Error('Erreur de réseau')
      });

      // Act: Render component
      const { getByText } = render(<SyncNotification />);

      // Assert: Verify error notification is displayed
      expect(getByText('Erreur de synchronisation')).toBeTruthy();
      expect(getByText('Erreur de réseau')).toBeTruthy();
    });

    it('should display conflict notification', () => {
      // Arrange: Mock hook return values for conflicts
      (useSyncService as jest.Mock).mockReturnValue({
        lastSyncResult: {
          success: false,
          totalProcessed: 3,
          successCount: 1,
          errorCount: 0,
          conflictCount: 2,
          processingTimeMs: 500,
          errors: [],
          conflicts: [
            {
              conflictId: 'conflict-1',
              entityId: 'prod-1',
              entityType: 'product',
              conflictType: 'update_conflict',
              localData: { name: 'Produit Local' },
              serverData: { name: 'Produit Serveur' },
              message: 'Conflit de mise à jour',
              timestamp: new Date().toISOString()
            }
          ]
        },
        lastError: null
      });

      // Act: Render component
      const { getByText } = render(<SyncNotification />);

      // Assert: Verify conflict notification is displayed
      expect(getByText('Conflits détectés')).toBeTruthy();
      expect(getByText('2 conflits à résoudre')).toBeTruthy();
    });
  });

  describe('End-to-End UI Flow', () => {
    it('should complete full sync flow through UI', async () => {
      // Arrange: Mock complete sync flow
      const mockSyncAll = jest.fn().mockResolvedValue({
        batch: {
          success: true,
          totalProcessed: 3,
          successCount: 3,
          errorCount: 0,
          conflictCount: 0,
          processingTimeMs: 1500,
          errors: [],
          conflicts: []
        },
        delta: {
          totalModified: 2,
          totalDeleted: 0,
          hasMore: false,
          modifiedEntities: [],
          deletedEntities: []
        }
      });

      (useSyncService as jest.Mock).mockReturnValue({
        syncAll: mockSyncAll,
        syncMetadata: {
          lastSyncTimestamp: new Date().toISOString(),
          lastSyncType: 'batch',
          lastSyncStatus: 'success',
          totalSyncCount: 1,
          successfulSyncCount: 1,
          failedSyncCount: 0,
          deviceId: 'test-device',
          appVersion: '1.0.0'
        },
        syncConfig: {
          batchSize: 50,
          maxRetries: 3,
          timeoutMs: 30000
        },
        isSyncing: false,
        isOnline: true,
        hasErrors: false,
        hasConflicts: false,
        syncProgress: {
          state: SyncState.IDLE,
          currentOperation: '',
          progress: 0,
          totalOperations: 0,
          completedOperations: 0,
          errors: 0,
          conflicts: 0
        },
        lastSyncResult: null,
        lastError: null
      });

      // Act: Render SyncStatusCard and trigger sync
      const { getByText } = render(<SyncStatusCard />);
      const syncButton = getByText('Synchroniser');
      fireEvent.press(syncButton);

      // Assert: Verify sync was triggered
      await waitFor(() => {
        expect(mockSyncAll).toHaveBeenCalledTimes(1);
      });

      // Verify UI updates after sync
      await waitFor(() => {
        expect(getByText('Dernière synchronisation')).toBeTruthy();
      });
    });

    it('should handle sync errors through UI', async () => {
      // Arrange: Mock sync error
      const mockSyncAll = jest.fn().mockRejectedValue(new Error('Network timeout'));

      (useSyncService as jest.Mock).mockReturnValue({
        syncAll: mockSyncAll,
        syncMetadata: null,
        syncConfig: {},
        isSyncing: false,
        isOnline: true,
        hasErrors: true,
        hasConflicts: false,
        syncProgress: {
          state: SyncState.ERROR,
          currentOperation: 'Erreur de synchronisation',
          progress: 0,
          totalOperations: 0,
          completedOperations: 0,
          errors: 1,
          conflicts: 0
        },
        lastSyncResult: null,
        lastError: new Error('Network timeout')
      });

      // Act: Render components
      const { getByText } = render(<SyncStatusCard />);
      const { getByText: getNotificationText } = render(<SyncNotification />);

      // Assert: Verify error states are displayed
      expect(getByText('Erreur')).toBeTruthy();
      expect(getNotificationText('Erreur de synchronisation')).toBeTruthy();
      expect(getNotificationText('Network timeout')).toBeTruthy();
    });
  });

  describe('Real-time Updates', () => {
    it('should update UI in real-time during sync', async () => {
      // Arrange: Mock progressive sync updates
      let progressValue = 0;
      const mockSyncAll = jest.fn().mockImplementation(() => {
        // Simulate progressive updates
        return new Promise((resolve) => {
          const interval = setInterval(() => {
            progressValue += 25;
            if (progressValue >= 100) {
              clearInterval(interval);
              resolve({
                batch: { successCount: 1 },
                delta: { totalModified: 0 }
              });
            }
          }, 100);
        });
      });

      // Mock hook with reactive values
      const mockUseSyncService = jest.fn();
      (useSyncService as jest.Mock).mockImplementation(mockUseSyncService);

      // Initial render
      mockUseSyncService.mockReturnValue({
        syncAll: mockSyncAll,
        syncMetadata: null,
        syncConfig: {},
        isSyncing: true,
        isOnline: true,
        hasErrors: false,
        hasConflicts: false,
        syncProgress: {
          state: SyncState.SYNCING,
          currentOperation: 'Synchronisation en cours...',
          progress: progressValue,
          totalOperations: 4,
          completedOperations: Math.floor(progressValue / 25),
          errors: 0,
          conflicts: 0
        },
        lastSyncResult: null,
        lastError: null
      });

      // Act: Render component
      const { getByText } = render(<SyncProgressBar />);

      // Assert: Verify initial progress
      expect(getByText('0%')).toBeTruthy();
      expect(getByText('0/4')).toBeTruthy();

      // Simulate progress updates
      progressValue = 50;
      mockUseSyncService.mockReturnValue({
        syncAll: mockSyncAll,
        syncMetadata: null,
        syncConfig: {},
        isSyncing: true,
        isOnline: true,
        hasErrors: false,
        hasConflicts: false,
        syncProgress: {
          state: SyncState.SYNCING,
          currentOperation: 'Synchronisation en cours...',
          progress: progressValue,
          totalOperations: 4,
          completedOperations: 2,
          errors: 0,
          conflicts: 0
        },
        lastSyncResult: null,
        lastError: null
      });

      // Re-render with updated progress
      const { rerender } = render(<SyncProgressBar />);
      rerender(<SyncProgressBar />);

      // Assert: Verify updated progress
      await waitFor(() => {
        expect(getByText('50%')).toBeTruthy();
        expect(getByText('2/4')).toBeTruthy();
      });
    });
  });
});

