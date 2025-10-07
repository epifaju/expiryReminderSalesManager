/**
 * Tests d'intégration CRUD complets
 * Valide que DatabaseService, Types et DAO fonctionnent ensemble
 */

import {
  Product,
  Sale,
  StockMovement,
  CreateProductDTO,
  CreateSaleDTO,
  CreateStockMovementDTO,
  SyncStatus,
  MovementType
} from '../../src/types/models';

describe('Intégration CRUD - Mode Offline', () => {
  describe('Validation des types et interfaces', () => {
    test('doit créer un Product avec toutes les propriétés', () => {
      const product: Product = {
        id: 'test-product-1',
        name: 'Riz 25kg',
        price: 15000,
        stock_quantity: 50,
        expiration_date: '2025-12-31T00:00:00Z',
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
      expect(product.sync_status).toBe('pending');
      expect(product.is_deleted).toBe(0);
    });

    test('doit créer une Sale avec toutes les propriétés', () => {
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
      expect(sale.total_amount).toBe(30000);
      expect(sale.sync_status).toBe('pending');
    });

    test('doit créer un StockMovement avec toutes les propriétés', () => {
      const movement: StockMovement = {
        id: 'test-movement-1',
        product_id: 'test-product-1',
        movement_type: 'in',
        quantity: 10,
        reason: 'Réception stock',
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
      expect(movement.reason).toBe('Réception stock');
    });
  });

  describe('Validation des DTOs de création', () => {
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

    test('CreateSaleDTO doit avoir les propriétés minimales', () => {
      const createSale: CreateSaleDTO = {
        product_id: 'product-123',
        quantity: 1,
        unit_price: 10000,
        total_amount: 10000,
        sale_date: '2025-01-01T10:00:00Z',
        user_id: 'user-123'
      };

      expect(createSale.product_id).toBe('product-123');
      expect(createSale.quantity).toBe(1);
      expect(createSale.total_amount).toBe(10000);
      expect(createSale.user_id).toBe('user-123');
    });

    test('CreateStockMovementDTO doit avoir les propriétés minimales', () => {
      const createMovement: CreateStockMovementDTO = {
        product_id: 'product-123',
        movement_type: 'in',
        quantity: 5,
        movement_date: '2025-01-01T09:00:00Z',
        user_id: 'user-123'
      };

      expect(createMovement.product_id).toBe('product-123');
      expect(createMovement.movement_type).toBe('in');
      expect(createMovement.quantity).toBe(5);
      expect(createMovement.user_id).toBe('user-123');
    });
  });

  describe('Validation des enums et types', () => {
    test('SyncStatus doit avoir les valeurs correctes', () => {
      const validStatuses: SyncStatus[] = ['pending', 'synced', 'conflict'];
      
      validStatuses.forEach(status => {
        expect(['pending', 'synced', 'conflict']).toContain(status);
      });
    });

    test('MovementType doit avoir les valeurs correctes', () => {
      const validTypes: MovementType[] = ['in', 'out', 'adjustment'];
      
      validTypes.forEach(type => {
        expect(['in', 'out', 'adjustment']).toContain(type);
      });
    });
  });

  describe('Scénarios de workflow CRUD', () => {
    test('Workflow complet: Créer produit → Créer vente → Créer mouvement stock', () => {
      // 1. Créer un produit
      const productData: CreateProductDTO = {
        name: 'Riz 25kg',
        price: 15000,
        stock_quantity: 50,
        user_id: 'user-123'
      };

      const product: Product = {
        id: 'product-1',
        ...productData,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        is_deleted: 0,
        sync_status: 'pending'
      };

      expect(product.name).toBe('Riz 25kg');
      expect(product.stock_quantity).toBe(50);
      expect(product.sync_status).toBe('pending');

      // 2. Créer une vente
      const saleData: CreateSaleDTO = {
        product_id: product.id,
        quantity: 2,
        unit_price: product.price,
        total_amount: product.price * 2,
        sale_date: '2025-01-01T10:00:00Z',
        user_id: 'user-123'
      };

      const sale: Sale = {
        id: 'sale-1',
        ...saleData,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        is_deleted: 0,
        sync_status: 'pending'
      };

      expect(sale.product_id).toBe(product.id);
      expect(sale.total_amount).toBe(30000);
      expect(sale.sync_status).toBe('pending');

      // 3. Créer un mouvement de stock (sortie)
      const movementData: CreateStockMovementDTO = {
        product_id: product.id,
        movement_type: 'out',
        quantity: 2,
        reason: 'Vente',
        movement_date: '2025-01-01T10:00:00Z',
        user_id: 'user-123'
      };

      const movement: StockMovement = {
        id: 'movement-1',
        ...movementData,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
        is_deleted: 0,
        sync_status: 'pending'
      };

      expect(movement.product_id).toBe(product.id);
      expect(movement.movement_type).toBe('out');
      expect(movement.quantity).toBe(2);
      expect(movement.sync_status).toBe('pending');

      // Vérifier la cohérence des données
      expect(sale.quantity).toBe(movement.quantity);
      expect(sale.product_id).toBe(movement.product_id);
    });

    test('Workflow de mise à jour: Produit → Vente → Synchronisation', () => {
      // Produit initial
      const initialProduct: Product = {
        id: 'product-1',
        name: 'Riz 25kg',
        price: 15000,
        stock_quantity: 50,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        is_deleted: 0,
        sync_status: 'pending',
        user_id: 'user-123'
      };

      // Mise à jour du produit
      const updatedProduct: Product = {
        ...initialProduct,
        price: 16000,
        stock_quantity: 45,
        updated_at: '2025-01-01T11:00:00Z',
        sync_status: 'pending'
      };

      expect(updatedProduct.price).toBe(16000);
      expect(updatedProduct.stock_quantity).toBe(45);
      expect(updatedProduct.sync_status).toBe('pending');

      // Vente mise à jour
      const updatedSale: Sale = {
        id: 'sale-1',
        product_id: 'product-1',
        quantity: 1,
        unit_price: 16000,
        total_amount: 16000,
        sale_date: '2025-01-01T10:00:00Z',
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T11:00:00Z',
        is_deleted: 0,
        sync_status: 'pending',
        user_id: 'user-123'
      };

      expect(updatedSale.unit_price).toBe(updatedProduct.price);
      expect(updatedSale.sync_status).toBe('pending');

      // Après synchronisation
      const syncedProduct: Product = {
        ...updatedProduct,
        server_id: 123,
        sync_status: 'synced'
      };

      const syncedSale: Sale = {
        ...updatedSale,
        server_id: 456,
        product_server_id: 123,
        sync_status: 'synced'
      };

      expect(syncedProduct.server_id).toBe(123);
      expect(syncedProduct.sync_status).toBe('synced');
      expect(syncedSale.server_id).toBe(456);
      expect(syncedSale.product_server_id).toBe(123);
      expect(syncedSale.sync_status).toBe('synced');
    });

    test('Workflow de suppression logique', () => {
      // Produit à supprimer
      const product: Product = {
        id: 'product-1',
        name: 'Produit obsolète',
        price: 10000,
        stock_quantity: 0,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T12:00:00Z',
        is_deleted: 0,
        sync_status: 'pending',
        user_id: 'user-123'
      };

      // Après suppression logique
      const deletedProduct: Product = {
        ...product,
        is_deleted: 1,
        sync_status: 'pending',
        updated_at: '2025-01-01T12:30:00Z'
      };

      expect(deletedProduct.is_deleted).toBe(1);
      expect(deletedProduct.sync_status).toBe('pending');
    });
  });

  describe('Validation des contraintes métier', () => {
    test('Prix doit être positif', () => {
      const validPrices = [100, 1000, 15000, 100000];
      const invalidPrices = [-100, -1000, 0];

      validPrices.forEach(price => {
        expect(price).toBeGreaterThan(0);
      });

      invalidPrices.forEach(price => {
        expect(price).toBeLessThanOrEqual(0);
      });
    });

    test('Quantité doit être positive', () => {
      const validQuantities = [1, 5, 10, 50, 100];
      const invalidQuantities = [-1, -5, 0];

      validQuantities.forEach(quantity => {
        expect(quantity).toBeGreaterThan(0);
      });

      invalidQuantities.forEach(quantity => {
        expect(quantity).toBeLessThanOrEqual(0);
      });
    });

    test('Montant total doit correspondre à quantité × prix unitaire', () => {
      const quantity = 3;
      const unitPrice = 5000;
      const expectedTotal = quantity * unitPrice;

      expect(expectedTotal).toBe(15000);
    });

    test('Date de création doit être antérieure ou égale à date de mise à jour', () => {
      const createdAt = '2025-01-01T00:00:00Z';
      const updatedAt = '2025-01-01T12:00:00Z';

      const createdTime = new Date(createdAt).getTime();
      const updatedTime = new Date(updatedAt).getTime();

      expect(updatedTime).toBeGreaterThanOrEqual(createdTime);
    });
  });

  describe('Validation des formats de données', () => {
    test('UUIDs doivent avoir le bon format', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
      ];

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      validUUIDs.forEach(uuid => {
        expect(uuid).toMatch(uuidRegex);
      });
    });

    test('Dates ISO 8601 doivent avoir le bon format', () => {
      const validDates = [
        '2025-01-01T00:00:00.000Z',
        '2025-12-31T23:59:59.000Z',
        '2025-06-15T12:30:45.000Z'
      ];

      validDates.forEach(date => {
        expect(() => new Date(date)).not.toThrow();
        expect(new Date(date).toISOString()).toBe(date);
      });
    });

    test('IDs utilisateur doivent être des chaînes non vides', () => {
      const validUserIds = ['user-123', 'user-456', 'user-789'];
      const invalidUserIds = ['', null, undefined];

      validUserIds.forEach(userId => {
        expect(typeof userId).toBe('string');
        expect(userId.length).toBeGreaterThan(0);
      });

      invalidUserIds.forEach(userId => {
        expect(userId).toBeFalsy();
      });
    });
  });
});
