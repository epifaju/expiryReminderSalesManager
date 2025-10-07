/**
 * Tests d'intégration pour la synchronisation bidirectionnelle
 * Valide le flux complet mobile ↔ backend
 */

import SyncService from '../../src/services/sync/SyncService';
import { NetworkService } from '../../src/services/network';
import {
  EntityType,
  OperationType,
  SyncOperation,
  SyncBatchRequest,
  SyncDeltaRequest,
  SyncState
} from '../../src/types/sync';

// Mock des dépendances
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn()
}));

jest.mock('../../src/services/network', () => ({
  NetworkService: {
    getInstance: () => ({
      isOnline: () => true,
      addListener: jest.fn(),
      removeListener: jest.fn()
    })
  }
}));

jest.mock('../../src/services/apiClient', () => ({
  request: jest.fn()
}));

describe('Intégration Synchronisation Bidirectionnelle', () => {
  let syncService: SyncService;
  let mockApiClient: any;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mocks
    mockApiClient = require('../../src/services/apiClient');
    
    // Mock AsyncStorage
    const mockAsyncStorage = require('@react-native-async-storage/async-storage');
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);

    // Get service instance
    syncService = SyncService.getInstance();
    
    // Initialize service
    await syncService.initialize('test-device-123', '1.0.0');
  });

  afterEach(async () => {
    await syncService.cleanup();
  });

  describe('Flux de synchronisation batch', () => {
    it('should sync batch operations successfully', async () => {
      // Arrange: Prepare test operations
      const operations: SyncOperation[] = [
        {
          entityId: 'prod-1',
          localId: 'local-prod-1',
          entityType: EntityType.PRODUCT,
          operationType: OperationType.CREATE,
          entityData: {
            name: 'Produit Test 1',
            price: 29.99,
            category: 'Test',
            stockQuantity: 100
          },
          timestamp: new Date().toISOString()
        },
        {
          entityId: 'sale-1',
          localId: 'local-sale-1',
          entityType: EntityType.SALE,
          operationType: OperationType.CREATE,
          entityData: {
            amount: 59.98,
            quantity: 2,
            customerName: 'Client Test'
          },
          timestamp: new Date().toISOString()
        }
      ];

      // Mock successful batch response
      mockApiClient.request.mockResolvedValue({
        data: {
          syncSessionId: 'test-session-123',
          totalProcessed: 2,
          successCount: 2,
          errorCount: 0,
          conflictCount: 0,
          processingTimeMs: 150,
          results: [
            {
              entityId: 'prod-1',
              localId: 'local-prod-1',
              serverId: 'server-prod-1',
              entityType: 'product',
              operationType: 'create',
              status: 'success',
              timestamp: new Date().toISOString()
            },
            {
              entityId: 'sale-1',
              localId: 'local-sale-1',
              serverId: 'server-sale-1',
              entityType: 'sale',
              operationType: 'create',
              status: 'success',
              timestamp: new Date().toISOString()
            }
          ],
          conflicts: [],
          errors: [],
          statistics: {
            byEntityType: { product: 1, sale: 1 },
            byOperationType: { create: 2 },
            averageProcessingTimeMs: 75
          },
          serverTimestamp: new Date().toISOString()
        }
      });

      // Act: Perform batch sync
      const result = await syncService.syncBatch(operations);

      // Assert: Verify results
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(2);
      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(0);
      expect(result.conflictCount).toBe(0);
      expect(result.processingTimeMs).toBe(150);
      expect(result.errors).toHaveLength(0);
      expect(result.conflicts).toHaveLength(0);

      // Verify API call was made correctly
      expect(mockApiClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/api/sync/batch',
          data: expect.objectContaining({
            operations: expect.arrayContaining([
              expect.objectContaining({
                entityType: EntityType.PRODUCT,
                operationType: OperationType.CREATE
              }),
              expect.objectContaining({
                entityType: EntityType.SALE,
                operationType: OperationType.CREATE
              })
            ]),
            deviceId: 'test-device-123',
            appVersion: '1.0.0'
          })
        })
      );
    });

    it('should handle batch sync with conflicts', async () => {
      // Arrange: Prepare operations with potential conflicts
      const operations: SyncOperation[] = [
        {
          entityId: 'prod-conflict',
          localId: 'local-prod-conflict',
          entityType: EntityType.PRODUCT,
          operationType: OperationType.UPDATE,
          entityData: {
            name: 'Produit Conflit',
            price: 39.99,
            category: 'Test'
          },
          timestamp: new Date().toISOString()
        }
      ];

      // Mock response with conflicts
      mockApiClient.request.mockResolvedValue({
        data: {
          syncSessionId: 'test-session-conflict',
          totalProcessed: 1,
          successCount: 0,
          errorCount: 0,
          conflictCount: 1,
          processingTimeMs: 100,
          results: [],
          conflicts: [
            {
              conflictId: 'conflict-1',
              entityId: 'prod-conflict',
              entityType: 'product',
              conflictType: 'update_conflict',
              localData: operations[0].entityData,
              serverData: {
                name: 'Produit Conflit Server',
                price: 35.99,
                category: 'Test'
              },
              message: 'Conflit de mise à jour détecté',
              timestamp: new Date().toISOString()
            }
          ],
          errors: [],
          statistics: {
            byEntityType: { product: 1 },
            byOperationType: { update: 1 },
            averageProcessingTimeMs: 100
          },
          serverTimestamp: new Date().toISOString()
        }
      });

      // Act: Perform batch sync
      const result = await syncService.syncBatch(operations);

      // Assert: Verify conflict handling
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.totalProcessed).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.errorCount).toBe(0);
      expect(result.conflictCount).toBe(1);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0]).toMatchObject({
        entityId: 'prod-conflict',
        entityType: 'product',
        conflictType: 'update_conflict'
      });
    });

    it('should handle batch sync with errors', async () => {
      // Arrange: Prepare operations with errors
      const operations: SyncOperation[] = [
        {
          entityId: 'invalid-entity',
          localId: 'local-invalid',
          entityType: EntityType.PRODUCT,
          operationType: OperationType.CREATE,
          entityData: {
            // Missing required fields
            name: '',
            price: -10
          },
          timestamp: new Date().toISOString()
        }
      ];

      // Mock response with errors
      mockApiClient.request.mockResolvedValue({
        data: {
          syncSessionId: 'test-session-error',
          totalProcessed: 1,
          successCount: 0,
          errorCount: 1,
          conflictCount: 0,
          processingTimeMs: 50,
          results: [],
          conflicts: [],
          errors: [
            {
              entityId: 'invalid-entity',
              entityType: 'product',
              operationType: 'create',
              errorCode: 'VALIDATION_ERROR',
              errorMessage: 'Données invalides: nom requis, prix doit être positif',
              timestamp: new Date().toISOString()
            }
          ],
          statistics: {
            byEntityType: { product: 1 },
            byOperationType: { create: 1 },
            averageProcessingTimeMs: 50
          },
          serverTimestamp: new Date().toISOString()
        }
      });

      // Act: Perform batch sync
      const result = await syncService.syncBatch(operations);

      // Assert: Verify error handling
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.totalProcessed).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.conflictCount).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        entityId: 'invalid-entity',
        entityType: 'product',
        errorCode: 'VALIDATION_ERROR'
      });
    });
  });

  describe('Flux de synchronisation delta', () => {
    it('should sync delta successfully', async () => {
      // Arrange: Mock delta response
      const mockDeltaResponse = {
        modifiedEntities: [
          {
            entityId: 'server-prod-1',
            entityType: 'product',
            entityData: {
              id: 'server-prod-1',
              name: 'Produit Modifié Serveur',
              price: 34.99,
              category: 'Test',
              stockQuantity: 95,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            lastModified: new Date().toISOString(),
            version: 2,
            operationType: 'update'
          }
        ],
        deletedEntities: [
          {
            entityId: 'deleted-prod-1',
            entityType: 'product',
            deletedAt: new Date().toISOString(),
            version: 3
          }
        ],
        totalModified: 1,
        totalDeleted: 1,
        serverTimestamp: new Date().toISOString(),
        syncSessionId: 'test-delta-session',
        hasMore: false,
        nextSyncTimestamp: new Date().toISOString(),
        statistics: {
          byEntityType: { product: 2 },
          byOperationType: { update: 1, delete: 1 },
          oldestModification: new Date(Date.now() - 3600000).toISOString(),
          newestModification: new Date().toISOString(),
          totalDataSizeBytes: 1024
        }
      };

      mockApiClient.request.mockResolvedValue({
        data: mockDeltaResponse
      });

      // Act: Perform delta sync
      const result = await syncService.syncDelta();

      // Assert: Verify results
      expect(result).toBeDefined();
      expect(result.totalModified).toBe(1);
      expect(result.totalDeleted).toBe(1);
      expect(result.hasMore).toBe(false);
      expect(result.modifiedEntities).toHaveLength(1);
      expect(result.deletedEntities).toHaveLength(1);
      expect(result.statistics).toBeDefined();

      // Verify API call was made correctly
      expect(mockApiClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/api/sync/delta',
          params: expect.objectContaining({
            deviceId: 'test-device-123',
            appVersion: '1.0.0',
            limit: '50'
          })
        })
      );
    });

    it('should handle delta sync with pagination', async () => {
      // Arrange: Mock delta response with hasMore = true
      const mockDeltaResponse = {
        modifiedEntities: Array.from({ length: 50 }, (_, i) => ({
          entityId: `prod-${i}`,
          entityType: 'product',
          entityData: {
            id: `prod-${i}`,
            name: `Produit ${i}`,
            price: 29.99 + i,
            category: 'Test'
          },
          lastModified: new Date().toISOString(),
          version: 1,
          operationType: 'update'
        })),
        deletedEntities: [],
        totalModified: 50,
        totalDeleted: 0,
        serverTimestamp: new Date().toISOString(),
        syncSessionId: 'test-delta-pagination',
        hasMore: true,
        nextSyncTimestamp: new Date().toISOString(),
        statistics: {
          byEntityType: { product: 50 },
          byOperationType: { update: 50 },
          totalDataSizeBytes: 25600
        }
      };

      mockApiClient.request.mockResolvedValue({
        data: mockDeltaResponse
      });

      // Act: Perform delta sync
      const result = await syncService.syncDelta();

      // Assert: Verify pagination handling
      expect(result).toBeDefined();
      expect(result.totalModified).toBe(50);
      expect(result.hasMore).toBe(true);
      expect(result.modifiedEntities).toHaveLength(50);
      expect(result.nextSyncTimestamp).toBeDefined();
    });
  });

  describe('Flux de synchronisation complète', () => {
    it('should perform complete sync (batch + delta)', async () => {
      // Arrange: Mock responses for both batch and delta
      const mockBatchResponse = {
        syncSessionId: 'test-complete-batch',
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
      };

      const mockDeltaResponse = {
        modifiedEntities: [],
        deletedEntities: [],
        totalModified: 0,
        totalDeleted: 0,
        serverTimestamp: new Date().toISOString(),
        syncSessionId: 'test-complete-delta',
        hasMore: false,
        nextSyncTimestamp: new Date().toISOString(),
        statistics: {
          byEntityType: {},
          byOperationType: {},
          totalDataSizeBytes: 0
        }
      };

      // Mock API calls
      mockApiClient.request
        .mockResolvedValueOnce({ data: mockBatchResponse })
        .mockResolvedValueOnce({ data: mockDeltaResponse });

      // Act: Perform complete sync
      const result = await syncService.syncAll();

      // Assert: Verify complete sync
      expect(result).toBeDefined();
      expect(result.batch).toBeDefined();
      expect(result.delta).toBeDefined();
      expect(result.batch?.successCount).toBe(1);
      expect(result.delta?.totalModified).toBe(0);

      // Verify both API calls were made
      expect(mockApiClient.request).toHaveBeenCalledTimes(2);
    });
  });

  describe('Gestion des erreurs réseau', () => {
    it('should handle network timeout', async () => {
      // Arrange: Mock network timeout
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      mockApiClient.request.mockRejectedValue(timeoutError);

      const operations: SyncOperation[] = [
        {
          entityId: 'test-timeout',
          localId: 'local-timeout',
          entityType: EntityType.PRODUCT,
          operationType: OperationType.CREATE,
          entityData: { name: 'Test Timeout' },
          timestamp: new Date().toISOString()
        }
      ];

      // Act & Assert: Should throw error
      await expect(syncService.syncBatch(operations)).rejects.toThrow('Network timeout');
    });

    it('should handle server error (500)', async () => {
      // Arrange: Mock server error
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };
      mockApiClient.request.mockRejectedValue(serverError);

      // Act & Assert: Should throw error
      await expect(syncService.syncDelta()).rejects.toThrow();
    });

    it('should handle authentication error (401)', async () => {
      // Arrange: Mock auth error
      const authError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };
      mockApiClient.request.mockRejectedValue(authError);

      // Act & Assert: Should throw error
      await expect(syncService.getServerStatus()).rejects.toThrow();
    });
  });

  describe('Gestion des états et événements', () => {
    it('should emit events during sync process', async () => {
      // Arrange: Setup event listener
      const eventListener = jest.fn();
      syncService.addEventListener(eventListener);

      // Mock successful response
      mockApiClient.request.mockResolvedValue({
        data: {
          syncSessionId: 'test-events',
          totalProcessed: 1,
          successCount: 1,
          errorCount: 0,
          conflictCount: 0,
          processingTimeMs: 50,
          results: [],
          conflicts: [],
          errors: [],
          statistics: {},
          serverTimestamp: new Date().toISOString()
        }
      });

      const operations: SyncOperation[] = [
        {
          entityId: 'test-events',
          localId: 'local-events',
          entityType: EntityType.PRODUCT,
          operationType: OperationType.CREATE,
          entityData: { name: 'Test Events' },
          timestamp: new Date().toISOString()
        }
      ];

      // Act: Perform sync
      await syncService.syncBatch(operations);

      // Assert: Verify events were emitted
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sync_started'
        })
      );

      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sync_completed'
        })
      );

      // Cleanup
      syncService.removeEventListener(eventListener);
    });

    it('should update sync state correctly', async () => {
      // Arrange: Mock response
      mockApiClient.request.mockResolvedValue({
        data: {
          syncSessionId: 'test-state',
          totalProcessed: 1,
          successCount: 1,
          errorCount: 0,
          conflictCount: 0,
          processingTimeMs: 50,
          results: [],
          conflicts: [],
          errors: [],
          statistics: {},
          serverTimestamp: new Date().toISOString()
        }
      });

      // Act: Start sync and check state
      const operations: SyncOperation[] = [
        {
          entityId: 'test-state',
          localId: 'local-state',
          entityType: EntityType.PRODUCT,
          operationType: OperationType.CREATE,
          entityData: { name: 'Test State' },
          timestamp: new Date().toISOString()
        }
      ];

      // Start sync (async)
      const syncPromise = syncService.syncBatch(operations);

      // Check state during sync
      const state = syncService.getCurrentState();
      expect(state).toBe(SyncState.SYNCING);

      // Wait for completion
      await syncPromise;

      // Check final state
      const finalState = syncService.getCurrentState();
      expect(finalState).toBe(SyncState.COMPLETED);
    });
  });

  describe('Configuration et métadonnées', () => {
    it('should persist sync metadata correctly', async () => {
      // Arrange: Mock successful sync
      mockApiClient.request.mockResolvedValue({
        data: {
          syncSessionId: 'test-metadata',
          totalProcessed: 1,
          successCount: 1,
          errorCount: 0,
          conflictCount: 0,
          processingTimeMs: 50,
          results: [],
          conflicts: [],
          errors: [],
          statistics: {},
          serverTimestamp: new Date().toISOString()
        }
      });

      const operations: SyncOperation[] = [
        {
          entityId: 'test-metadata',
          localId: 'local-metadata',
          entityType: EntityType.PRODUCT,
          operationType: OperationType.CREATE,
          entityData: { name: 'Test Metadata' },
          timestamp: new Date().toISOString()
        }
      ];

      // Act: Perform sync
      await syncService.syncBatch(operations);

      // Assert: Check metadata was updated
      const metadata = syncService.getSyncMetadata();
      expect(metadata).toBeDefined();
      expect(metadata?.totalSyncCount).toBeGreaterThan(0);
      expect(metadata?.successfulSyncCount).toBeGreaterThan(0);
      expect(metadata?.lastSyncType).toBe('batch');
      expect(metadata?.lastSyncStatus).toBe('success');
    });

    it('should update configuration correctly', async () => {
      // Arrange: New configuration
      const newConfig = {
        batchSize: 100,
        maxRetries: 5,
        timeoutMs: 60000
      };

      // Act: Update configuration
      await syncService.updateConfig(newConfig);

      // Assert: Verify configuration was updated
      const config = syncService.getConfig();
      expect(config.batchSize).toBe(100);
      expect(config.maxRetries).toBe(5);
      expect(config.timeoutMs).toBe(60000);
    });
  });
});

