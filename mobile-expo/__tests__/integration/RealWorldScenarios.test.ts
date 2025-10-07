/**
 * Tests d'intégration pour les scénarios réels de synchronisation
 * Valide les cas d'usage réels de synchronisation bidirectionnelle
 */

import SyncService from '../../src/services/sync/SyncService';
import { NetworkService } from '../../src/services/network';
import {
  EntityType,
  OperationType,
  SyncOperation,
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

describe('Scénarios Réels de Synchronisation', () => {
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
    await syncService.initialize('real-device-123', '1.0.0');
  });

  afterEach(async () => {
    await syncService.cleanup();
  });

  describe('Scénario 1: Boutiquier en zone rurale - Connexion instable', () => {
    it('should handle intermittent connectivity gracefully', async () => {
      // Arrange: Simulate intermittent connectivity
      let isOnline = false;
      const networkService = NetworkService.getInstance();
      networkService.isOnline = jest.fn(() => isOnline);

      const operations: SyncOperation[] = [
        {
          entityId: 'prod-rural-1',
          localId: 'local-prod-rural-1',
          entityType: EntityType.PRODUCT,
          operationType: OperationType.CREATE,
          entityData: {
            name: 'Riz 50kg',
            price: 25000,
            category: 'Alimentation',
            stockQuantity: 10
          },
          timestamp: new Date().toISOString()
        }
      ];

      // Act: Attempt sync when offline (should fail)
      isOnline = false;
      await expect(syncService.syncBatch(operations)).rejects.toThrow('Pas de connexion réseau');

      // Simulate connection restored
      isOnline = true;
      mockApiClient.request.mockResolvedValue({
        data: {
          syncSessionId: 'rural-session-1',
          totalProcessed: 1,
          successCount: 1,
          errorCount: 0,
          conflictCount: 0,
          processingTimeMs: 2000, // Slower connection
          results: [],
          conflicts: [],
          errors: [],
          statistics: {},
          serverTimestamp: new Date().toISOString()
        }
      });

      // Retry sync when online
      const result = await syncService.syncBatch(operations);

      // Assert: Verify successful sync after connection restored
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(1);
      expect(result.processingTimeMs).toBe(2000);
    });

    it('should handle slow network connections', async () => {
      // Arrange: Simulate slow connection
      mockApiClient.request.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              data: {
                syncSessionId: 'slow-session-1',
                totalProcessed: 1,
                successCount: 1,
                errorCount: 0,
                conflictCount: 0,
                processingTimeMs: 10000, // 10 seconds
                results: [],
                conflicts: [],
                errors: [],
                statistics: {},
                serverTimestamp: new Date().toISOString()
              }
            });
          }, 1000); // 1 second delay
        })
      );

      const operations: SyncOperation[] = [
        {
          entityId: 'prod-slow-1',
          localId: 'local-prod-slow-1',
          entityType: EntityType.PRODUCT,
          operationType: OperationType.CREATE,
          entityData: {
            name: 'Huile de palme 5L',
            price: 8000,
            category: 'Alimentation',
            stockQuantity: 20
          },
          timestamp: new Date().toISOString()
        }
      ];

      // Act: Perform sync with slow connection
      const startTime = Date.now();
      const result = await syncService.syncBatch(operations);
      const endTime = Date.now();

      // Assert: Verify sync completed despite slow connection
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeGreaterThan(1000); // Should take at least 1 second
    });
  });

  describe('Scénario 2: Synchronisation de masse - 100+ opérations', () => {
    it('should handle large batch operations efficiently', async () => {
      // Arrange: Create large batch of operations
      const operations: SyncOperation[] = [];
      for (let i = 1; i <= 100; i++) {
        operations.push({
          entityId: `prod-mass-${i}`,
          localId: `local-prod-mass-${i}`,
          entityType: EntityType.PRODUCT,
          operationType: OperationType.CREATE,
          entityData: {
            name: `Produit ${i}`,
            price: 1000 + (i * 10),
            category: 'Divers',
            stockQuantity: Math.floor(Math.random() * 100) + 1
          },
          timestamp: new Date().toISOString()
        });
      }

      // Mock successful response for large batch
      mockApiClient.request.mockResolvedValue({
        data: {
          syncSessionId: 'mass-session-1',
          totalProcessed: 100,
          successCount: 100,
          errorCount: 0,
          conflictCount: 0,
          processingTimeMs: 5000,
          results: [],
          conflicts: [],
          errors: [],
          statistics: {
            byEntityType: { product: 100 },
            byOperationType: { create: 100 },
            averageProcessingTimeMs: 50
          },
          serverTimestamp: new Date().toISOString()
        }
      });

      // Act: Perform mass sync
      const startTime = Date.now();
      const result = await syncService.syncBatch(operations);
      const endTime = Date.now();

      // Assert: Verify mass sync was successful
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(100);
      expect(result.successCount).toBe(100);
      expect(result.processingTimeMs).toBe(5000);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle mixed entity types in large batch', async () => {
      // Arrange: Create mixed batch with products, sales, and stock movements
      const operations: SyncOperation[] = [];
      
      // 50 products
      for (let i = 1; i <= 50; i++) {
        operations.push({
          entityId: `prod-mixed-${i}`,
          localId: `local-prod-mixed-${i}`,
          entityType: EntityType.PRODUCT,
          operationType: OperationType.CREATE,
          entityData: {
            name: `Produit ${i}`,
            price: 1000 + (i * 10),
            category: 'Divers',
            stockQuantity: 50
          },
          timestamp: new Date().toISOString()
        });
      }

      // 30 sales
      for (let i = 1; i <= 30; i++) {
        operations.push({
          entityId: `sale-mixed-${i}`,
          localId: `local-sale-mixed-${i}`,
          entityType: EntityType.SALE,
          operationType: OperationType.CREATE,
          entityData: {
            amount: 2000 + (i * 50),
            quantity: Math.floor(Math.random() * 5) + 1,
            customerName: `Client ${i}`
          },
          timestamp: new Date().toISOString()
        });
      }

      // 20 stock movements
      for (let i = 1; i <= 20; i++) {
        operations.push({
          entityId: `stock-mixed-${i}`,
          localId: `local-stock-mixed-${i}`,
          entityType: EntityType.STOCK_MOVEMENT,
          operationType: OperationType.CREATE,
          entityData: {
            productId: `prod-mixed-${i}`,
            quantity: -Math.floor(Math.random() * 10) - 1,
            movementType: 'sale',
            reason: `Vente produit ${i}`
          },
          timestamp: new Date().toISOString()
        });
      }

      // Mock successful response for mixed batch
      mockApiClient.request.mockResolvedValue({
        data: {
          syncSessionId: 'mixed-session-1',
          totalProcessed: 100,
          successCount: 100,
          errorCount: 0,
          conflictCount: 0,
          processingTimeMs: 3000,
          results: [],
          conflicts: [],
          errors: [],
          statistics: {
            byEntityType: { product: 50, sale: 30, stock_movement: 20 },
            byOperationType: { create: 100 },
            averageProcessingTimeMs: 30
          },
          serverTimestamp: new Date().toISOString()
        }
      });

      // Act: Perform mixed batch sync
      const result = await syncService.syncBatch(operations);

      // Assert: Verify mixed batch sync was successful
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(100);
      expect(result.successCount).toBe(100);
      expect(result.statistics.byEntityType.product).toBe(50);
      expect(result.statistics.byEntityType.sale).toBe(30);
      expect(result.statistics.byEntityType.stock_movement).toBe(20);
    });
  });

  describe('Scénario 3: Conflits de données - Mise à jour simultanée', () => {
    it('should handle update conflicts gracefully', async () => {
      // Arrange: Create operation that will cause conflict
      const operations: SyncOperation[] = [
        {
          entityId: 'prod-conflict-1',
          localId: 'local-prod-conflict-1',
          entityType: EntityType.PRODUCT,
          operationType: OperationType.UPDATE,
          entityData: {
            name: 'Produit Local Modifié',
            price: 15000,
            category: 'Alimentation',
            stockQuantity: 15
          },
          timestamp: new Date().toISOString()
        }
      ];

      // Mock response with conflict
      mockApiClient.request.mockResolvedValue({
        data: {
          syncSessionId: 'conflict-session-1',
          totalProcessed: 1,
          successCount: 0,
          errorCount: 0,
          conflictCount: 1,
          processingTimeMs: 500,
          results: [],
          conflicts: [
            {
              conflictId: 'conflict-1',
              entityId: 'prod-conflict-1',
              entityType: 'product',
              conflictType: 'update_conflict',
              localData: {
                name: 'Produit Local Modifié',
                price: 15000,
                category: 'Alimentation',
                stockQuantity: 15
              },
              serverData: {
                name: 'Produit Serveur Modifié',
                price: 12000,
                category: 'Alimentation',
                stockQuantity: 20
              },
              message: 'Conflit de mise à jour détecté - prix et stock modifiés simultanément',
              timestamp: new Date().toISOString()
            }
          ],
          errors: [],
          statistics: {
            byEntityType: { product: 1 },
            byOperationType: { update: 1 },
            averageProcessingTimeMs: 500
          },
          serverTimestamp: new Date().toISOString()
        }
      });

      // Act: Perform sync with conflict
      const result = await syncService.syncBatch(operations);

      // Assert: Verify conflict was handled
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.totalProcessed).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.conflictCount).toBe(1);
      expect(result.conflicts).toHaveLength(1);
      
      const conflict = result.conflicts[0];
      expect(conflict.entityId).toBe('prod-conflict-1');
      expect(conflict.conflictType).toBe('update_conflict');
      expect(conflict.localData.price).toBe(15000);
      expect(conflict.serverData.price).toBe(12000);
    });

    it('should handle delete conflicts', async () => {
      // Arrange: Create delete operation that will cause conflict
      const operations: SyncOperation[] = [
        {
          entityId: 'prod-delete-conflict',
          localId: 'local-prod-delete-conflict',
          entityType: EntityType.PRODUCT,
          operationType: OperationType.DELETE,
          entityData: {},
          timestamp: new Date().toISOString()
        }
      ];

      // Mock response with delete conflict
      mockApiClient.request.mockResolvedValue({
        data: {
          syncSessionId: 'delete-conflict-session',
          totalProcessed: 1,
          successCount: 0,
          errorCount: 0,
          conflictCount: 1,
          processingTimeMs: 300,
          results: [],
          conflicts: [
            {
              conflictId: 'delete-conflict-1',
              entityId: 'prod-delete-conflict',
              entityType: 'product',
              conflictType: 'delete_conflict',
              localData: {},
              serverData: {
                name: 'Produit Modifié sur Serveur',
                price: 18000,
                category: 'Alimentation',
                stockQuantity: 25
              },
              message: 'Conflit de suppression - produit modifié sur serveur',
              timestamp: new Date().toISOString()
            }
          ],
          errors: [],
          statistics: {
            byEntityType: { product: 1 },
            byOperationType: { delete: 1 },
            averageProcessingTimeMs: 300
          },
          serverTimestamp: new Date().toISOString()
        }
      });

      // Act: Perform sync with delete conflict
      const result = await syncService.syncBatch(operations);

      // Assert: Verify delete conflict was handled
      expect(result).toBeDefined();
      expect(result.conflictCount).toBe(1);
      expect(result.conflicts[0].conflictType).toBe('delete_conflict');
    });
  });

  describe('Scénario 4: Synchronisation delta - Récupération modifications serveur', () => {
    it('should handle large delta sync with pagination', async () => {
      // Arrange: Mock large delta response with pagination
      const mockDeltaResponse = {
        modifiedEntities: Array.from({ length: 50 }, (_, i) => ({
          entityId: `server-prod-${i}`,
          entityType: 'product',
          entityData: {
            id: `server-prod-${i}`,
            name: `Produit Serveur ${i}`,
            price: 1000 + (i * 10),
            category: 'Serveur',
            stockQuantity: 100 + i,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          lastModified: new Date(Date.now() - (i * 60000)).toISOString(), // 1 minute apart
          version: 2,
          operationType: 'update'
        })),
        deletedEntities: Array.from({ length: 10 }, (_, i) => ({
          entityId: `deleted-prod-${i}`,
          entityType: 'product',
          deletedAt: new Date(Date.now() - (i * 30000)).toISOString(),
          version: 3
        })),
        totalModified: 50,
        totalDeleted: 10,
        serverTimestamp: new Date().toISOString(),
        syncSessionId: 'delta-pagination-session',
        hasMore: true,
        nextSyncTimestamp: new Date().toISOString(),
        statistics: {
          byEntityType: { product: 60 },
          byOperationType: { update: 50, delete: 10 },
          oldestModification: new Date(Date.now() - (59 * 60000)).toISOString(),
          newestModification: new Date().toISOString(),
          totalDataSizeBytes: 25600
        }
      };

      mockApiClient.request.mockResolvedValue({
        data: mockDeltaResponse
      });

      // Act: Perform delta sync
      const result = await syncService.syncDelta();

      // Assert: Verify delta sync with pagination
      expect(result).toBeDefined();
      expect(result.totalModified).toBe(50);
      expect(result.totalDeleted).toBe(10);
      expect(result.hasMore).toBe(true);
      expect(result.modifiedEntities).toHaveLength(50);
      expect(result.deletedEntities).toHaveLength(10);
      expect(result.statistics.totalDataSizeBytes).toBe(25600);
    });

    it('should handle delta sync with no changes', async () => {
      // Arrange: Mock delta response with no changes
      const mockDeltaResponse = {
        modifiedEntities: [],
        deletedEntities: [],
        totalModified: 0,
        totalDeleted: 0,
        serverTimestamp: new Date().toISOString(),
        syncSessionId: 'delta-no-changes-session',
        hasMore: false,
        nextSyncTimestamp: new Date().toISOString(),
        statistics: {
          byEntityType: {},
          byOperationType: {},
          totalDataSizeBytes: 0
        }
      };

      mockApiClient.request.mockResolvedValue({
        data: mockDeltaResponse
      });

      // Act: Perform delta sync
      const result = await syncService.syncDelta();

      // Assert: Verify no changes delta sync
      expect(result).toBeDefined();
      expect(result.totalModified).toBe(0);
      expect(result.totalDeleted).toBe(0);
      expect(result.hasMore).toBe(false);
      expect(result.modifiedEntities).toHaveLength(0);
      expect(result.deletedEntities).toHaveLength(0);
    });
  });

  describe('Scénario 5: Gestion des erreurs serveur', () => {
    it('should handle server maintenance (503)', async () => {
      // Arrange: Mock server maintenance error
      const maintenanceError = {
        response: {
          status: 503,
          data: { 
            message: 'Service temporairement indisponible - Maintenance en cours',
            retryAfter: 300 // 5 minutes
          }
        }
      };
      mockApiClient.request.mockRejectedValue(maintenanceError);

      const operations: SyncOperation[] = [
        {
          entityId: 'prod-maintenance',
          localId: 'local-prod-maintenance',
          entityType: EntityType.PRODUCT,
          operationType: OperationType.CREATE,
          entityData: { name: 'Produit Maintenance' },
          timestamp: new Date().toISOString()
        }
      ];

      // Act & Assert: Should handle maintenance error gracefully
      await expect(syncService.syncBatch(operations)).rejects.toThrow();
    });

    it('should handle rate limiting (429)', async () => {
      // Arrange: Mock rate limiting error
      const rateLimitError = {
        response: {
          status: 429,
          data: { 
            message: 'Trop de requêtes - Limite atteinte',
            retryAfter: 60 // 1 minute
          }
        }
      };
      mockApiClient.request.mockRejectedValue(rateLimitError);

      // Act & Assert: Should handle rate limiting gracefully
      await expect(syncService.syncDelta()).rejects.toThrow();
    });

    it('should handle server error (500)', async () => {
      // Arrange: Mock server error
      const serverError = {
        response: {
          status: 500,
          data: { 
            message: 'Erreur interne du serveur',
            errorCode: 'INTERNAL_SERVER_ERROR'
          }
        }
      };
      mockApiClient.request.mockRejectedValue(serverError);

      // Act & Assert: Should handle server error gracefully
      await expect(syncService.getServerStatus()).rejects.toThrow();
    });
  });

  describe('Scénario 6: Performance et optimisation', () => {
    it('should complete sync within acceptable time limits', async () => {
      // Arrange: Mock fast response
      mockApiClient.request.mockResolvedValue({
        data: {
          syncSessionId: 'performance-session',
          totalProcessed: 10,
          successCount: 10,
          errorCount: 0,
          conflictCount: 0,
          processingTimeMs: 100,
          results: [],
          conflicts: [],
          errors: [],
          statistics: {},
          serverTimestamp: new Date().toISOString()
        }
      });

      const operations: SyncOperation[] = Array.from({ length: 10 }, (_, i) => ({
        entityId: `perf-${i}`,
        localId: `local-perf-${i}`,
        entityType: EntityType.PRODUCT,
        operationType: OperationType.CREATE,
        entityData: { name: `Produit ${i}` },
        timestamp: new Date().toISOString()
      }));

      // Act: Measure sync performance
      const startTime = Date.now();
      const result = await syncService.syncBatch(operations);
      const endTime = Date.now();

      // Assert: Verify performance
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle concurrent sync operations', async () => {
      // Arrange: Mock concurrent responses
      mockApiClient.request
        .mockResolvedValueOnce({
          data: {
            syncSessionId: 'concurrent-1',
            totalProcessed: 5,
            successCount: 5,
            errorCount: 0,
            conflictCount: 0,
            processingTimeMs: 200,
            results: [],
            conflicts: [],
            errors: [],
            statistics: {},
            serverTimestamp: new Date().toISOString()
          }
        })
        .mockResolvedValueOnce({
          data: {
            modifiedEntities: [],
            deletedEntities: [],
            totalModified: 0,
            totalDeleted: 0,
            serverTimestamp: new Date().toISOString(),
            syncSessionId: 'concurrent-2',
            hasMore: false,
            nextSyncTimestamp: new Date().toISOString(),
            statistics: { totalDataSizeBytes: 0 }
          }
        });

      const operations: SyncOperation[] = Array.from({ length: 5 }, (_, i) => ({
        entityId: `concurrent-${i}`,
        localId: `local-concurrent-${i}`,
        entityType: EntityType.PRODUCT,
        operationType: OperationType.CREATE,
        entityData: { name: `Produit Concurrent ${i}` },
        timestamp: new Date().toISOString()
      }));

      // Act: Perform concurrent operations
      const batchPromise = syncService.syncBatch(operations);
      const deltaPromise = syncService.syncDelta();

      const [batchResult, deltaResult] = await Promise.all([batchPromise, deltaPromise]);

      // Assert: Verify both operations completed successfully
      expect(batchResult).toBeDefined();
      expect(batchResult.success).toBe(true);
      expect(batchResult.successCount).toBe(5);

      expect(deltaResult).toBeDefined();
      expect(deltaResult.totalModified).toBe(0);
      expect(deltaResult.totalDeleted).toBe(0);
    });
  });
});

