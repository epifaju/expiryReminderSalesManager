import apiClient from '../apiClient';
import authService from '../authService';
import productDAO from '../../dao/ProductDAO';
import DatabaseService from '../database/DatabaseService';
import { applyScannerSqlMigrations } from '../../database/scannerSqlMigrations';
import { Product } from '../../types/models';

export interface PendingProductRow extends Product {
  barcode?: string | null;
}

export interface PendingProductSyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

/**
 * Synchronise les produits SQLite créés offline (sync_status = pending) vers l'API.
 * PRD Bloc 6 — ne modifie pas ProductService existant.
 */
class PendingProductSyncService {
  private syncing = false;

  async getPendingProducts(userId: string): Promise<PendingProductRow[]> {
    await applyScannerSqlMigrations();

    const result = await DatabaseService.executeSql(
      `SELECT * FROM products
       WHERE user_id = ? AND sync_status = 'pending' AND is_deleted = 0
       ORDER BY created_at ASC`,
      [userId]
    );

    const products: PendingProductRow[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      products.push({
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
        user_id: row.user_id,
        barcode: row.barcode ?? null,
      });
    }
    return products;
  }

  async syncAll(): Promise<PendingProductSyncResult> {
    if (this.syncing) {
      return { synced: 0, failed: 0, errors: ['Synchronisation déjà en cours'] };
    }

    const user = authService.getUser();
    if (!user) {
      return { synced: 0, failed: 0, errors: ['Utilisateur non connecté'] };
    }

    if (!authService.getToken()) {
      return { synced: 0, failed: 0, errors: ['Jeton API absent'] };
    }

    this.syncing = true;
    const result: PendingProductSyncResult = { synced: 0, failed: 0, errors: [] };

    try {
      const pending = await this.getPendingProducts(String(user.id));

      for (const local of pending) {
        try {
          await this.syncOne(local);
          result.synced += 1;
        } catch (error: any) {
          result.failed += 1;
          result.errors.push(`${local.name}: ${error?.message || 'Erreur'}`);
        }
      }
    } finally {
      this.syncing = false;
    }

    return result;
  }

  private async syncOne(local: PendingProductRow): Promise<void> {
    if (!local.barcode?.trim()) {
      throw new Error('Code-barres manquant');
    }

    const sellingPrice = Number(local.price);
    const payload = {
      name: local.name,
      barcode: local.barcode.trim(),
      unit: 'pcs',
      purchasePrice: sellingPrice,
      sellingPrice,
      stockQuantity: local.stock_quantity ?? 0,
      minStockLevel: 0,
      isActive: true,
      expiryDate: local.expiration_date || undefined,
    };

    const response = await apiClient.post('/products', payload);
    const serverId = response.data?.id ?? response.data?.data?.id;

    if (!serverId) {
      throw new Error('Réponse serveur sans identifiant produit');
    }

    await productDAO.updateSyncStatus(local.id, 'synced', Number(serverId));
  }
}

export const pendingProductSyncService = new PendingProductSyncService();
export default pendingProductSyncService;
