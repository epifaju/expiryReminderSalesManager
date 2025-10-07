/**
 * DAO (Data Access Object) pour les produits
 * Implémente toutes les opérations CRUD pour la table products
 */

import { v4 as uuidv4 } from 'uuid';
import DatabaseService from '../services/database/DatabaseService';
import {
  Product,
  CreateProductDTO,
  UpdateProductDTO,
  ProductSearchCriteria,
  SyncStatus
} from '../types/models';

/**
 * Classe DAO pour gérer les opérations sur les produits
 */
export class ProductDAO {
  private static instance: ProductDAO;
  private db: typeof DatabaseService;

  private constructor() {
    this.db = DatabaseService;
  }

  /**
   * Singleton pattern pour garantir une seule instance
   */
  public static getInstance(): ProductDAO {
    if (!ProductDAO.instance) {
      ProductDAO.instance = new ProductDAO();
    }
    return ProductDAO.instance;
  }

  /**
   * Crée un nouveau produit dans la base de données locale
   * @param productData - Données du produit à créer
   * @returns Le produit créé avec son ID généré
   */
  public async create(productData: CreateProductDTO): Promise<Product> {
    try {
      console.log('[ProductDAO] Création d\'un nouveau produit:', productData.name);
      
      const id = uuidv4();
      const now = new Date().toISOString();
      
      const product: Product = {
        id,
        name: productData.name,
        price: productData.price,
        stock_quantity: productData.stock_quantity,
        expiration_date: productData.expiration_date,
        created_at: now,
        updated_at: now,
        is_deleted: 0,
        sync_status: 'pending',
        user_id: productData.user_id
      };

      await this.db.executeSql(`
        INSERT INTO products (
          id, name, price, stock_quantity, expiration_date,
          created_at, updated_at, is_deleted, sync_status, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        product.id,
        product.name,
        product.price,
        product.stock_quantity,
        product.expiration_date || null,
        product.created_at,
        product.updated_at,
        product.is_deleted,
        product.sync_status,
        product.user_id
      ]);

      console.log('[ProductDAO] Produit créé avec succès:', id);
      return product;

    } catch (error) {
      console.error('[ProductDAO] Erreur lors de la création du produit:', error);
      throw new Error(`Échec de la création du produit: ${error}`);
    }
  }

  /**
   * Récupère un produit par son ID
   * @param id - ID du produit
   * @returns Le produit trouvé ou null
   */
  public async getById(id: string): Promise<Product | null> {
    try {
      console.log('[ProductDAO] Recherche du produit:', id);
      
      const result = await this.db.executeSql(
        'SELECT * FROM products WHERE id = ? AND is_deleted = 0',
        [id]
      );

      if (result.rows.length === 0) {
        console.log('[ProductDAO] Produit non trouvé:', id);
        return null;
      }

      const product = this.mapRowToProduct(result.rows.item(0));
      console.log('[ProductDAO] Produit trouvé:', product.name);
      return product;

    } catch (error) {
      console.error('[ProductDAO] Erreur lors de la recherche du produit:', error);
      throw new Error(`Échec de la recherche du produit: ${error}`);
    }
  }

  /**
   * Récupère tous les produits d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @param limit - Nombre maximum de résultats (optionnel)
   * @param offset - Décalage pour la pagination (optionnel)
   * @returns Liste des produits
   */
  public async getAll(userId: string, limit?: number, offset?: number): Promise<Product[]> {
    try {
      console.log('[ProductDAO] Récupération de tous les produits pour l\'utilisateur:', userId);
      
      let query = `
        SELECT * FROM products 
        WHERE user_id = ? AND is_deleted = 0 
        ORDER BY created_at DESC
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

      const products: Product[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        products.push(this.mapRowToProduct(result.rows.item(i)));
      }

      console.log(`[ProductDAO] ${products.length} produits trouvés`);
      return products;

    } catch (error) {
      console.error('[ProductDAO] Erreur lors de la récupération des produits:', error);
      throw new Error(`Échec de la récupération des produits: ${error}`);
    }
  }

  /**
   * Met à jour un produit existant
   * @param id - ID du produit à mettre à jour
   * @param updateData - Données à mettre à jour
   * @returns Le produit mis à jour
   */
  public async update(id: string, updateData: UpdateProductDTO): Promise<Product | null> {
    try {
      console.log('[ProductDAO] Mise à jour du produit:', id);
      
      const existingProduct = await this.getById(id);
      if (!existingProduct) {
        console.error('[ProductDAO] Produit non trouvé pour la mise à jour:', id);
        return null;
      }

      const updatedProduct: Product = {
        ...existingProduct,
        ...updateData,
        updated_at: new Date().toISOString(),
        sync_status: 'pending' // Marquer comme en attente de sync
      };

      await this.db.executeSql(`
        UPDATE products SET
          name = ?, price = ?, stock_quantity = ?, expiration_date = ?,
          server_id = ?, sync_status = ?, updated_at = ?
        WHERE id = ?
      `, [
        updatedProduct.name,
        updatedProduct.price,
        updatedProduct.stock_quantity,
        updatedProduct.expiration_date || null,
        updatedProduct.server_id || null,
        updatedProduct.sync_status,
        updatedProduct.updated_at,
        id
      ]);

      console.log('[ProductDAO] Produit mis à jour avec succès:', id);
      return updatedProduct;

    } catch (error) {
      console.error('[ProductDAO] Erreur lors de la mise à jour du produit:', error);
      throw new Error(`Échec de la mise à jour du produit: ${error}`);
    }
  }

  /**
   * Supprime logiquement un produit (soft delete)
   * @param id - ID du produit à supprimer
   * @returns true si la suppression a réussi
   */
  public async softDelete(id: string): Promise<boolean> {
    try {
      console.log('[ProductDAO] Suppression logique du produit:', id);
      
      const result = await this.db.executeSql(`
        UPDATE products SET
          is_deleted = 1, sync_status = 'pending', updated_at = ?
        WHERE id = ? AND is_deleted = 0
      `, [new Date().toISOString(), id]);

      const success = result.rowsAffected > 0;
      console.log('[ProductDAO] Suppression logique:', success ? 'réussie' : 'échec');
      return success;

    } catch (error) {
      console.error('[ProductDAO] Erreur lors de la suppression du produit:', error);
      throw new Error(`Échec de la suppression du produit: ${error}`);
    }
  }

  /**
   * Recherche des produits selon des critères
   * @param criteria - Critères de recherche
   * @returns Liste des produits correspondants
   */
  public async search(criteria: ProductSearchCriteria): Promise<Product[]> {
    try {
      console.log('[ProductDAO] Recherche de produits avec critères:', criteria);
      
      let query = `
        SELECT * FROM products 
        WHERE user_id = ? AND is_deleted = 0
      `;
      const params: any[] = [criteria.userId];

      // Filtres optionnels
      if (criteria.name) {
        query += ' AND name LIKE ?';
        params.push(`%${criteria.name}%`);
      }

      if (criteria.minPrice !== undefined) {
        query += ' AND price >= ?';
        params.push(criteria.minPrice);
      }

      if (criteria.maxPrice !== undefined) {
        query += ' AND price <= ?';
        params.push(criteria.maxPrice);
      }

      if (criteria.minStock !== undefined) {
        query += ' AND stock_quantity >= ?';
        params.push(criteria.minStock);
      }

      if (criteria.maxStock !== undefined) {
        query += ' AND stock_quantity <= ?';
        params.push(criteria.maxStock);
      }

      if (criteria.expirationDateBefore) {
        query += ' AND expiration_date < ?';
        params.push(criteria.expirationDateBefore);
      }

      if (criteria.syncStatus) {
        query += ' AND sync_status = ?';
        params.push(criteria.syncStatus);
      }

      query += ' ORDER BY created_at DESC';

      if (criteria.limit) {
        query += ' LIMIT ?';
        params.push(criteria.limit);
        
        if (criteria.offset) {
          query += ' OFFSET ?';
          params.push(criteria.offset);
        }
      }

      const result = await this.db.executeSql(query, params);

      const products: Product[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        products.push(this.mapRowToProduct(result.rows.item(i)));
      }

      console.log(`[ProductDAO] ${products.length} produits trouvés par recherche`);
      return products;

    } catch (error) {
      console.error('[ProductDAO] Erreur lors de la recherche:', error);
      throw new Error(`Échec de la recherche de produits: ${error}`);
    }
  }

  /**
   * Met à jour le statut de synchronisation d'un produit
   * @param id - ID du produit
   * @param syncStatus - Nouveau statut de synchronisation
   * @param serverId - ID serveur après synchronisation (optionnel)
   * @returns true si la mise à jour a réussi
   */
  public async updateSyncStatus(
    id: string, 
    syncStatus: SyncStatus, 
    serverId?: number
  ): Promise<boolean> {
    try {
      console.log('[ProductDAO] Mise à jour du statut de sync:', id, syncStatus);
      
      let query = `
        UPDATE products SET sync_status = ?, updated_at = ?
        WHERE id = ?
      `;
      const params: any[] = [syncStatus, new Date().toISOString(), id];

      if (serverId) {
        query = `
          UPDATE products SET sync_status = ?, server_id = ?, updated_at = ?
          WHERE id = ?
        `;
        params.splice(1, 0, serverId);
      }

      const result = await this.db.executeSql(query, params);
      const success = result.rowsAffected > 0;
      
      console.log('[ProductDAO] Statut de sync mis à jour:', success ? 'réussi' : 'échec');
      return success;

    } catch (error) {
      console.error('[ProductDAO] Erreur lors de la mise à jour du statut de sync:', error);
      throw new Error(`Échec de la mise à jour du statut de sync: ${error}`);
    }
  }

  /**
   * Récupère les produits en attente de synchronisation
   * @param userId - ID de l'utilisateur
   * @returns Liste des produits en attente
   */
  public async getPendingSync(userId: string): Promise<Product[]> {
    try {
      console.log('[ProductDAO] Récupération des produits en attente de sync pour:', userId);
      
      const result = await this.db.executeSql(`
        SELECT * FROM products 
        WHERE user_id = ? AND sync_status = 'pending' AND is_deleted = 0
        ORDER BY created_at ASC
      `, [userId]);

      const products: Product[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        products.push(this.mapRowToProduct(result.rows.item(i)));
      }

      console.log(`[ProductDAO] ${products.length} produits en attente de sync`);
      return products;

    } catch (error) {
      console.error('[ProductDAO] Erreur lors de la récupération des produits en attente:', error);
      throw new Error(`Échec de la récupération des produits en attente: ${error}`);
    }
  }

  /**
   * Met à jour ou insère un produit (upsert) - utilisé lors de la synchronisation
   * @param product - Données du produit à insérer/mettre à jour
   * @returns Le produit upserté
   */
  public async upsert(product: Product): Promise<Product> {
    try {
      console.log('[ProductDAO] Upsert du produit:', product.id);
      
      const existingProduct = await this.getById(product.id);
      
      if (existingProduct) {
        // Mettre à jour
        return await this.update(product.id, product);
      } else {
        // Insérer
        await this.db.executeSql(`
          INSERT INTO products (
            id, server_id, name, price, stock_quantity, expiration_date,
            created_at, updated_at, is_deleted, sync_status, user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          product.id,
          product.server_id || null,
          product.name,
          product.price,
          product.stock_quantity,
          product.expiration_date || null,
          product.created_at,
          product.updated_at,
          product.is_deleted,
          product.sync_status,
          product.user_id
        ]);
        
        console.log('[ProductDAO] Produit inséré via upsert:', product.id);
        return product;
      }

    } catch (error) {
      console.error('[ProductDAO] Erreur lors de l\'upsert du produit:', error);
      throw new Error(`Échec de l'upsert du produit: ${error}`);
    }
  }

  /**
   * Compte le nombre total de produits d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Nombre de produits
   */
  public async count(userId: string): Promise<number> {
    try {
      const result = await this.db.executeSql(
        'SELECT COUNT(*) as count FROM products WHERE user_id = ? AND is_deleted = 0',
        [userId]
      );

      return result.rows.item(0).count;

    } catch (error) {
      console.error('[ProductDAO] Erreur lors du comptage des produits:', error);
      throw new Error(`Échec du comptage des produits: ${error}`);
    }
  }

  /**
   * Convertit une ligne de base de données en objet Product
   * @param row - Ligne de la base de données
   * @returns Objet Product
   */
  private mapRowToProduct(row: any): Product {
    return {
      id: row.id,
      server_id: row.server_id || undefined,
      name: row.name,
      price: row.price,
      stock_quantity: row.stock_quantity,
      expiration_date: row.expiration_date || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_deleted: row.is_deleted,
      sync_status: row.sync_status,
      user_id: row.user_id
    };
  }
}

// Export de l'instance singleton
export default ProductDAO.getInstance();

