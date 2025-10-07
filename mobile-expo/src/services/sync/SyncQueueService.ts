/**
 * Service de gestion de la queue de synchronisation
 * Gère les opérations en attente de synchronisation avec le serveur
 * Intégration avec NetworkService pour le déclenchement automatique
 */

import DatabaseService from '../database/DatabaseService';
import NetworkService from '../network/NetworkService';
import { 
  SyncQueueItem, 
  SyncOperation, 
  EntityType, 
  SyncStatus,
  CreateSyncQueueItemDTO 
} from '../../types/models';

/**
 * Interface pour les options de synchronisation
 */
export interface SyncOptions {
  /** Force la synchronisation même si hors ligne */
  forceSync?: boolean;
  /** Priorité de l'opération (1 = haute, 5 = basse) */
  priority?: number;
  /** Délai d'attente avant retry en millisecondes */
  retryDelay?: number;
  /** Nombre maximum de tentatives */
  maxRetries?: number;
}

/**
 * Interface pour les résultats de synchronisation
 */
export interface SyncResult {
  /** Nombre d'opérations traitées avec succès */
  successCount: number;
  /** Nombre d'opérations échouées */
  failedCount: number;
  /** Nombre d'opérations en conflit */
  conflictCount: number;
  /** Détails des erreurs */
  errors: string[];
  /** Temps de traitement en millisecondes */
  processingTime: number;
}

/**
 * Interface pour les statistiques de la queue
 */
export interface QueueStats {
  /** Nombre total d'éléments en attente */
  pendingCount: number;
  /** Nombre d'éléments par type d'entité */
  byEntityType: Record<EntityType, number>;
  /** Nombre d'éléments par opération */
  byOperation: Record<SyncOperation, number>;
  /** Nombre d'éléments par priorité */
  byPriority: Record<number, number>;
  /** Dernière synchronisation */
  lastSyncTime: string | null;
  /** Prochaine tentative programmée */
  nextRetryTime: string | null;
}

/**
 * Service singleton pour la gestion de la queue de synchronisation
 */
class SyncQueueService {
  private static instance: SyncQueueService;
  private isInitialized: boolean = false;
  private isProcessing: boolean = false;
  private syncInProgress: boolean = false;
  private retryTimer: NodeJS.Timeout | null = null;
  private networkListener: (() => void) | null = null;
  private readonly defaultOptions: Required<SyncOptions> = {
    forceSync: false,
    priority: 3,
    retryDelay: 5000,
    maxRetries: 3
  };

  private constructor() {}

  /**
   * Singleton pattern pour garantir une seule instance
   */
  public static getInstance(): SyncQueueService {
    if (!SyncQueueService.instance) {
      SyncQueueService.instance = new SyncQueueService();
    }
    return SyncQueueService.instance;
  }

  /**
   * Initialise le service de queue de synchronisation
   * S'abonne aux changements de réseau pour le déclenchement automatique
   */
  public async initialize(): Promise<void> {
    try {
      console.log('[SYNC_QUEUE] Initialisation du service de queue de synchronisation...');
      
      // S'assurer que la base de données est initialisée
      if (!DatabaseService.isInitialized()) {
        await DatabaseService.initDatabase();
      }
      
      // S'abonner aux changements de réseau
      this.setupNetworkListener();
      
      // Vérifier s'il y a des opérations en attente
      const pendingCount = await this.getPendingCount();
      console.log(`[SYNC_QUEUE] ${pendingCount} opérations en attente détectées`);
      
      // Programmer une tentative de synchronisation si on est en ligne
      if (NetworkService.isOnline() && pendingCount > 0) {
        console.log('[SYNC_QUEUE] Réseau disponible - Lancement de la synchronisation');
        this.scheduleSync();
      }
      
      this.isInitialized = true;
      console.log('[SYNC_QUEUE] Service de queue de synchronisation initialisé');
      
    } catch (error) {
      console.error('[SYNC_QUEUE] Erreur lors de l\'initialisation:', error);
      throw new Error(`Échec de l'initialisation du service de queue: ${error.message}`);
    }
  }

