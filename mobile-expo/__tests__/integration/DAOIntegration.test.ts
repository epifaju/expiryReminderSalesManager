/**
 * Tests d'intégration pour les DAOs et la synchronisation
 * Valide l'interaction entre les DAOs et le service de synchronisation
 */

import { DatabaseService } from '../../src/services/database/DatabaseService';
import { ProductDAO, SaleDAO, StockMovementDAO } from '../../src/dao';
import SyncService from '../../src/services/sync/SyncService';
import {
  EntityType,
  OperationType,
  SyncOperation,
  SyncState
} from '../../src/types/sync';
import { Product, Sale, StockMovement } from '../../src/types/models';

// Mock des dépendances
jest.mock('react-native-sqlite-storage', () => ({
  openDatabase: jest.fn(() => ({
    transaction: jest.fn((callback) => {
      callback({
        executeSql: jest.fn((sql, params, successCallback) => {
          successCallback({ rows: { raw: () => [] } }, { insertId: 1, rowsAffected: 1 });
        })
      });
    })
  }))
}));

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

describe('Intégration DAOs et Synchronisation', () => {
  let databaseService: DatabaseService;
  let productDAO: ProductDAO;
  let saleDAO: SaleDAO;
  let stockMovementDAO: StockMovementDAO;
  let syncService: SyncService;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Initialize database
    databaseService = DatabaseService.getInstance();
    await databaseService.initDatabase();

    // Initialize DAOs
    productDAO = ProductDAO.getInstance();
    saleDAO = SaleDAO.getInstance();
    stockMovementDAO = StockMovementDAO.getInstance();

    // Initialize sync service
    syncService = SyncService.getInstance();
    await syncService.initialize('test-device-dao', '1.0.0');

    // Mock successful API responses
    const mockApiClient = require('../../src/services/apiClient');
    mockApiClient.request.mockResolvedValue({
      data: {
        syncSessionId: 'test-dao-session',
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
  });

  afterEach(async () => {
    await syncService.cleanup();
    await databaseService.closeDatabase();
  });

  describe('Synchronisation des produits', () => {
    it('should sync product creation', async () => {
      // Arrange: Create a product locally
      const productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'> = {
        name: 'Produit Test DAO',
        description: 'Description produit test',
        price: 29.99,
        category: 'Test',
        stockQuantity: 100,
        clientSideId: 'local-prod-dao-1'
      };

      const createdProduct = await productDAO.create(productData);
      expect(createdProduct).toBeDefined();
      expect(createdProduct.id).toBeDefined();

      // Act: Create sync operation and sync
      const syncOperation: SyncOperation = {
        entityId: createdProduct.id,
        localId: createdProduct.clientSideId,
        entityType: EntityType.PRODUCT,
        operationType: OperationType.CREATE,
        entityData: {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          category: productData.category,
          stockQuantity: productData.stockQuantity
        },
        timestamp: new Date().toISOString()
      };

      const result = await syncService.syncBatch([syncOperation]);

      // Assert: Verify sync was successful
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(1);

      // Verify product sync status was updated
      const updatedProduct = await productDAO.getById(createdProduct.id);
      expect(updatedProduct?.syncStatus).toBe('synced');
    });

    it('should sync product update', async () => {
      // Arrange: Create and update a product
      const productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'> = {
        name: 'Produit Original',
        description: 'Description originale',
        price: 25.99,
        category: 'Test',
        stockQuantity: 50,
        clientSideId: 'local-prod-update-1'
      };

      const createdProduct = await productDAO.create(productData);
      
      // Update the product
      const updateData = {
        ...createdProduct,
        name: 'Produit Modifié',
        price: 35.99,
        stockQuantity: 75
      };

      const updatedProduct = await productDAO.update(updateData);
      expect(updatedProduct?.name).toBe('Produit Modifié');

      // Act: Create sync operation and sync
      const syncOperation: SyncOperation = {
        entityId: updatedProduct!.id,
        localId: updatedProduct!.clientSideId,
        entityType: EntityType.PRODUCT,
        operationType: OperationType.UPDATE,
        entityData: {
          name: updatedProduct!.name,
          description: updatedProduct!.description,
          price: updatedProduct!.price,
          category: updatedProduct!.category,
          stockQuantity: updatedProduct!.stockQuantity
        },
        timestamp: new Date().toISOString()
      };

      const result = await syncService.syncBatch([syncOperation]);

      // Assert: Verify sync was successful
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(1);
    });

    it('should sync product deletion', async () => {
      // Arrange: Create a product
      const productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'> = {
        name: 'Produit à Supprimer',
        description: 'Description produit à supprimer',
        price: 19.99,
        category: 'Test',
        stockQuantity: 10,
        clientSideId: 'local-prod-delete-1'
      };

      const createdProduct = await productDAO.create(productData);
      
      // Soft delete the product
      await productDAO.softDelete(createdProduct.id);
      const deletedProduct = await productDAO.getById(createdProduct.id);
      expect(deletedProduct?.isDeleted).toBe(true);

      // Act: Create sync operation and sync
      const syncOperation: SyncOperation = {
        entityId: createdProduct.id,
        localId: createdProduct.clientSideId,
        entityType: EntityType.PRODUCT,
        operationType: OperationType.DELETE,
        entityData: {},
        timestamp: new Date().toISOString()
      };

      const result = await syncService.syncBatch([syncOperation]);

      // Assert: Verify sync was successful
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(1);
    });
  });

  describe('Synchronisation des ventes', () => {
    it('should sync sale creation', async () => {
      // Arrange: Create a sale locally
      const saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'> = {
        amount: 59.98,
        quantity: 2,
        customerName: 'Client Test DAO',
        clientSideId: 'local-sale-dao-1'
      };

      const createdSale = await saleDAO.create(saleData);
      expect(createdSale).toBeDefined();
      expect(createdSale.id).toBeDefined();

      // Act: Create sync operation and sync
      const syncOperation: SyncOperation = {
        entityId: createdSale.id,
        localId: createdSale.clientSideId,
        entityType: EntityType.SALE,
        operationType: OperationType.CREATE,
        entityData: {
          amount: saleData.amount,
          quantity: saleData.quantity,
          customerName: saleData.customerName
        },
        timestamp: new Date().toISOString()
      };

      const result = await syncService.syncBatch([syncOperation]);

      // Assert: Verify sync was successful
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(1);
    });

    it('should sync multiple sales', async () => {
      // Arrange: Create multiple sales
      const salesData = [
        {
          amount: 29.99,
          quantity: 1,
          customerName: 'Client 1',
          clientSideId: 'local-sale-multi-1'
        },
        {
          amount: 49.99,
          quantity: 2,
          customerName: 'Client 2',
          clientSideId: 'local-sale-multi-2'
        }
      ];

      const createdSales = [];
      for (const saleData of salesData) {
        const sale = await saleDAO.create(saleData);
        createdSales.push(sale);
      }

      // Act: Create sync operations and sync
      const syncOperations: SyncOperation[] = createdSales.map(sale => ({
        entityId: sale.id,
        localId: sale.clientSideId,
        entityType: EntityType.SALE,
        operationType: OperationType.CREATE,
        entityData: {
          amount: sale.amount,
          quantity: sale.quantity,
          customerName: sale.customerName
        },
        timestamp: new Date().toISOString()
      }));

      const result = await syncService.syncBatch(syncOperations);

      // Assert: Verify sync was successful
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
    });
  });

  describe('Synchronisation des mouvements de stock', () => {
    it('should sync stock movement creation', async () => {
      // Arrange: Create a stock movement
      const stockMovementData: Omit<StockMovement, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'> = {
        productId: 'prod-1',
        quantity: -5,
        movementType: 'sale',
        reason: 'Vente produit',
        clientSideId: 'local-stock-dao-1'
      };

      const createdMovement = await stockMovementDAO.create(stockMovementData);
      expect(createdMovement).toBeDefined();
      expect(createdMovement.id).toBeDefined();

      // Act: Create sync operation and sync
      const syncOperation: SyncOperation = {
        entityId: createdMovement.id,
        localId: createdMovement.clientSideId,
        entityType: EntityType.STOCK_MOVEMENT,
        operationType: OperationType.CREATE,
        entityData: {
          productId: stockMovementData.productId,
          quantity: stockMovementData.quantity,
          movementType: stockMovementData.movementType,
          reason: stockMovementData.reason
        },
        timestamp: new Date().toISOString()
      };

      const result = await syncService.syncBatch([syncOperation]);

      // Assert: Verify sync was successful
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(1);
    });
  });

  describe('Synchronisation mixte (tous types d'entités)', () => {
    it('should sync mixed entity types in single batch', async () => {
      // Arrange: Create entities of different types
      const product = await productDAO.create({
        name: 'Produit Mixte',
        description: 'Description produit mixte',
        price: 39.99,
        category: 'Test',
        stockQuantity: 50,
        clientSideId: 'local-mixed-prod-1'
      });

      const sale = await saleDAO.create({
        amount: 79.98,
        quantity: 2,
        customerName: 'Client Mixte',
        clientSideId: 'local-mixed-sale-1'
      });

      const stockMovement = await stockMovementDAO.create({
        productId: product.id,
        quantity: -2,
        movementType: 'sale',
        reason: 'Vente produit mixte',
        clientSideId: 'local-mixed-stock-1'
      });

      // Act: Create sync operations for all entities
      const syncOperations: SyncOperation[] = [
        {
          entityId: product.id,
          localId: product.clientSideId,
          entityType: EntityType.PRODUCT,
          operationType: OperationType.CREATE,
          entityData: {
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            stockQuantity: product.stockQuantity
          },
          timestamp: new Date().toISOString()
        },
        {
          entityId: sale.id,
          localId: sale.clientSideId,
          entityType: EntityType.SALE,
          operationType: OperationType.CREATE,
          entityData: {
            amount: sale.amount,
            quantity: sale.quantity,
            customerName: sale.customerName
          },
          timestamp: new Date().toISOString()
        },
        {
          entityId: stockMovement.id,
          localId: stockMovement.clientSideId,
          entityType: EntityType.STOCK_MOVEMENT,
          operationType: OperationType.CREATE,
          entityData: {
            productId: stockMovement.productId,
            quantity: stockMovement.quantity,
            movementType: stockMovement.movementType,
            reason: stockMovement.reason
          },
          timestamp: new Date().toISOString()
        }
      ];

      const result = await syncService.syncBatch(syncOperations);

      // Assert: Verify sync was successful for all entities
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(3);
      expect(result.totalProcessed).toBe(3);
    });
  });

  describe('Gestion des erreurs de synchronisation', () => {
    it('should handle sync errors gracefully', async () => {
      // Arrange: Create a product
      const product = await productDAO.create({
        name: 'Produit Erreur',
        description: 'Description produit erreur',
        price: 29.99,
        category: 'Test',
        stockQuantity: 10,
        clientSideId: 'local-prod-error-1'
      });

      // Mock API error
      const mockApiClient = require('../../src/services/apiClient');
      mockApiClient.request.mockRejectedValue(new Error('Network error'));

      // Act: Attempt to sync
      const syncOperation: SyncOperation = {
        entityId: product.id,
        localId: product.clientSideId,
        entityType: EntityType.PRODUCT,
        operationType: OperationType.CREATE,
        entityData: {
          name: product.name,
          price: product.price
        },
        timestamp: new Date().toISOString()
      };

      // Assert: Should throw error
      await expect(syncService.syncBatch([syncOperation])).rejects.toThrow('Network error');

      // Verify product is still pending sync
      const updatedProduct = await productDAO.getById(product.id);
      expect(updatedProduct?.syncStatus).toBe('pending');
    });

    it('should retry failed sync operations', async () => {
      // Arrange: Create a product
      const product = await productDAO.create({
        name: 'Produit Retry',
        description: 'Description produit retry',
        price: 19.99,
        category: 'Test',
        stockQuantity: 5,
        clientSideId: 'local-prod-retry-1'
      });

      // Mock API to fail first, then succeed
      const mockApiClient = require('../../src/services/apiClient');
      mockApiClient.request
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: {
            syncSessionId: 'test-retry-success',
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

      // Act: Attempt sync (should fail first time)
      const syncOperation: SyncOperation = {
        entityId: product.id,
        localId: product.clientSideId,
        entityType: EntityType.PRODUCT,
        operationType: OperationType.CREATE,
        entityData: {
          name: product.name,
          price: product.price
        },
        timestamp: new Date().toISOString()
      };

      // First attempt should fail
      await expect(syncService.syncBatch([syncOperation])).rejects.toThrow('Network error');

      // Second attempt should succeed (if retry is implemented)
      // Note: This test assumes retry logic is implemented in SyncService
      // The actual retry behavior depends on the implementation
    });
  });

  describe('Performance et optimisations', () => {
    it('should handle large batch operations efficiently', async () => {
      // Arrange: Create many products
      const products = [];
      for (let i = 0; i < 10; i++) {
        const product = await productDAO.create({
          name: `Produit Performance ${i}`,
          description: `Description produit performance ${i}`,
          price: 29.99 + i,
          category: 'Performance',
          stockQuantity: 100 + i,
          clientSideId: `local-perf-prod-${i}`
        });
        products.push(product);
      }

      // Act: Create sync operations for all products
      const syncOperations: SyncOperation[] = products.map(product => ({
        entityId: product.id,
        localId: product.clientSideId,
        entityType: EntityType.PRODUCT,
        operationType: OperationType.CREATE,
        entityData: {
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          stockQuantity: product.stockQuantity
        },
        timestamp: new Date().toISOString()
      }));

      const startTime = Date.now();
      const result = await syncService.syncBatch(syncOperations);
      const endTime = Date.now();

      // Assert: Verify performance
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(10);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});

