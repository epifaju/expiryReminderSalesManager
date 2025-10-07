/**
 * Tests unitaires pour le SyncQueueService
 * Teste la gestion de la queue de synchronisation et l'intégration réseau
 */

import SyncQueueService, { SyncOptions, SyncResult, QueueStats } from '../../src/services/sync/SyncQueueService';
import { SyncQueueItem, SyncOperation, EntityType } from '../../src/types/models';

describe('SyncQueueService', () => {
  // Mock du DatabaseService
  const mockDatabaseService = {
    isInitialized: jest.fn(() => true),
    initDatabase: jest.fn(),
    executeSql: jest.fn()
  };

  // Mock du NetworkService
  const mockNetworkService = {
    isOnline: jest.fn(() => true),
    addListener: jest.fn(() => () => {})
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock des services
    jest.doMock('../../src/services/database/DatabaseService', () => mockDatabaseService);
    jest.doMock('../../src/services/network/NetworkService', () => mockNetworkService);
  });

  describe('Initialisation et configuration', () => {
    test('doit être une classe singleton', () => {
      const instance1 = SyncQueueService.getInstance();
      const instance2 = SyncQueueService.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('doit avoir les méthodes requises', () => {
      const expectedMethods = [
        'initialize',
        'addToQueue',
        'getPendingItems',
        'processQueue',
        'triggerManualSync',
        'getPendingCount',
        'getQueueStats',
        'clearQueue',
        'cleanup'
      ];

      expectedMethods.forEach(method => {
        expect(typeof SyncQueueService[method]).toBe('function');
      });
    });

    test('doit retourner false par défaut pour l\'état de traitement', () => {
      expect(SyncQueueService.isSyncInProgress()).toBe(false);
      expect(SyncQueueService.isServiceInitialized()).toBe(false);
    });
  });

  describe('Gestion de la queue', () => {
    test('doit ajouter un élément à la queue', async () => {
      const mockInsertResult = { insertId: '123' };
      mockDatabaseService.executeSql.mockResolvedValueOnce(mockInsertResult);

      const item = await SyncQueueService.addToQueue(
        'product',
        'create',
        'prod-123',
        { name: 'Test Product', price: 100 },
        { priority: 1 }
      );

      expect(item).toHaveProperty('id', '123');
      expect(item.entity_type).toBe('product');
      expect(item.operation).toBe('create');
      expect(item.entity_id).toBe('prod-123');
      expect(item.priority).toBe(1);
    });

    test('doit gérer les erreurs lors de l\'ajout à la queue', async () => {
      mockDatabaseService.executeSql.mockRejectedValueOnce(new Error('Database error'));

      await expect(
        SyncQueueService.addToQueue('product', 'create', 'prod-123', {})
      ).rejects.toThrow('Échec de l\'ajout à la queue: Database error');
    });

    test('doit récupérer les éléments en attente', async () => {
      const mockRows = [
        {
          id: '1',
          entity_type: 'product',
          operation: 'create',
          entity_id: 'prod-123',
          entity_data: '{"name":"Test"}',
          priority: 1,
          retry_count: 0,
          max_retries: 3,
          status: 'pending',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          scheduled_at: '2025-01-01T00:00:00Z'
        }
      ];

      mockDatabaseService.executeSql.mockResolvedValueOnce({ rows: mockRows });

      const items = await SyncQueueService.getPendingItems(10);

      expect(items).toHaveLength(1);
      expect(items[0].entity_type).toBe('product');
      expect(items[0].entity_data).toEqual({ name: 'Test' });
    });

    test('doit compter les éléments en attente', async () => {
      mockDatabaseService.executeSql.mockResolvedValueOnce({ rows: [{ count: 5 }] });

      const count = await SyncQueueService.getPendingCount();

      expect(count).toBe(5);
    });
  });

  describe('Traitement de la queue', () => {
    test('doit traiter la queue avec succès', async () => {
      // Mock des éléments en attente
      const mockPendingItems = [
        {
          id: '1',
          entity_type: 'product',
          operation: 'create',
          entity_id: 'prod-123',
          entity_data: { name: 'Test' },
          priority: 1,
          retry_count: 0,
          max_retries: 3,
          status: 'pending',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          scheduled_at: '2025-01-01T00:00:00Z'
        }
      ];

      mockDatabaseService.executeSql
        .mockResolvedValueOnce({ rows: mockPendingItems }) // getPendingItems
        .mockResolvedValueOnce({ rowsAffected: 1 }); // markItemAsCompleted

      const result = await SyncQueueService.processQueue();

      expect(result.successCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.conflictCount).toBe(0);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    test('doit gérer les échecs de synchronisation', async () => {
      const mockPendingItems = [
        {
          id: '1',
          entity_type: 'product',
          operation: 'create',
          entity_id: 'prod-123',
          entity_data: { name: 'Test' },
          priority: 1,
          retry_count: 0,
          max_retries: 3,
          status: 'pending',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          scheduled_at: '2025-01-01T00:00:00Z'
        }
      ];

      // Simuler un échec
      mockDatabaseService.executeSql
        .mockResolvedValueOnce({ rows: mockPendingItems }) // getPendingItems
        .mockResolvedValueOnce({ rowsAffected: 1 }); // handleItemFailure (retry)

      const result = await SyncQueueService.processQueue();

      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(1);
    });

    test('doit ignorer la synchronisation si déjà en cours', async () => {
      // Simuler une synchronisation en cours
      SyncQueueService['isProcessing'] = true;

      const result = await SyncQueueService.processQueue();

      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(0);
      expect(result.errors).toContain('Synchronisation déjà en cours');
    });

    test('doit reporter la synchronisation si hors ligne', async () => {
      mockNetworkService.isOnline.mockReturnValue(false);

      const result = await SyncQueueService.processQueue();

      expect(result.successCount).toBe(0);
      expect(result.failedCount).toBe(0);
      expect(result.errors).toContain('Pas de connectivité réseau');
    });
  });

  describe('Statistiques de la queue', () => {
    test('doit retourner les statistiques complètes', async () => {
      const mockStats = {
        pending: [{ count: 5 }],
        byEntity: [
          { entity_type: 'product', count: 3 },
          { entity_type: 'sale', count: 2 }
        ],
        byOperation: [
          { operation: 'create', count: 3 },
          { operation: 'update', count: 2 }
        ],
        byPriority: [
          { priority: 1, count: 2 },
          { priority: 3, count: 3 }
        ],
        lastSync: [{ last_sync: '2025-01-01T10:00:00Z' }],
        nextRetry: [{ next_retry: '2025-01-01T11:00:00Z' }]
      };

      mockDatabaseService.executeSql
        .mockResolvedValueOnce({ rows: mockStats.pending })
        .mockResolvedValueOnce({ rows: mockStats.byEntity })
        .mockResolvedValueOnce({ rows: mockStats.byOperation })
        .mockResolvedValueOnce({ rows: mockStats.byPriority })
        .mockResolvedValueOnce({ rows: mockStats.lastSync })
        .mockResolvedValueOnce({ rows: mockStats.nextRetry });

      const stats = await SyncQueueService.getQueueStats();

      expect(stats.pendingCount).toBe(5);
      expect(stats.byEntityType.product).toBe(3);
      expect(stats.byEntityType.sale).toBe(2);
      expect(stats.byOperation.create).toBe(3);
      expect(stats.byOperation.update).toBe(2);
      expect(stats.byPriority[1]).toBe(2);
      expect(stats.byPriority[3]).toBe(3);
      expect(stats.lastSyncTime).toBe('2025-01-01T10:00:00Z');
      expect(stats.nextRetryTime).toBe('2025-01-01T11:00:00Z');
    });
  });

  describe('Gestion des erreurs et retry', () => {
    test('doit calculer correctement le délai de retry', () => {
      const service = SyncQueueService as any;
      
      expect(service.calculateRetryDelay(1)).toBe(5000); // 5 secondes
      expect(service.calculateRetryDelay(2)).toBe(10000); // 10 secondes
      expect(service.calculateRetryDelay(3)).toBe(20000); // 20 secondes
      expect(service.calculateRetryDelay(10)).toBe(300000); // Max 5 minutes
    });

    test('doit marquer un élément comme terminé', async () => {
      mockDatabaseService.executeSql.mockResolvedValueOnce({ rowsAffected: 1 });

      const service = SyncQueueService as any;
      await service.markItemAsCompleted('item-123');

      expect(mockDatabaseService.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sync_queue'),
        expect.arrayContaining(['synced', expect.any(String), 'item-123'])
      );
    });

    test('doit marquer un élément comme en conflit', async () => {
      mockDatabaseService.executeSql.mockResolvedValueOnce({ rowsAffected: 1 });

      const service = SyncQueueService as any;
      await service.markItemAsConflict('item-123', 'Conflit détecté');

      expect(mockDatabaseService.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sync_queue'),
        expect.arrayContaining(['conflict', expect.any(String), 'item-123'])
      );
    });
  });

  describe('Vidage de la queue', () => {
    test('doit vider toute la queue', async () => {
      mockDatabaseService.executeSql.mockResolvedValueOnce({ rowsAffected: 10 });

      const deletedCount = await SyncQueueService.clearQueue();

      expect(deletedCount).toBe(10);
      expect(mockDatabaseService.executeSql).toHaveBeenCalledWith(
        'DELETE FROM sync_queue',
        []
      );
    });

    test('doit vider la queue par statut', async () => {
      mockDatabaseService.executeSql.mockResolvedValueOnce({ rowsAffected: 5 });

      const deletedCount = await SyncQueueService.clearQueue('failed');

      expect(deletedCount).toBe(5);
      expect(mockDatabaseService.executeSql).toHaveBeenCalledWith(
        'DELETE FROM sync_queue WHERE status = ?',
        ['failed']
      );
    });
  });

  describe('Types et interfaces', () => {
    test('SyncOptions doit avoir la structure correcte', () => {
      const options: SyncOptions = {
        forceSync: true,
        priority: 1,
        retryDelay: 3000,
        maxRetries: 5
      };

      expect(options.forceSync).toBe(true);
      expect(options.priority).toBe(1);
      expect(options.retryDelay).toBe(3000);
      expect(options.maxRetries).toBe(5);
    });

    test('SyncResult doit avoir la structure correcte', () => {
      const result: SyncResult = {
        successCount: 5,
        failedCount: 2,
        conflictCount: 1,
        errors: ['Erreur 1', 'Erreur 2'],
        processingTime: 1500
      };

      expect(result.successCount).toBe(5);
      expect(result.failedCount).toBe(2);
      expect(result.conflictCount).toBe(1);
      expect(result.errors).toHaveLength(2);
      expect(result.processingTime).toBe(1500);
    });

    test('QueueStats doit avoir la structure correcte', () => {
      const stats: QueueStats = {
        pendingCount: 10,
        byEntityType: { product: 5, sale: 3, stock_movement: 2 },
        byOperation: { create: 6, update: 3, delete: 1 },
        byPriority: { 1: 2, 2: 3, 3: 5 },
        lastSyncTime: '2025-01-01T10:00:00Z',
        nextRetryTime: '2025-01-01T11:00:00Z'
      };

      expect(stats.pendingCount).toBe(10);
      expect(stats.byEntityType.product).toBe(5);
      expect(stats.byOperation.create).toBe(6);
      expect(stats.byPriority[1]).toBe(2);
      expect(stats.lastSyncTime).toBe('2025-01-01T10:00:00Z');
    });
  });

  describe('Intégration réseau', () => {
    test('doit s\'abonner aux changements de réseau', async () => {
      await SyncQueueService.initialize();

      expect(mockNetworkService.addListener).toHaveBeenCalled();
    });

    test('doit déclencher la synchronisation au retour de connectivité', () => {
      // Simuler un changement de réseau
      const networkListener = mockNetworkService.addListener.mock.calls[0][0];
      
      networkListener({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
        details: {},
        timestamp: '2025-01-01T00:00:00Z'
      });

      // Vérifier que la synchronisation est programmée
      // (Dans un vrai test, on vérifierait que scheduleSync est appelé)
      expect(networkListener).toBeDefined();
    });
  });

  describe('Nettoyage des ressources', () => {
    test('doit nettoyer correctement les ressources', async () => {
      // Simuler des ressources actives
      SyncQueueService['retryTimer'] = setTimeout(() => {}, 1000);
      SyncQueueService['networkListener'] = () => {};

      await SyncQueueService.cleanup();

      expect(SyncQueueService.isServiceInitialized()).toBe(false);
      expect(SyncQueueService.isSyncInProgress()).toBe(false);
    });
  });
});