  /**
   * Configure l'écoute des changements de réseau
   */
  private setupNetworkListener(): void {
    this.networkListener = NetworkService.addListener((networkInfo) => {
      console.log('[SYNC_QUEUE] Changement de réseau détecté:', networkInfo);
      
      // Déclencher la synchronisation au retour de connectivité
      if (networkInfo.isConnected && networkInfo.isInternetReachable) {
        console.log('[SYNC_QUEUE] Reconnexion détectée - Déclenchement de la synchronisation');
        this.scheduleSync();
      } else {
        console.log('[SYNC_QUEUE] Déconnexion détectée - Arrêt de la synchronisation');
        this.cancelScheduledSync();
      }
    });
  }

  /**
   * Ajoute une opération à la queue de synchronisation
   * @param entityType - Type d'entité (product, sale, stock_movement)
   * @param operation - Type d'opération (create, update, delete)
   * @param entityId - ID local de l'entité
   * @param entityData - Données de l'entité à synchroniser
   * @param options - Options de synchronisation
   * @returns Promise<SyncQueueItem> - L'élément ajouté à la queue
   */
  public async addToQueue(
    entityType: EntityType,
    operation: SyncOperation,
    entityId: string,
    entityData: any,
    options: SyncOptions = {}
  ): Promise<SyncQueueItem> {
    try {
      console.log(`[SYNC_QUEUE] Ajout à la queue: ${operation} ${entityType} ${entityId}`);
      
      const finalOptions = { ...this.defaultOptions, ...options };
      const now = new Date().toISOString();
      
      // Créer l'élément de queue
      const queueItem: CreateSyncQueueItemDTO = {
        entity_type: entityType,
        operation,
        entity_id: entityId,
        entity_data: JSON.stringify(entityData),
        priority: finalOptions.priority,
        retry_count: 0,
        max_retries: finalOptions.maxRetries,
        status: 'pending',
        created_at: now,
        updated_at: now,
        scheduled_at: now
      };
      
      // Insérer dans la base de données
      const id = await this.insertQueueItem(queueItem);
      
      const result: SyncQueueItem = {
        id,
        entity_type: entityType,
        operation,
        entity_id: entityId,
        entity_data: entityData,
        priority: finalOptions.priority,
        retry_count: 0,
        max_retries: finalOptions.maxRetries,
        status: 'pending',
        created_at: now,
        updated_at: now,
        scheduled_at: now
      };
      
      console.log(`[SYNC_QUEUE] Opération ajoutée à la queue avec ID: ${id}`);
      
      // Programmer une synchronisation si on est en ligne
      if (NetworkService.isOnline() && !this.isProcessing) {
        this.scheduleSync();
      }
      
      return result;
      
    } catch (error) {
      console.error(`[SYNC_QUEUE] Erreur lors de l'ajout à la queue: ${error.message}`, error);
      throw new Error(`Échec de l'ajout à la queue: ${error.message}`);
    }
  }

