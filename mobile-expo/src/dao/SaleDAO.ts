/**
 * DAO (Data Access Object) pour les ventes
 * Implémente toutes les opérations CRUD pour la table sales
 */

import { v4 as uuidv4 } from 'uuid';
import DatabaseService from '../services/database/DatabaseService';
import {
  Sale,
  CreateSaleDTO,
  UpdateSaleDTO,
  SaleSearchCriteria,
  SaleWithProduct,
  SyncStatus
} from '../types/models';

/**
 * Classe DAO pour gérer les opérations sur les ventes
 */
export class SaleDAO {
  private static instance: SaleDAO;
  private db: typeof DatabaseService;

  private constructor() {
    this.db = DatabaseService;
  }

  /**
   * Singleton pattern pour garantir une seule instance
   */
  public static getInstance(): SaleDAO {
    if (!SaleDAO.instance) {
      SaleDAO.instance = new SaleDAO();
    }
    return SaleDAO.instance;
  }

  /**
   * Crée une nouvelle vente dans la base de données locale
   * @param saleData - Données de la vente à créer
   * @returns La vente créée avec son ID généré
   */
  public async create(saleData: CreateSaleDTO): Promise<Sale> {
    try {
      console.log('[SaleDAO] Création d\'une nouvelle vente pour le produit:', saleData.product_id);
      
      const id = uuidv4();
      const now = new Date().toISOString();
      
      const sale: Sale = {
        id,
        product_id: saleData.product_id,
        quantity: saleData.quantity,
        unit_price: saleData.unit_price,
        total_amount: saleData.total_amount,
        sale_date: saleData.sale_date,
        created_at: now,
        updated_at: now,
        is_deleted: 0,
        sync_status: 'pending',
        user_id: saleData.user_id
      };

      await this.db.executeSql(`
        INSERT INTO sales (
          id, product_id, quantity, unit_price, total_amount, sale_date,
          created_at, updated_at, is_deleted, sync_status, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        sale.id,
        sale.product_id,
        sale.quantity,
        sale.unit_price,
        sale.total_amount,
        sale.sale_date,
        sale.created_at,
        sale.updated_at,
        sale.is_deleted,
        sale.sync_status,
        sale.user_id
      ]);

      console.log('[SaleDAO] Vente créée avec succès:', id);
      return sale;

    } catch (error) {
      console.error('[SaleDAO] Erreur lors de la création de la vente:', error);
      throw new Error(`Échec de la création de la vente: ${error}`);
    }
  }

  /**
   * Récupère une vente par son ID
   * @param id - ID de la vente
   * @returns La vente trouvée ou null
   */
  public async getById(id: string): Promise<Sale | null> {
    try {
      console.log('[SaleDAO] Recherche de la vente:', id);
      
      const result = await this.db.executeSql(
        'SELECT * FROM sales WHERE id = ? AND is_deleted = 0',
        [id]
      );

      if (result.rows.length === 0) {
        console.log('[SaleDAO] Vente non trouvée:', id);
        return null;
      }

      const sale = this.mapRowToSale(result.rows.item(0));
      console.log('[SaleDAO] Vente trouvée, montant:', sale.total_amount);
      return sale;

    } catch (error) {
      console.error('[SaleDAO] Erreur lors de la recherche de la vente:', error);
      throw new Error(`Échec de la recherche de la vente: ${error}`);
    }
  }

  /**
   * Récupère toutes les ventes d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @param limit - Nombre maximum de résultats (optionnel)
   * @param offset - Décalage pour la pagination (optionnel)
   * @returns Liste des ventes
   */
  public async getAll(userId: string, limit?: number, offset?: number): Promise<Sale[]> {
    try {
      console.log('[SaleDAO] Récupération de toutes les ventes pour l\'utilisateur:', userId);
      
      let query = `
        SELECT * FROM sales 
        WHERE user_id = ? AND is_deleted = 0 
        ORDER BY sale_date DESC
      `;
      const params: any[] = [userId];

      if (limit) {
        query += ' LIMIT ?';
        params.push(limit);
        
        if (offset) {
          query += ' OFFSET ?';
          params.push(offset);
        }
      }

      const result = await this.db.executeSql(query, params);

      const sales: Sale[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        sales.push(this.mapRowToSale(result.rows.item(i)));
      }

      console.log(`[SaleDAO] ${sales.length} ventes trouvées`);
      return sales;

    } catch (error) {
      console.error('[SaleDAO] Erreur lors de la récupération des ventes:', error);
      throw new Error(`Échec de la récupération des ventes: ${error}`);
    }
  }

  /**
   * Récupère les ventes avec les informations du produit
   * @param userId - ID de l'utilisateur
   * @param limit - Nombre maximum de résultats (optionnel)
   * @returns Liste des ventes avec informations produit
   */
  public async getAllWithProducts(userId: string, limit?: number): Promise<SaleWithProduct[]> {
    try {
      console.log('[SaleDAO] Récupération des ventes avec informations produit pour:', userId);
      
      let query = `
        SELECT s.*, p.name as product_name, p.price as product_price
        FROM sales s
        INNER JOIN products p ON s.product_id = p.id
        WHERE s.user_id = ? AND s.is_deleted = 0 AND p.is_deleted = 0
        ORDER BY s.sale_date DESC
      `;
      const params: any[] = [userId];

      if (limit) {
        query += ' LIMIT ?';
        params.push(limit);
      }

      const result = await this.db.executeSql(query, params);

      const sales: SaleWithProduct[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        sales.push({
          ...this.mapRowToSale(row),
          product_name: row.product_name,
          product_price: row.product_price
        });
      }

      console.log(`[SaleDAO] ${sales.length} ventes avec produits trouvées`);
      return sales;

    } catch (error) {
      console.error('[SaleDAO] Erreur lors de la récupération des ventes avec produits:', error);
      throw new Error(`Échec de la récupération des ventes avec produits: ${error}`);
    }
  }

  /**
   * Met à jour une vente existante
   * @param id - ID de la vente à mettre à jour
   * @param updateData - Données à mettre à jour
   * @returns La vente mise à jour
   */
  public async update(id: string, updateData: UpdateSaleDTO): Promise<Sale | null> {
    try {
      console.log('[SaleDAO] Mise à jour de la vente:', id);
      
      const existingSale = await this.getById(id);
      if (!existingSale) {
        console.error('[SaleDAO] Vente non trouvée pour la mise à jour:', id);
        return null;
      }

      const updatedSale: Sale = {
        ...existingSale,
        ...updateData,
        updated_at: new Date().toISOString(),
        sync_status: 'pending' // Marquer comme en attente de sync
      };

      await this.db.executeSql(`
        UPDATE sales SET
          product_id = ?, quantity = ?, unit_price = ?, total_amount = ?,
          server_id = ?, product_server_id = ?, sync_status = ?, updated_at = ?
        WHERE id = ?
      `, [
        updatedSale.product_id,
        updatedSale.quantity,
        updatedSale.unit_price,
        updatedSale.total_amount,
        updatedSale.server_id || null,
        updatedSale.product_server_id || null,
        updatedSale.sync_status,
        updatedSale.updated_at,
        id
      ]);

      console.log('[SaleDAO] Vente mise à jour avec succès:', id);
      return updatedSale;

    } catch (error) {
      console.error('[SaleDAO] Erreur lors de la mise à jour de la vente:', error);
      throw new Error(`Échec de la mise à jour de la vente: ${error}`);
    }
  }

  /**
   * Supprime logiquement une vente (soft delete)
   * @param id - ID de la vente à supprimer
   * @returns true si la suppression a réussi
   */
  public async softDelete(id: string): Promise<boolean> {
    try {
      console.log('[SaleDAO] Suppression logique de la vente:', id);
      
      const result = await this.db.executeSql(`
        UPDATE sales SET
          is_deleted = 1, sync_status = 'pending', updated_at = ?
        WHERE id = ? AND is_deleted = 0
      `, [new Date().toISOString(), id]);

      const success = result.rowsAffected > 0;
      console.log('[SaleDAO] Suppression logique:', success ? 'réussie' : 'échec');
      return success;

    } catch (error) {
      console.error('[SaleDAO] Erreur lors de la suppression de la vente:', error);
      throw new Error(`Échec de la suppression de la vente: ${error}`);
    }
  }

  /**
   * Recherche des ventes selon des critères
   * @param criteria - Critères de recherche
   * @returns Liste des ventes correspondantes
   */
  public async search(criteria: SaleSearchCriteria): Promise<Sale[]> {
    try {
      console.log('[SaleDAO] Recherche de ventes avec critères:', criteria);
      
      let query = `
        SELECT * FROM sales 
        WHERE user_id = ? AND is_deleted = 0
      `;
      const params: any[] = [criteria.userId];

      // Filtres optionnels
      if (criteria.productId) {
        query += ' AND product_id = ?';
        params.push(criteria.productId);
      }

      if (criteria.dateFrom) {
        query += ' AND sale_date >= ?';
        params.push(criteria.dateFrom);
      }

      if (criteria.dateTo) {
        query += ' AND sale_date <= ?';
        params.push(criteria.dateTo);
      }

      if (criteria.minAmount !== undefined) {
        query += ' AND total_amount >= ?';
        params.push(criteria.minAmount);
      }

      if (criteria.maxAmount !== undefined) {
        query += ' AND total_amount <= ?';
        params.push(criteria.maxAmount);
      }

      if (criteria.syncStatus) {
        query += ' AND sync_status = ?';
        params.push(criteria.syncStatus);
      }

      query += ' ORDER BY sale_date DESC';

      if (criteria.limit) {
        query += ' LIMIT ?';
        params.push(criteria.limit);
        
        if (criteria.offset) {
          query += ' OFFSET ?';
          params.push(criteria.offset);
        }
      }

      const result = await this.db.executeSql(query, params);

      const sales: Sale[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        sales.push(this.mapRowToSale(result.rows.item(i)));
      }

      console.log(`[SaleDAO] ${sales.length} ventes trouvées par recherche`);
      return sales;

    } catch (error) {
      console.error('[SaleDAO] Erreur lors de la recherche:', error);
      throw new Error(`Échec de la recherche de ventes: ${error}`);
    }
  }

  /**
   * Met à jour le statut de synchronisation d'une vente
   * @param id - ID de la vente
   * @param syncStatus - Nouveau statut de synchronisation
   * @param serverId - ID serveur après synchronisation (optionnel)
   * @param productServerId - ID serveur du produit (optionnel)
   * @returns true si la mise à jour a réussi
   */
  public async updateSyncStatus(
    id: string, 
    syncStatus: SyncStatus, 
    serverId?: number,
    productServerId?: number
  ): Promise<boolean> {
    try {
      console.log('[SaleDAO] Mise à jour du statut de sync:', id, syncStatus);
      
      let query = `
        UPDATE sales SET sync_status = ?, updated_at = ?
        WHERE id = ?
      `;
      const params: any[] = [syncStatus, new Date().toISOString(), id];

      if (serverId || productServerId) {
        query = `
          UPDATE sales SET sync_status = ?, server_id = ?, product_server_id = ?, updated_at = ?
          WHERE id = ?
        `;
        params.splice(1, 0, serverId || null, productServerId || null);
      }

      const result = await this.db.executeSql(query, params);
      const success = result.rowsAffected > 0;
      
      console.log('[SaleDAO] Statut de sync mis à jour:', success ? 'réussi' : 'échec');
      return success;

    } catch (error) {
      console.error('[SaleDAO] Erreur lors de la mise à jour du statut de sync:', error);
      throw new Error(`Échec de la mise à jour du statut de sync: ${error}`);
    }
  }

  /**
   * Récupère les ventes en attente de synchronisation
   * @param userId - ID de l'utilisateur
   * @returns Liste des ventes en attente
   */
  public async getPendingSync(userId: string): Promise<Sale[]> {
    try {
      console.log('[SaleDAO] Récupération des ventes en attente de sync pour:', userId);
      
      const result = await this.db.executeSql(`
        SELECT * FROM sales 
        WHERE user_id = ? AND sync_status = 'pending' AND is_deleted = 0
        ORDER BY created_at ASC
      `, [userId]);

      const sales: Sale[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        sales.push(this.mapRowToSale(result.rows.item(i)));
      }

      console.log(`[SaleDAO] ${sales.length} ventes en attente de sync`);
      return sales;

    } catch (error) {
      console.error('[SaleDAO] Erreur lors de la récupération des ventes en attente:', error);
      throw new Error(`Échec de la récupération des ventes en attente: ${error}`);
    }
  }

  /**
   * Met à jour ou insère une vente (upsert) - utilisé lors de la synchronisation
   * @param sale - Données de la vente à insérer/mettre à jour
   * @returns La vente upsertée
   */
  public async upsert(sale: Sale): Promise<Sale> {
    try {
      console.log('[SaleDAO] Upsert de la vente:', sale.id);
      
      const existingSale = await this.getById(sale.id);
      
      if (existingSale) {
        // Mettre à jour
        return await this.update(sale.id, sale);
      } else {
        // Insérer
        await this.db.executeSql(`
          INSERT INTO sales (
            id, server_id, product_id, product_server_id, quantity, unit_price,
            total_amount, sale_date, created_at, updated_at, is_deleted, sync_status, user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          sale.id,
          sale.server_id || null,
          sale.product_id,
          sale.product_server_id || null,
          sale.quantity,
          sale.unit_price,
          sale.total_amount,
          sale.sale_date,
          sale.created_at,
          sale.updated_at,
          sale.is_deleted,
          sale.sync_status,
          sale.user_id
        ]);
        
        console.log('[SaleDAO] Vente insérée via upsert:', sale.id);
        return sale;
      }

    } catch (error) {
      console.error('[SaleDAO] Erreur lors de l\'upsert de la vente:', error);
      throw new Error(`Échec de l'upsert de la vente: ${error}`);
    }
  }

  /**
   * Compte le nombre total de ventes d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Nombre de ventes
   */
  public async count(userId: string): Promise<number> {
    try {
      const result = await this.db.executeSql(
        'SELECT COUNT(*) as count FROM sales WHERE user_id = ? AND is_deleted = 0',
        [userId]
      );

      return result.rows.item(0).count;

    } catch (error) {
      console.error('[SaleDAO] Erreur lors du comptage des ventes:', error);
      throw new Error(`Échec du comptage des ventes: ${error}`);
    }
  }

  /**
   * Calcule le montant total des ventes d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @param dateFrom - Date de début (optionnel)
   * @param dateTo - Date de fin (optionnel)
   * @returns Montant total des ventes
   */
  public async getTotalAmount(userId: string, dateFrom?: string, dateTo?: string): Promise<number> {
    try {
      let query = `
        SELECT SUM(total_amount) as total FROM sales 
        WHERE user_id = ? AND is_deleted = 0
      `;
      const params: any[] = [userId];

      if (dateFrom) {
        query += ' AND sale_date >= ?';
        params.push(dateFrom);
      }

      if (dateTo) {
        query += ' AND sale_date <= ?';
        params.push(dateTo);
      }

      const result = await this.db.executeSql(query, params);
      const total = result.rows.item(0).total;
      
      return total || 0;

    } catch (error) {
      console.error('[SaleDAO] Erreur lors du calcul du montant total:', error);
      throw new Error(`Échec du calcul du montant total: ${error}`);
    }
  }

  /**
   * Convertit une ligne de base de données en objet Sale
   * @param row - Ligne de la base de données
   * @returns Objet Sale
   */
  private mapRowToSale(row: any): Sale {
    return {
      id: row.id,
      server_id: row.server_id || undefined,
      product_id: row.product_id,
      product_server_id: row.product_server_id || undefined,
      quantity: row.quantity,
      unit_price: row.unit_price,
      total_amount: row.total_amount,
      sale_date: row.sale_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_deleted: row.is_deleted,
      sync_status: row.sync_status,
      user_id: row.user_id
    };
  }
}

// Export de l'instance singleton
export default SaleDAO.getInstance();

