import SQLite from 'react-native-sqlite-storage';

/**
 * Service de gestion de la base de données SQLite locale
 * Implémente toutes les tables nécessaires pour le mode offline
 */
class DatabaseService {
  private static instance: DatabaseService;
  private database: SQLite.SQLiteDatabase | null = null;
  private readonly DB_NAME = 'salesmanager.db';
  private readonly DB_VERSION = 1;

  private constructor() {}

  /**
   * Singleton pattern pour garantir une seule instance
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initialise la base de données et crée toutes les tables
   */
  public async initDatabase(): Promise<void> {
    try {
      console.log('[DATABASE] Initialisation de la base de données...');
      
      // Configuration SQLite
      SQLite.DEBUG(true);
      SQLite.enablePromise(true);

      // Ouvrir ou créer la base de données
      this.database = await SQLite.openDatabase({
        name: this.DB_NAME,
        location: 'default',
        version: this.DB_VERSION
      });

      console.log('[DATABASE] Base de données ouverte avec succès');

      // Créer toutes les tables
      await this.createTables();
      
      // Créer les index pour optimiser les performances
      await this.createIndexes();

      console.log('[DATABASE] Initialisation terminée avec succès');

    } catch (error) {
      console.error('[DATABASE] Erreur lors de l\'initialisation:', error);
      throw new Error(`Échec de l'initialisation de la base de données: ${error}`);
    }
  }

  /**
   * Crée toutes les tables nécessaires pour le mode offline
   */
  private async createTables(): Promise<void> {
    if (!this.database) {
      throw new Error('Base de données non initialisée');
    }

    console.log('[DATABASE] Création des tables...');

    // Table Produits
    await this.database.executeSql(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        server_id INTEGER,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        stock_quantity INTEGER NOT NULL,
        expiration_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_deleted INTEGER DEFAULT 0,
        sync_status TEXT DEFAULT 'pending',
        user_id TEXT NOT NULL
      )
    `);

    // Table Ventes
    await this.database.executeSql(`
      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        server_id INTEGER,
        product_id TEXT NOT NULL,
        product_server_id INTEGER,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_amount REAL NOT NULL,
        sale_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_deleted INTEGER DEFAULT 0,
        sync_status TEXT DEFAULT 'pending',
        user_id TEXT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Table Mouvements Stock
    await this.database.executeSql(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id TEXT PRIMARY KEY,
        server_id INTEGER,
        product_id TEXT NOT NULL,
        movement_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        reason TEXT,
        movement_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_deleted INTEGER DEFAULT 0,
        sync_status TEXT DEFAULT 'pending',
        user_id TEXT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Table Queue de Synchronisation
    await this.database.executeSql(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        payload TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        created_at TEXT NOT NULL,
        last_attempt_at TEXT,
        error_message TEXT
      )
    `);

    // Table Métadonnées Sync
    await this.database.executeSql(`
      CREATE TABLE IF NOT EXISTS sync_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        last_sync_at TEXT,
        last_successful_sync_at TEXT,
        pending_operations_count INTEGER DEFAULT 0,
        user_id TEXT NOT NULL
      )
    `);

    console.log('[DATABASE] Tables créées avec succès');
  }

  /**
   * Crée les index pour optimiser les performances
   */
  private async createIndexes(): Promise<void> {
    if (!this.database) {
      throw new Error('Base de données non initialisée');
    }

    console.log('[DATABASE] Création des index...');

    // Index pour les produits
    await this.database.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_products_sync_status 
      ON products(sync_status, updated_at)
    `);
    
    await this.database.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_products_user_id 
      ON products(user_id, created_at)
    `);

    // Index pour les ventes
    await this.database.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_sales_user_date 
      ON sales(user_id, created_at)
    `);

    await this.database.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_sales_product_id 
      ON sales(product_id)
    `);

    // Index pour les mouvements de stock
    await this.database.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_stock_movements_product 
      ON stock_movements(product_id, movement_date)
    `);

    // Index pour la queue de synchronisation
    await this.database.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_sync_queue_entity 
      ON sync_queue(entity_type, created_at)
    `);

    await this.database.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_sync_queue_retry 
      ON sync_queue(retry_count, last_attempt_at)
    `);

    console.log('[DATABASE] Index créés avec succès');
  }

  /**
   * Retourne l'instance de la base de données
   */
  public getConnection(): SQLite.SQLiteDatabase {
    if (!this.database) {
      throw new Error('Base de données non initialisée. Appelez initDatabase() d\'abord.');
    }
    return this.database;
  }

  /**
   * Exécute une requête SQL avec paramètres
   */
  public async executeSql(
    query: string, 
    params: any[] = []
  ): Promise<SQLite.ResultSet> {
    if (!this.database) {
      throw new Error('Base de données non initialisée');
    }

    try {
      console.log('[DATABASE] Exécution requête:', query.substring(0, 100) + '...');
      const result = await this.database.executeSql(query, params);
      console.log('[DATABASE] Requête exécutée avec succès');
      return result[0];
    } catch (error) {
      console.error('[DATABASE] Erreur lors de l\'exécution de la requête:', error);
      console.error('[DATABASE] Query:', query);
      console.error('[DATABASE] Params:', params);
      throw error;
    }
  }

  /**
   * Exécute une transaction avec plusieurs requêtes
   */
  public async executeTransaction(queries: Array<{ query: string; params: any[] }>): Promise<void> {
    if (!this.database) {
      throw new Error('Base de données non initialisée');
    }

    console.log('[DATABASE] Début de transaction avec', queries.length, 'requêtes');
    
    await this.database.transaction(async (tx) => {
      for (const { query, params } of queries) {
        await tx.executeSql(query, params);
      }
    });

    console.log('[DATABASE] Transaction terminée avec succès');
  }

  /**
   * Vérifie si la base de données est initialisée
   */
  public isInitialized(): boolean {
    return this.database !== null;
  }

  /**
   * Ferme la base de données
   */
  public async closeDatabase(): Promise<void> {
    if (this.database) {
      console.log('[DATABASE] Fermeture de la base de données...');
      await this.database.close();
      this.database = null;
      console.log('[DATABASE] Base de données fermée');
    }
  }

  /**
   * Vide toutes les tables (pour les tests uniquement)
   */
  public async clearAllTables(): Promise<void> {
    if (!this.database) {
      throw new Error('Base de données non initialisée');
    }

    console.log('[DATABASE] Nettoyage de toutes les tables...');

    const tables = ['products', 'sales', 'stock_movements', 'sync_queue', 'sync_metadata'];
    
    for (const table of tables) {
      await this.database.executeSql(`DELETE FROM ${table}`);
    }

    console.log('[DATABASE] Tables vidées avec succès');
  }

  /**
   * Obtient les informations sur la base de données
   */
  public async getDatabaseInfo(): Promise<{
    name: string;
    version: number;
    isOpen: boolean;
    tables: string[];
  }> {
    if (!this.database) {
      throw new Error('Base de données non initialisée');
    }

    // Récupérer la liste des tables
    const result = await this.database.executeSql(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);

    const tables: string[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      tables.push(result.rows.item(i).name);
    }

    return {
      name: this.DB_NAME,
      version: this.DB_VERSION,
      isOpen: this.database !== null,
      tables
    };
  }
}

// Export de l'instance singleton
export default DatabaseService.getInstance();

