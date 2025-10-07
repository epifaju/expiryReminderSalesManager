import DatabaseService from '../../src/services/database/DatabaseService';

/**
 * Tests unitaires pour le service de base de données SQLite
 */
describe('DatabaseService', () => {
  beforeEach(async () => {
    // Réinitialiser l'instance pour chaque test
    jest.clearAllMocks();
    
    // Nettoyer la base de données avant chaque test
    if (DatabaseService.isInitialized()) {
      await DatabaseService.clearAllTables();
      await DatabaseService.closeDatabase();
    }
  });

  afterEach(async () => {
    // Nettoyer après chaque test
    if (DatabaseService.isInitialized()) {
      await DatabaseService.clearAllTables();
      await DatabaseService.closeDatabase();
    }
  });

  describe('Initialisation', () => {
    test('doit initialiser la base de données avec succès', async () => {
      await DatabaseService.initDatabase();
      
      expect(DatabaseService.isInitialized()).toBe(true);
      expect(DatabaseService.getConnection()).toBeDefined();
    });

    test('doit créer toutes les tables requises', async () => {
      await DatabaseService.initDatabase();
      
      const info = await DatabaseService.getDatabaseInfo();
      
      expect(info.tables).toContain('products');
      expect(info.tables).toContain('sales');
      expect(info.tables).toContain('stock_movements');
      expect(info.tables).toContain('sync_queue');
      expect(info.tables).toContain('sync_metadata');
      expect(info.name).toBe('salesmanager.db');
      expect(info.version).toBe(1);
    });

    test('doit créer les index pour optimiser les performances', async () => {
      await DatabaseService.initDatabase();
      
      const db = DatabaseService.getConnection();
      
      // Vérifier que les index existent en exécutant une requête qui les utiliserait
      const result = await DatabaseService.executeSql(`
        SELECT name FROM sqlite_master 
        WHERE type='index' AND name LIKE 'idx_%'
      `);
      
      const indexes = [];
      for (let i = 0; i < result.rows.length; i++) {
        indexes.push(result.rows.item(i).name);
      }
      
      expect(indexes).toContain('idx_products_sync_status');
      expect(indexes).toContain('idx_products_user_id');
      expect(indexes).toContain('idx_sales_user_date');
      expect(indexes).toContain('idx_sync_queue_entity');
    });
  });

  describe('Opérations CRUD de base', () => {
    beforeEach(async () => {
      await DatabaseService.initDatabase();
    });

    test('doit insérer un produit avec succès', async () => {
      const now = new Date().toISOString();
      const productData = {
        id: 'test-product-1',
        name: 'Riz 25kg',
        price: 15000,
        stock_quantity: 50,
        expiration_date: '2025-12-31T00:00:00Z',
        created_at: now,
        updated_at: now,
        is_deleted: 0,
        sync_status: 'pending',
        user_id: 'user-123'
      };

      await DatabaseService.executeSql(`
        INSERT INTO products (
          id, name, price, stock_quantity, expiration_date,
          created_at, updated_at, is_deleted, sync_status, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        productData.id, productData.name, productData.price,
        productData.stock_quantity, productData.expiration_date,
        productData.created_at, productData.updated_at,
        productData.is_deleted, productData.sync_status, productData.user_id
      ]);

      const result = await DatabaseService.executeSql(
        'SELECT * FROM products WHERE id = ?',
        [productData.id]
      );

      expect(result.rows.length).toBe(1);
      const product = result.rows.item(0);
      expect(product.name).toBe('Riz 25kg');
      expect(product.price).toBe(15000);
      expect(product.sync_status).toBe('pending');
    });

    test('doit insérer une vente avec succès', async () => {
      const now = new Date().toISOString();
      const saleData = {
        id: 'test-sale-1',
        product_id: 'test-product-1',
        quantity: 2,
        unit_price: 15000,
        total_amount: 30000,
        sale_date: now,
        created_at: now,
        updated_at: now,
        is_deleted: 0,
        sync_status: 'pending',
        user_id: 'user-123'
      };

      await DatabaseService.executeSql(`
        INSERT INTO sales (
          id, product_id, quantity, unit_price, total_amount,
          sale_date, created_at, updated_at, is_deleted, sync_status, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        saleData.id, saleData.product_id, saleData.quantity,
        saleData.unit_price, saleData.total_amount, saleData.sale_date,
        saleData.created_at, saleData.updated_at, saleData.is_deleted,
        saleData.sync_status, saleData.user_id
      ]);

      const result = await DatabaseService.executeSql(
        'SELECT * FROM sales WHERE id = ?',
        [saleData.id]
      );

      expect(result.rows.length).toBe(1);
      const sale = result.rows.item(0);
      expect(sale.product_id).toBe('test-product-1');
      expect(sale.total_amount).toBe(30000);
      expect(sale.sync_status).toBe('pending');
    });

    test('doit insérer un mouvement de stock avec succès', async () => {
      const now = new Date().toISOString();
      const movementData = {
        id: 'test-movement-1',
        product_id: 'test-product-1',
        movement_type: 'in',
        quantity: 10,
        reason: 'Réception stock',
        movement_date: now,
        created_at: now,
        updated_at: now,
        is_deleted: 0,
        sync_status: 'pending',
        user_id: 'user-123'
      };

      await DatabaseService.executeSql(`
        INSERT INTO stock_movements (
          id, product_id, movement_type, quantity, reason,
          movement_date, created_at, updated_at, is_deleted, sync_status, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        movementData.id, movementData.product_id, movementData.movement_type,
        movementData.quantity, movementData.reason, movementData.movement_date,
        movementData.created_at, movementData.updated_at, movementData.is_deleted,
        movementData.sync_status, movementData.user_id
      ]);

      const result = await DatabaseService.executeSql(
        'SELECT * FROM stock_movements WHERE id = ?',
        [movementData.id]
      );

      expect(result.rows.length).toBe(1);
      const movement = result.rows.item(0);
      expect(movement.movement_type).toBe('in');
      expect(movement.quantity).toBe(10);
      expect(movement.sync_status).toBe('pending');
    });

    test('doit insérer un élément dans la queue de synchronisation', async () => {
      const now = new Date().toISOString();
      const queueData = {
        entity_type: 'product',
        entity_id: 'test-product-1',
        operation: 'create',
        payload: JSON.stringify({ name: 'Test Product' }),
        retry_count: 0,
        max_retries: 3,
        created_at: now
      };

      await DatabaseService.executeSql(`
        INSERT INTO sync_queue (
          entity_type, entity_id, operation, payload,
          retry_count, max_retries, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        queueData.entity_type, queueData.entity_id, queueData.operation,
        queueData.payload, queueData.retry_count, queueData.max_retries,
        queueData.created_at
      ]);

      const result = await DatabaseService.executeSql(
        'SELECT * FROM sync_queue WHERE entity_id = ?',
        [queueData.entity_id]
      );

      expect(result.rows.length).toBe(1);
      const queueItem = result.rows.item(0);
      expect(queueItem.entity_type).toBe('product');
      expect(queueItem.operation).toBe('create');
      expect(queueItem.retry_count).toBe(0);
    });
  });

  describe('Transactions', () => {
    beforeEach(async () => {
      await DatabaseService.initDatabase();
    });

    test('doit exécuter une transaction avec succès', async () => {
      const now = new Date().toISOString();
      
      const queries = [
        {
          query: `INSERT INTO products (id, name, price, stock_quantity, created_at, updated_at, is_deleted, sync_status, user_id) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: ['product-1', 'Test Product', 1000, 10, now, now, 0, 'pending', 'user-123']
        },
        {
          query: `INSERT INTO sales (id, product_id, quantity, unit_price, total_amount, sale_date, created_at, updated_at, is_deleted, sync_status, user_id) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: ['sale-1', 'product-1', 1, 1000, 1000, now, now, now, 0, 'pending', 'user-123']
        }
      ];

      await DatabaseService.executeTransaction(queries);

      // Vérifier que les deux insertions ont réussi
      const productResult = await DatabaseService.executeSql(
        'SELECT * FROM products WHERE id = ?',
        ['product-1']
      );
      const saleResult = await DatabaseService.executeSql(
        'SELECT * FROM sales WHERE id = ?',
        ['sale-1']
      );

      expect(productResult.rows.length).toBe(1);
      expect(saleResult.rows.length).toBe(1);
    });

    test('doit annuler une transaction en cas d\'erreur', async () => {
      const now = new Date().toISOString();
      
      const queries = [
        {
          query: `INSERT INTO products (id, name, price, stock_quantity, created_at, updated_at, is_deleted, sync_status, user_id) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: ['product-1', 'Test Product', 1000, 10, now, now, 0, 'pending', 'user-123']
        },
        {
          query: `INSERT INTO sales (id, product_id, quantity, unit_price, total_amount, sale_date, created_at, updated_at, is_deleted, sync_status, user_id) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: ['sale-1', 'product-invalid', 1, 1000, 1000, now, now, now, 0, 'pending', 'user-123'] // Référence invalide
        }
      ];

      // La transaction doit échouer à cause de la contrainte de clé étrangère
      await expect(DatabaseService.executeTransaction(queries)).rejects.toThrow();

      // Vérifier qu'aucune donnée n'a été insérée
      const productResult = await DatabaseService.executeSql(
        'SELECT * FROM products WHERE id = ?',
        ['product-1']
      );
      
      expect(productResult.rows.length).toBe(0);
    });
  });

  describe('Gestion des erreurs', () => {
    test('doit lever une erreur si la base n\'est pas initialisée', () => {
      expect(() => DatabaseService.getConnection()).toThrow('Base de données non initialisée');
      expect(() => DatabaseService.executeSql('SELECT 1')).rejects.toThrow();
    });

    test('doit gérer les erreurs de requête SQL', async () => {
      await DatabaseService.initDatabase();
      
      // Requête SQL invalide
      await expect(
        DatabaseService.executeSql('INVALID SQL QUERY')
      ).rejects.toThrow();
    });
  });

  describe('Nettoyage', () => {
    test('doit nettoyer toutes les tables', async () => {
      await DatabaseService.initDatabase();
      
      // Insérer des données de test
      await DatabaseService.executeSql(`
        INSERT INTO products (id, name, price, stock_quantity, created_at, updated_at, is_deleted, sync_status, user_id) 
        VALUES ('test', 'Test', 1000, 10, '2025-01-01', '2025-01-01', 0, 'pending', 'user')
      `);

      // Vérifier que les données existent
      const beforeResult = await DatabaseService.executeSql('SELECT COUNT(*) as count FROM products');
      expect(beforeResult.rows.item(0).count).toBe(1);

      // Nettoyer
      await DatabaseService.clearAllTables();

      // Vérifier que les tables sont vides
      const afterResult = await DatabaseService.executeSql('SELECT COUNT(*) as count FROM products');
      expect(afterResult.rows.item(0).count).toBe(0);
    });

    test('doit fermer la base de données correctement', async () => {
      await DatabaseService.initDatabase();
      expect(DatabaseService.isInitialized()).toBe(true);

      await DatabaseService.closeDatabase();
      expect(DatabaseService.isInitialized()).toBe(false);
    });
  });
});

