/**
 * Tests unitaires pour les modèles de données TypeScript
 * Vérification de la cohérence des types et interfaces
 */

import {
  Product,
  Sale,
  StockMovement,
  SyncQueueItem,
  SyncMetadata,
  CreateProductDTO,
  CreateSaleDTO,
  CreateStockMovementDTO,
  SyncStatus,
  SyncOperation,
  EntityType,
  MovementType,
  SyncResult,
  IdMapping,
  SyncResponse,
  ConflictInfo,
  ServerUpdate,
  DeltaSyncResponse,
  ProductSearchCriteria,
  SaleSearchCriteria,
  StockMovementSearchCriteria,
  SalesSummary,
  TopProduct,
  StockMovementSummary,
  DatabaseError,
  SyncError,
} from '../../src/types/models';

describe('Types et Interfaces - Modèles de données', () => {
  describe('Types de base', () => {
    test('SyncStatus doit avoir les valeurs correctes', () => {
      const validStatuses: SyncStatus[] = ['pending', 'synced', 'conflict'];
      validStatuses.forEach(status => {
        expect(['pending', 'synced', 'conflict']).toContain(status);
      });
    });

    test('SyncOperation doit avoir les valeurs correctes', () => {
      const validOperations: SyncOperation[] = ['create', 'update', 'delete'];
      validOperations.forEach(operation => {
        expect(['create', 'update', 'delete']).toContain(operation);
      });
    });

    test('EntityType doit avoir les valeurs correctes', () => {
      const validEntityTypes: EntityType[] = ['product', 'sale', 'stock_movement'];
      validEntityTypes.forEach(entityType => {
        expect(['product', 'sale', 'stock_movement']).toContain(entityType);
      });
    });

    test('MovementType doit avoir les valeurs correctes', () => {
      const validMovementTypes: MovementType[] = ['in', 'out', 'adjustment'];
      validMovementTypes.forEach(movementType => {
        expect(['in', 'out', 'adjustment']).toContain(movementType);
      });
    });
  });

  describe('Interface Product', () => {
    test('doit avoir toutes les propriétés requises', () => {
      const product: Product = {
        id: 'test-product-1',
        name: 'Riz 25kg',
        price: 15000,
        stock_quantity: 50,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        is_deleted: 0,
        sync_status: 'pending',
        user_id: 'user-123'
      };

      expect(product.id).toBe('test-product-1');
      expect(product.name).toBe('Riz 25kg');
      expect(product.price).toBe(15000);
      expect(product.stock_quantity).toBe(50);
      expect(product.is_deleted).toBe(0);
      expect(product.sync_status).toBe('pending');
      expect(product.user_id).toBe('user-123');
    });

    test('doit permettre les propriétés optionnelles', () => {
      const product: Product = {
        id: 'test-product-2',
        server_id: 123,
        name: 'Huile 5L',
        price: 8500,
        stock_quantity: 25,
        expiration_date: '2025-12-31T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        is_deleted: 0,
        sync_status: 'synced',
        user_id: 'user-123'
      };

      expect(product.server_id).toBe(123);
      expect(product.expiration_date).toBe('2025-12-31T00:00:00Z');
      expect(product.sync_status).toBe('synced');
    });

    test('CreateProductDTO doit avoir les propriétés minimales', () => {
      const createProduct: CreateProductDTO = {
        name: 'Nouveau Produit',
        price: 10000,
        stock_quantity: 10,
        user_id: 'user-123'
      };

      expect(createProduct.name).toBe('Nouveau Produit');
      expect(createProduct.price).toBe(10000);
      expect(createProduct.stock_quantity).toBe(10);
      expect(createProduct.user_id).toBe('user-123');
    });
  });

  describe('Interface Sale', () => {
    test('doit avoir toutes les propriétés requises', () => {
      const sale: Sale = {
        id: 'test-sale-1',
        product_id: 'test-product-1',
        quantity: 2,
        unit_price: 15000,
        total_amount: 30000,
        sale_date: '2025-01-01T10:00:00Z',
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        is_deleted: 0,
        sync_status: 'pending',
        user_id: 'user-123'
      };

      expect(sale.id).toBe('test-sale-1');
      expect(sale.product_id).toBe('test-product-1');
      expect(sale.quantity).toBe(2);
      expect(sale.unit_price).toBe(15000);
      expect(sale.total_amount).toBe(30000);
      expect(sale.sync_status).toBe('pending');
    });

    test('doit permettre les propriétés optionnelles', () => {
      const sale: Sale = {
        id: 'test-sale-2',
        server_id: 456,
        product_id: 'test-product-2',
        product_server_id: 789,
        quantity: 1,
        unit_price: 8500,
        total_amount: 8500,
        sale_date: '2025-01-01T11:00:00Z',
        created_at: '2025-01-01T11:00:00Z',
        updated_at: '2025-01-01T11:00:00Z',
        is_deleted: 0,
        sync_status: 'synced',
        user_id: 'user-123'
      };

      expect(sale.server_id).toBe(456);
      expect(sale.product_server_id).toBe(789);
      expect(sale.sync_status).toBe('synced');
    });
  });

  describe('Interface StockMovement', () => {
    test('doit avoir toutes les propriétés requises', () => {
      const movement: StockMovement = {
        id: 'test-movement-1',
        product_id: 'test-product-1',
        movement_type: 'in',
        quantity: 10,
        movement_date: '2025-01-01T09:00:00Z',
        created_at: '2025-01-01T09:00:00Z',
        updated_at: '2025-01-01T09:00:00Z',
        is_deleted: 0,
        sync_status: 'pending',
        user_id: 'user-123'
      };

      expect(movement.id).toBe('test-movement-1');
      expect(movement.product_id).toBe('test-product-1');
      expect(movement.movement_type).toBe('in');
      expect(movement.quantity).toBe(10);
      expect(movement.sync_status).toBe('pending');
    });

    test('doit permettre les propriétés optionnelles', () => {
      const movement: StockMovement = {
        id: 'test-movement-2',
        server_id: 789,
        product_id: 'test-product-2',
        movement_type: 'out',
        quantity: -5,
        reason: 'Vente',
        movement_date: '2025-01-01T10:00:00Z',
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        is_deleted: 0,
        sync_status: 'synced',
        user_id: 'user-123'
      };

      expect(movement.server_id).toBe(789);
      expect(movement.reason).toBe('Vente');
      expect(movement.sync_status).toBe('synced');
    });
  });

  describe('Interface SyncQueueItem', () => {
    test('doit avoir toutes les propriétés requises', () => {
      const queueItem: SyncQueueItem = {
        id: 1,
        entity_type: 'product',
        entity_id: 'test-product-1',
        operation: 'create',
        payload: '{"name":"Test Product"}',
        retry_count: 0,
        max_retries: 3,
        created_at: '2025-01-01T00:00:00Z'
      };

      expect(queueItem.id).toBe(1);
      expect(queueItem.entity_type).toBe('product');
      expect(queueItem.entity_id).toBe('test-product-1');
      expect(queueItem.operation).toBe('create');
      expect(queueItem.payload).toBe('{"name":"Test Product"}');
      expect(queueItem.retry_count).toBe(0);
      expect(queueItem.max_retries).toBe(3);
    });

    test('doit permettre les propriétés optionnelles', () => {
      const queueItem: SyncQueueItem = {
        id: 2,
        entity_type: 'sale',
        entity_id: 'test-sale-1',
        operation: 'update',
        payload: '{"quantity":5}',
        retry_count: 1,
        max_retries: 3,
        created_at: '2025-01-01T00:00:00Z',
        last_attempt_at: '2025-01-01T01:00:00Z',
        error_message: 'Network timeout'
      };

      expect(queueItem.last_attempt_at).toBe('2025-01-01T01:00:00Z');
      expect(queueItem.error_message).toBe('Network timeout');
    });
  });

  describe('Interface SyncMetadata', () => {
    test('doit avoir toutes les propriétés requises', () => {
      const metadata: SyncMetadata = {
        id: 1,
        pending_operations_count: 5,
        user_id: 'user-123'
      };

      expect(metadata.id).toBe(1);
      expect(metadata.pending_operations_count).toBe(5);
      expect(metadata.user_id).toBe('user-123');
    });

    test('doit permettre les propriétés optionnelles', () => {
      const metadata: SyncMetadata = {
        id: 2,
        last_sync_at: '2025-01-01T00:00:00Z',
        last_successful_sync_at: '2025-01-01T00:00:00Z',
        pending_operations_count: 0,
        user_id: 'user-123'
      };

      expect(metadata.last_sync_at).toBe('2025-01-01T00:00:00Z');
      expect(metadata.last_successful_sync_at).toBe('2025-01-01T00:00:00Z');
      expect(metadata.pending_operations_count).toBe(0);
    });
  });

  describe('Types de synchronisation', () => {
    test('SyncResult doit avoir la structure correcte', () => {
      const result: SyncResult = {
        status: 'success',
        synced: 10,
        failed: 0,
        conflicts: 0
      };

      expect(result.status).toBe('success');
      expect(result.synced).toBe(10);
      expect(result.failed).toBe(0);
      expect(result.conflicts).toBe(0);
    });

    test('IdMapping doit avoir la structure correcte', () => {
      const mapping: IdMapping = {
        localId: 'local-uuid-123',
        serverId: 456
      };

      expect(mapping.localId).toBe('local-uuid-123');
      expect(mapping.serverId).toBe(456);
    });

    test('SyncResponse doit avoir la structure correcte', () => {
      const response: SyncResponse = {
        syncStatus: 'success',
        timestamp: '2025-01-01T00:00:00Z',
        processedOperations: 5,
        conflicts: [],
        mappings: [],
        serverUpdates: []
      };

      expect(response.syncStatus).toBe('success');
      expect(response.processedOperations).toBe(5);
      expect(Array.isArray(response.conflicts)).toBe(true);
      expect(Array.isArray(response.mappings)).toBe(true);
      expect(Array.isArray(response.serverUpdates)).toBe(true);
    });
  });

  describe('Types de recherche', () => {
    test('ProductSearchCriteria doit avoir la structure correcte', () => {
      const criteria: ProductSearchCriteria = {
        name: 'Riz',
        minPrice: 1000,
        maxPrice: 20000,
        userId: 'user-123',
        limit: 10,
        offset: 0
      };

      expect(criteria.name).toBe('Riz');
      expect(criteria.minPrice).toBe(1000);
      expect(criteria.maxPrice).toBe(20000);
      expect(criteria.userId).toBe('user-123');
      expect(criteria.limit).toBe(10);
      expect(criteria.offset).toBe(0);
    });

    test('SaleSearchCriteria doit avoir la structure correcte', () => {
      const criteria: SaleSearchCriteria = {
        productId: 'product-123',
        dateFrom: '2025-01-01T00:00:00Z',
        dateTo: '2025-01-31T23:59:59Z',
        userId: 'user-123',
        limit: 20
      };

      expect(criteria.productId).toBe('product-123');
      expect(criteria.dateFrom).toBe('2025-01-01T00:00:00Z');
      expect(criteria.dateTo).toBe('2025-01-31T23:59:59Z');
      expect(criteria.userId).toBe('user-123');
    });
  });

  describe('Types de rapports', () => {
    test('SalesSummary doit avoir la structure correcte', () => {
      const summary: SalesSummary = {
        totalSales: 50,
        totalAmount: 750000,
        averageAmount: 15000,
        productCount: 10,
        dateFrom: '2025-01-01T00:00:00Z',
        dateTo: '2025-01-31T23:59:59Z'
      };

      expect(summary.totalSales).toBe(50);
      expect(summary.totalAmount).toBe(750000);
      expect(summary.averageAmount).toBe(15000);
      expect(summary.productCount).toBe(10);
    });

    test('TopProduct doit avoir la structure correcte', () => {
      const topProduct: TopProduct = {
        product_id: 'product-123',
        product_name: 'Riz 25kg',
        totalQuantity: 100,
        totalAmount: 1500000,
        salesCount: 50
      };

      expect(topProduct.product_id).toBe('product-123');
      expect(topProduct.product_name).toBe('Riz 25kg');
      expect(topProduct.totalQuantity).toBe(100);
      expect(topProduct.totalAmount).toBe(1500000);
      expect(topProduct.salesCount).toBe(50);
    });
  });

  describe('Types d\'erreurs', () => {
    test('DatabaseError doit avoir la structure correcte', () => {
      const error: DatabaseError = {
        code: 'SQLITE_CONSTRAINT',
        message: 'Foreign key constraint failed',
        query: 'INSERT INTO sales ...',
        params: ['product-123', 5, 1000]
      };

      expect(error.code).toBe('SQLITE_CONSTRAINT');
      expect(error.message).toBe('Foreign key constraint failed');
      expect(error.query).toBe('INSERT INTO sales ...');
      expect(Array.isArray(error.params)).toBe(true);
    });

    test('SyncError doit avoir la structure correcte', () => {
      const error: SyncError = {
        type: 'network',
        message: 'Connection timeout',
        entityType: 'product',
        entityId: 'product-123',
        retryable: true
      };

      expect(error.type).toBe('network');
      expect(error.message).toBe('Connection timeout');
      expect(error.entityType).toBe('product');
      expect(error.entityId).toBe('product-123');
      expect(error.retryable).toBe(true);
    });
  });
});

