/**
 * Tests unitaires pour le service de synchronisation
 */

import SyncService from '../../src/services/sync/SyncService';
import { SyncState, EntityType, OperationType } from '../../src/types/sync';

// Mock des dépendances
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn()
}));

jest.mock('../../src/services/network', () => ({
  NetworkService: {
    getInstance: () => ({
      isOnline: () => true
    })
  }
}));

jest.mock('../../src/services/apiClient', () => ({
  request: jest.fn()
}));

describe('SyncService', () => {
  let syncService: SyncService;

  beforeEach(() => {
    // Obtenir une nouvelle instance pour chaque test
    syncService = SyncService.getInstance();
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SyncService.getInstance();
      const instance2 = SyncService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('should initialize with device ID and app version', async () => {
      const deviceId = 'test-device-123';
      const appVersion = '1.0.0';

      await expect(syncService.initialize(deviceId, appVersion)).resolves.not.toThrow();
    });

    it('should not initialize twice', async () => {
      const deviceId = 'test-device-123';
      const appVersion = '1.0.0';

      await syncService.initialize(deviceId, appVersion);
      
      // Deuxième appel ne devrait pas lever d'erreur
      await expect(syncService.initialize(deviceId, appVersion)).resolves.not.toThrow();
    });
  });

  describe('State Management', () => {
    it('should start with IDLE state', () => {
      expect(syncService.getCurrentState()).toBe(SyncState.IDLE);
    });

    it('should return progress information', () => {
      const progress = syncService.getProgress();
      expect(progress).toHaveProperty('state');
      expect(progress).toHaveProperty('progress');
      expect(progress).toHaveProperty('totalOperations');
      expect(progress).toHaveProperty('completedOperations');
    });
  });

  describe('Configuration', () => {
    it('should return default configuration', () => {
      const config = syncService.getConfig();
      expect(config).toHaveProperty('batchSize');
      expect(config).toHaveProperty('maxRetries');
      expect(config).toHaveProperty('timeoutMs');
      expect(config.batchSize).toBe(50);
      expect(config.maxRetries).toBe(3);
    });

    it('should update configuration', async () => {
      const newConfig = {
        batchSize: 100,
        maxRetries: 5
      };

      await syncService.updateConfig(newConfig);
      
      const updatedConfig = syncService.getConfig();
      expect(updatedConfig.batchSize).toBe(100);
      expect(updatedConfig.maxRetries).toBe(5);
    });
  });

  describe('Event Listeners', () => {
    it('should add and remove event listeners', () => {
      const listener = jest.fn();
      
      syncService.addEventListener(listener);
      // Pas de méthode directe pour tester, mais pas d'erreur
      
      syncService.removeEventListener(listener);
      // Pas d'erreur lors de la suppression
    });
  });

  describe('Sync Operations', () => {
    beforeEach(async () => {
      await syncService.initialize('test-device', '1.0.0');
    });

    it('should handle batch sync with valid operations', async () => {
      const operations = [
        {
          entityId: '1',
          localId: 'local-1',
          entityType: EntityType.PRODUCT,
          operationType: OperationType.CREATE,
          entityData: { name: 'Test Product' },
          timestamp: new Date().toISOString()
        }
      ];

      // Mock de la réponse API
      const mockApiClient = require('../../src/services/apiClient');
      mockApiClient.request.mockResolvedValue({
        data: {
          syncSessionId: 'test-session',
          totalProcessed: 1,
          successCount: 1,
          errorCount: 0,
          conflictCount: 0,
          processingTimeMs: 100,
          results: [],
          conflicts: [],
          errors: [],
          statistics: {
            byEntityType: { product: 1 },
            byOperationType: { create: 1 },
            averageProcessingTimeMs: 100
          },
          serverTimestamp: new Date().toISOString()
        }
      });

      const result = await syncService.syncBatch(operations);
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('totalProcessed');
      expect(result).toHaveProperty('successCount');
      expect(result.successCount).toBe(1);
    });

    it('should handle delta sync', async () => {
      // Mock de la réponse API
      const mockApiClient = require('../../src/services/apiClient');
      mockApiClient.request.mockResolvedValue({
        data: {
          modifiedEntities: [],
          deletedEntities: [],
          totalModified: 0,
          totalDeleted: 0,
          serverTimestamp: new Date().toISOString(),
          syncSessionId: 'test-session',
          hasMore: false,
          nextSyncTimestamp: new Date().toISOString(),
          statistics: {
            byEntityType: {},
            byOperationType: {},
            totalDataSizeBytes: 0
          }
        }
      });

      const result = await syncService.syncDelta();
      
      expect(result).toHaveProperty('totalModified');
      expect(result).toHaveProperty('totalDeleted');
      expect(result).toHaveProperty('serverTimestamp');
    });

    it('should handle sync all operation', async () => {
      // Mock des réponses API
      const mockApiClient = require('../../src/services/apiClient');
      
      // Mock pour batch sync
      mockApiClient.request
        .mockResolvedValueOnce({
          data: {
            syncSessionId: 'test-session',
            totalProcessed: 0,
            successCount: 0,
            errorCount: 0,
            conflictCount: 0,
            processingTimeMs: 50,
            results: [],
            conflicts: [],
            errors: [],
            statistics: {
              byEntityType: {},
              byOperationType: {},
              averageProcessingTimeMs: 50
            },
            serverTimestamp: new Date().toISOString()
          }
        })
        // Mock pour delta sync
        .mockResolvedValueOnce({
          data: {
            modifiedEntities: [],
            deletedEntities: [],
            totalModified: 0,
            totalDeleted: 0,
            serverTimestamp: new Date().toISOString(),
            syncSessionId: 'test-session',
            hasMore: false,
            nextSyncTimestamp: new Date().toISOString(),
            statistics: {
              byEntityType: {},
              byOperationType: {},
              totalDataSizeBytes: 0
            }
          }
        });

      const result = await syncService.syncAll();
      
      expect(result).toHaveProperty('batch');
      expect(result).toHaveProperty('delta');
    });

    it('should handle server status request', async () => {
      // Mock de la réponse API
      const mockApiClient = require('../../src/services/apiClient');
      mockApiClient.request.mockResolvedValue({
        data: {
          serverTime: new Date().toISOString(),
          status: 'active',
          version: '1.0.0',
          entityCounts: {
            products: 10,
            sales: 5,
            stockMovements: 3
          }
        }
      });

      const result = await syncService.getServerStatus();
      
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('entityCounts');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await syncService.initialize('test-device', '1.0.0');
    });

    it('should handle network errors gracefully', async () => {
      const mockApiClient = require('../../src/services/apiClient');
      mockApiClient.request.mockRejectedValue(new Error('Network error'));

      const operations = [
        {
          entityId: '1',
          localId: 'local-1',
          entityType: EntityType.PRODUCT,
          operationType: OperationType.CREATE,
          entityData: { name: 'Test Product' },
          timestamp: new Date().toISOString()
        }
      ];

      await expect(syncService.syncBatch(operations)).rejects.toThrow('Network error');
    });

    it('should handle initialization errors', async () => {
      const mockAsyncStorage = require('@react-native-async-storage/async-storage');
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      // Ne devrait pas lever d'erreur car AsyncStorage est géré en try/catch
      await expect(syncService.initialize('test-device', '1.0.0')).resolves.not.toThrow();
    });
  });

  describe('Metadata Management', () => {
    it('should return sync metadata', async () => {
      await syncService.initialize('test-device', '1.0.0');
      
      const metadata = syncService.getSyncMetadata();
      expect(metadata).toHaveProperty('deviceId');
      expect(metadata).toHaveProperty('appVersion');
      expect(metadata).toHaveProperty('totalSyncCount');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', async () => {
      await syncService.initialize('test-device', '1.0.0');
      
      await expect(syncService.cleanup()).resolves.not.toThrow();
    });
  });
});