  /**
   * Insère un élément dans la table sync_queue
   * @param queueItem - Données de l'élément à insérer
   * @returns Promise<string> - ID de l'élément inséré
   */
  private async insertQueueItem(queueItem: CreateSyncQueueItemDTO): Promise<string> {
    const result = await DatabaseService.executeSql(
      `INSERT INTO sync_queue (
        entity_type, operation, entity_id, entity_data, priority,
        retry_count, max_retries, status, created_at, updated_at, scheduled_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        queueItem.entity_type,
        queueItem.operation,
        queueItem.entity_id,
        queueItem.entity_data,
        queueItem.priority,
        queueItem.retry_count,
        queueItem.max_retries,
        queueItem.status,
        queueItem.created_at,
        queueItem.updated_at,
        queueItem.scheduled_at
      ]
    );
    
    return result.insertId?.toString() || Date.now().toString();
  }

  /**
   * Récupère les éléments de la queue prêts à être synchronisés
   * @param limit - Nombre maximum d'éléments à récupérer
   * @returns Promise<SyncQueueItem[]> - Liste des éléments à synchroniser
   */
  public async getPendingItems(limit: number = 50): Promise<SyncQueueItem[]> {
    try {
      const result = await DatabaseService.executeSql(
        `SELECT * FROM sync_queue 
         WHERE status = 'pending' 
         AND (scheduled_at <= ? OR scheduled_at IS NULL)
         ORDER BY priority ASC, created_at ASC 
         LIMIT ?`,
        [new Date().toISOString(), limit]
      );
      
      return this.mapQueueItems(result.rows);
      
    } catch (error) {
      console.error('[SYNC_QUEUE] Erreur lors de la récupération des éléments en attente:', error);
      throw new Error(`Échec de la récupération des éléments: ${error.message}`);
    }
  }

  /**
   * Mappe les résultats SQL vers les objets SyncQueueItem
   * @param rows - Résultats de la requête SQL
   * @returns SyncQueueItem[] - Liste des éléments mappés
   */
  private mapQueueItems(rows: any[]): SyncQueueItem[] {
    return rows.map(row => ({
      id: row.id,
      entity_type: row.entity_type,
      operation: row.operation,
      entity_id: row.entity_id,
      entity_data: JSON.parse(row.entity_data || '{}'),
      priority: row.priority,
      retry_count: row.retry_count,
      max_retries: row.max_retries,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      scheduled_at: row.scheduled_at
    }));
  }

  /**
   * Traite la queue de synchronisation
   * @param options - Options de synchronisation
   * @returns Promise<SyncResult> - Résultat du traitement
   */
  public async processQueue(options: SyncOptions = {}): Promise<SyncResult> {
    if (this.isProcessing) {
      console.log('[SYNC_QUEUE] Synchronisation déjà en cours, ignorée');
      return {
        successCount: 0,
        failedCount: 0,
        conflictCount: 0,
        errors: ['Synchronisation déjà en cours'],
        processingTime: 0
      };
    }

    const startTime = Date.now();
    const finalOptions = { ...this.defaultOptions, ...options };
    
    try {
      console.log('[SYNC_QUEUE] Début du traitement de la queue...');
      this.isProcessing = true;
      
      // Vérifier la connectivité
      if (!NetworkService.isOnline() && !finalOptions.forceSync) {
        console.log('[SYNC_QUEUE] Pas de connectivité, synchronisation reportée');
        return {
          successCount: 0,
          failedCount: 0,
          conflictCount: 0,
          errors: ['Pas de connectivité réseau'],
          processingTime: Date.now() - startTime
        };
      }
      
      // Récupérer les éléments à traiter
      const pendingItems = await this.getPendingItems(50);
      console.log(`[SYNC_QUEUE] ${pendingItems.length} éléments à traiter`);
      
      if (pendingItems.length === 0) {
        console.log('[SYNC_QUEUE] Aucun élément à traiter');
        return {
          successCount: 0,
          failedCount: 0,
          conflictCount: 0,
          errors: [],
          processingTime: Date.now() - startTime
        };
      }
      
      // Traiter chaque élément
      const results = await this.processItems(pendingItems);
      
      const processingTime = Date.now() - startTime;
      console.log(`[SYNC_QUEUE] Traitement terminé en ${processingTime}ms: ${results.successCount} succès, ${results.failedCount} échecs`);
      
      return {
        ...results,
        processingTime
      };
      
    } catch (error) {
      console.error('[SYNC_QUEUE] Erreur lors du traitement de la queue:', error);
      throw new Error(`Échec du traitement de la queue: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Traite une liste d'éléments de la queue
   * @param items - Liste des éléments à traiter
   * @returns Promise<Partial<SyncResult>> - Résultats partiels du traitement
   */
  private async processItems(items: SyncQueueItem[]): Promise<Partial<SyncResult>> {
    let successCount = 0;
    let failedCount = 0;
    let conflictCount = 0;
    const errors: string[] = [];
    
    for (const item of items) {
      try {
        console.log(`[SYNC_QUEUE] Traitement de l'élément ${item.id}: ${item.operation} ${item.entity_type}`);
        
        const result = await this.processSingleItem(item);
        
        if (result.success) {
          successCount++;
          await this.markItemAsCompleted(item.id);
        } else if (result.conflict) {
          conflictCount++;
          await this.markItemAsConflict(item.id, result.error);
        } else {
          failedCount++;
          await this.handleItemFailure(item, result.error);
        }
        
      } catch (error) {
        console.error(`[SYNC_QUEUE] Erreur lors du traitement de l'élément ${item.id}:`, error);
        failedCount++;
        errors.push(`Élément ${item.id}: ${error.message}`);
        await this.handleItemFailure(item, error.message);
      }
    }
    
    return { successCount, failedCount, conflictCount, errors };
  }

  /**
   * Traite un seul élément de la queue
   * @param item - Élément à traiter
   * @returns Promise<{success: boolean, conflict?: boolean, error?: string}> - Résultat du traitement
   */
  private async processSingleItem(item: SyncQueueItem): Promise<{success: boolean, conflict?: boolean, error?: string}> {
    try {
      // TODO: Intégrer avec l'API client pour envoyer au serveur
      // Pour l'instant, simulation d'un traitement réussi
      console.log(`[SYNC_QUEUE] Simulation du traitement de ${item.operation} ${item.entity_type} ${item.entity_id}`);
      
      // Simuler un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Simuler différents résultats selon l'opération
      if (item.operation === 'delete' && Math.random() < 0.1) {
        return { success: false, error: 'Entité déjà supprimée côté serveur' };
      }
      
      if (item.operation === 'update' && Math.random() < 0.05) {
        return { success: false, conflict: true, error: 'Conflit de version détecté' };
      }
      
      return { success: true };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Marque un élément comme terminé avec succès
   * @param itemId - ID de l'élément
   */
  private async markItemAsCompleted(itemId: string): Promise<void> {
    await DatabaseService.executeSql(
      `UPDATE sync_queue 
       SET status = 'synced', updated_at = ? 
       WHERE id = ?`,
      [new Date().toISOString(), itemId]
    );
    console.log(`[SYNC_QUEUE] Élément ${itemId} marqué comme synchronisé`);
  }

  /**
   * Marque un élément comme en conflit
   * @param itemId - ID de l'élément
   * @param error - Message d'erreur
   */
  private async markItemAsConflict(itemId: string, error: string): Promise<void> {
    await DatabaseService.executeSql(
      `UPDATE sync_queue 
       SET status = 'conflict', updated_at = ? 
       WHERE id = ?`,
      [new Date().toISOString(), itemId]
    );
    console.log(`[SYNC_QUEUE] Élément ${itemId} marqué comme conflit: ${error}`);
  }

  /**
   * Gère l'échec d'un élément (retry ou abandon)
   * @param item - Élément en échec
   * @param error - Message d'erreur
   */
  private async handleItemFailure(item: SyncQueueItem, error: string): Promise<void> {
    const newRetryCount = item.retry_count + 1;
    
    if (newRetryCount >= item.max_retries) {
      // Abandonner après le nombre maximum de tentatives
      await DatabaseService.executeSql(
        `UPDATE sync_queue 
         SET status = 'failed', retry_count = ?, updated_at = ? 
         WHERE id = ?`,
        [newRetryCount, new Date().toISOString(), item.id]
      );
      console.log(`[SYNC_QUEUE] Élément ${item.id} abandonné après ${newRetryCount} tentatives`);
    } else {
      // Programmer une nouvelle tentative avec délai exponentiel
      const delay = this.calculateRetryDelay(newRetryCount);
      const nextRetry = new Date(Date.now() + delay).toISOString();
      
      await DatabaseService.executeSql(
        `UPDATE sync_queue 
         SET retry_count = ?, scheduled_at = ?, updated_at = ? 
         WHERE id = ?`,
        [newRetryCount, nextRetry, new Date().toISOString(), item.id]
      );
      console.log(`[SYNC_QUEUE] Élément ${item.id} programmé pour retry ${newRetryCount} à ${nextRetry}`);
    }
  }

  /**
   * Calcule le délai de retry avec backoff exponentiel
   * @param retryCount - Nombre de tentatives déjà effectuées
   * @returns number - Délai en millisecondes
   */
  private calculateRetryDelay(retryCount: number): number {
    const baseDelay = 5000; // 5 secondes
    const maxDelay = 300000; // 5 minutes
    const delay = baseDelay * Math.pow(2, retryCount - 1);
    return Math.min(delay, maxDelay);
  }

  /**
   * Programme une synchronisation pour plus tard
   */
  private scheduleSync(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    
    // Délai aléatoire pour éviter les collisions
    const delay = Math.random() * 2000 + 1000; // 1-3 secondes
    
    this.retryTimer = setTimeout(() => {
      this.triggerSync();
    }, delay);
    
    console.log(`[SYNC_QUEUE] Synchronisation programmée dans ${delay}ms`);
  }

  /**
   * Annule la synchronisation programmée
   */
  private cancelScheduledSync(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
      console.log('[SYNC_QUEUE] Synchronisation programmée annulée');
    }
  }

  /**
   * Déclenche manuellement la synchronisation
   */
  private async triggerSync(): Promise<void> {
    if (this.isProcessing) {
      console.log('[SYNC_QUEUE] Synchronisation déjà en cours');
      return;
    }
    
    try {
      console.log('[SYNC_QUEUE] Déclenchement manuel de la synchronisation');
      await this.processQueue();
    } catch (error) {
      console.error('[SYNC_QUEUE] Erreur lors de la synchronisation manuelle:', error);
    }
  }

  /**
   * Déclenche manuellement la synchronisation (méthode publique)
   * @param options - Options de synchronisation
   * @returns Promise<SyncResult> - Résultat de la synchronisation
   */
  public async triggerManualSync(options: SyncOptions = {}): Promise<SyncResult> {
    console.log('[SYNC_QUEUE] Synchronisation manuelle déclenchée');
    return await this.processQueue(options);
  }

  /**
   * Récupère le nombre d'éléments en attente
   * @returns Promise<number> - Nombre d'éléments en attente
   */
  public async getPendingCount(): Promise<number> {
    try {
      const result = await DatabaseService.executeSql(
        'SELECT COUNT(*) as count FROM sync_queue WHERE status = ?',
        ['pending']
      );
      
      return result.rows[0]?.count || 0;
      
    } catch (error) {
      console.error('[SYNC_QUEUE] Erreur lors du comptage des éléments en attente:', error);
      return 0;
    }
  }

  /**
   * Récupère les statistiques de la queue
   * @returns Promise<QueueStats> - Statistiques complètes
   */
  public async getQueueStats(): Promise<QueueStats> {
    try {
      // Compter par statut
      const pendingResult = await DatabaseService.executeSql(
        'SELECT COUNT(*) as count FROM sync_queue WHERE status = ?',
        ['pending']
      );
      const pendingCount = pendingResult.rows[0]?.count || 0;
      
      // Compter par type d'entité
      const entityResult = await DatabaseService.executeSql(
        'SELECT entity_type, COUNT(*) as count FROM sync_queue WHERE status = ? GROUP BY entity_type',
        ['pending']
      );
      const byEntityType: Record<EntityType, number> = {
        product: 0,
        sale: 0,
        stock_movement: 0
      };
      entityResult.rows.forEach(row => {
        byEntityType[row.entity_type] = row.count;
      });
      
      // Compter par opération
      const operationResult = await DatabaseService.executeSql(
        'SELECT operation, COUNT(*) as count FROM sync_queue WHERE status = ? GROUP BY operation',
        ['pending']
      );
      const byOperation: Record<SyncOperation, number> = {
        create: 0,
        update: 0,
        delete: 0
      };
      operationResult.rows.forEach(row => {
        byOperation[row.operation] = row.count;
      });
      
      // Compter par priorité
      const priorityResult = await DatabaseService.executeSql(
        'SELECT priority, COUNT(*) as count FROM sync_queue WHERE status = ? GROUP BY priority',
        ['pending']
      );
      const byPriority: Record<number, number> = {};
      priorityResult.rows.forEach(row => {
        byPriority[row.priority] = row.count;
      });
      
      // Dernière synchronisation
      const lastSyncResult = await DatabaseService.executeSql(
        'SELECT MAX(updated_at) as last_sync FROM sync_queue WHERE status = ?',
        ['synced']
      );
      const lastSyncTime = lastSyncResult.rows[0]?.last_sync || null;
      
      // Prochaine tentative
      const nextRetryResult = await DatabaseService.executeSql(
        'SELECT MIN(scheduled_at) as next_retry FROM sync_queue WHERE status = ? AND scheduled_at > ?',
        ['pending', new Date().toISOString()]
      );
      const nextRetryTime = nextRetryResult.rows[0]?.next_retry || null;
      
      return {
        pendingCount,
        byEntityType,
        byOperation,
        byPriority,
        lastSyncTime,
        nextRetryTime
      };
      
    } catch (error) {
      console.error('[SYNC_QUEUE] Erreur lors de la récupération des statistiques:', error);
      throw new Error(`Échec de la récupération des statistiques: ${error.message}`);
    }
  }

  /**
   * Vide la queue de synchronisation
   * @param status - Statut des éléments à supprimer (optionnel)
   * @returns Promise<number> - Nombre d'éléments supprimés
   */
  public async clearQueue(status?: SyncStatus): Promise<number> {
    try {
      let query = 'DELETE FROM sync_queue';
      let params: any[] = [];
      
      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
      }
      
      const result = await DatabaseService.executeSql(query, params);
      const deletedCount = result.rowsAffected || 0;
      
      console.log(`[SYNC_QUEUE] ${deletedCount} éléments supprimés de la queue`);
      
      return deletedCount;
      
    } catch (error) {
      console.error('[SYNC_QUEUE] Erreur lors du vidage de la queue:', error);
      throw new Error(`Échec du vidage de la queue: ${error.message}`);
    }
  }

  /**
   * Vérifie si le service est initialisé
   * @returns boolean - true si initialisé, false sinon
   */
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Vérifie si une synchronisation est en cours
   * @returns boolean - true si en cours, false sinon
   */
  public isSyncInProgress(): boolean {
    return this.isProcessing;
  }

  /**
   * Arrête le service et nettoie les ressources
   */
  public async cleanup(): Promise<void> {
    try {
      console.log('[SYNC_QUEUE] Nettoyage du service de queue de synchronisation...');
      
      // Annuler la synchronisation programmée
      this.cancelScheduledSync();
      
      // Supprimer l'écouteur réseau
      if (this.networkListener) {
        this.networkListener();
        this.networkListener = null;
      }
      
      // Réinitialiser l'état
      this.isProcessing = false;
      this.syncInProgress = false;
      this.isInitialized = false;
      
      console.log('[SYNC_QUEUE] Service de queue de synchronisation nettoyé');
      
    } catch (error) {
      console.error('[SYNC_QUEUE] Erreur lors du nettoyage:', error);
      throw new Error(`Échec du nettoyage du service de queue: ${error.message}`);
    }
  }
}

// Export de l'instance singleton
export default SyncQueueService.getInstance();

