import apiClient from '../apiClient';
import authService from '../authService';
import productService from '../productService';
import productDAO from '../../dao/ProductDAO';
import DatabaseService from '../database/DatabaseService';
import { applyScannerSqlMigrations } from '../../database/scannerSqlMigrations';
import { productSelectSql } from '../../database/productSql';
import { Product } from '../../types/models';

export interface PendingProductRow extends Product {
  barcode?: string | null;
  purchase_price?: number | null;
  description?: string | null;
}

function mapSqlRowToPending(row: Record<string, unknown>): PendingProductRow {
  return {
    id: String(row.id),
    server_id: row.server_id ? Number(row.server_id) : undefined,
    name: String(row.name),
    price: Number(row.price),
    purchase_price: row.purchase_price != null ? Number(row.purchase_price) : null,
    description: row.description != null ? String(row.description) : null,
    stock_quantity: Number(row.stock_quantity),
    expiration_date: row.expiration_date ? String(row.expiration_date) : undefined,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    is_deleted: Number(row.is_deleted),
    sync_status: row.sync_status as Product['sync_status'],
    user_id: String(row.user_id),
    barcode: row.barcode != null ? String(row.barcode) : null,
  };
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
      `${productSelectSql("WHERE user_id = ? AND sync_status = 'pending' AND is_deleted = 0 ORDER BY created_at ASC")}`,
      [userId]
    );

    const products: PendingProductRow[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      products.push(mapSqlRowToPending(result.rows.item(i)));
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

  /**
   * Synchronise un produit local vers l'organisation courante (JWT).
   * Si le lien serveur est obsolète (autre org), on repasse en pending puis POST.
   */
  async syncLocalProduct(local: PendingProductRow): Promise<number> {
    const user = authService.getUser();
    if (!user || !authService.getToken()) {
      throw new Error('Non authentifié');
    }

    let row = local;

    if (row.barcode?.trim()) {
      const onServer = await productService.findByBarcode(row.barcode.trim());
      if (onServer?.id) {
        if (row.server_id !== onServer.id) {
          await productDAO.updateSyncStatus(row.id, 'synced', Number(onServer.id));
        }
        return onServer.id;
      }
    }

    if (row.server_id) {
      const stillValid = await this.isServerProductReachable(row.server_id);
      if (!stillValid) {
        await productDAO.resetServerLink(row.id);
        row = { ...row, server_id: undefined, sync_status: 'pending' };
      } else if (row.sync_status !== 'pending') {
        return row.server_id;
      }
    }

    if (row.sync_status !== 'pending') {
      return row.server_id ?? 0;
    }

    const serverId = await this.syncOne(row);
    return serverId;
  }

  private async getLocalById(id: string): Promise<PendingProductRow | null> {
    const result = await DatabaseService.executeSql(
      `${productSelectSql('WHERE id = ? AND is_deleted = 0 LIMIT 1')}`,
      [id]
    );
    if (result.rows.length === 0) {
      return null;
    }
    return mapSqlRowToPending(result.rows.item(0));
  }

  private async isServerProductReachable(serverId: number): Promise<boolean> {
    try {
      const p = await productService.getProductById(serverId);
      return Boolean(p?.id);
    } catch {
      return false;
    }
  }

  async syncOne(local: PendingProductRow): Promise<number> {
    if (!local.barcode?.trim()) {
      throw new Error('Code-barres manquant');
    }

    const sellingPrice = Number(local.price);
    const purchasePrice =
      local.purchase_price != null && !Number.isNaN(Number(local.purchase_price))
        ? Number(local.purchase_price)
        : sellingPrice;
    const payload = {
      name: local.name,
      description: local.description?.trim() || undefined,
      barcode: local.barcode.trim(),
      unit: 'pcs',
      purchasePrice,
      sellingPrice,
      stockQuantity: local.stock_quantity ?? 0,
      minStockLevel: 0,
      isActive: true,
      expiryDate: local.expiration_date || undefined,
    };

    try {
      const response = await apiClient.post('/products', payload);
      const serverId = response.data?.id ?? response.data?.data?.id;

      if (!serverId) {
        throw new Error('Réponse serveur sans identifiant produit');
      }

      await productDAO.updateSyncStatus(local.id, 'synced', Number(serverId));
      return Number(serverId);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error(
          'Création produit refusée (droits insuffisants). Reconnectez-vous ou demandez un compte Manager/Admin.'
        );
      }
      if (status === 409 && local.barcode?.trim()) {
        const linked = await this.linkLocalToExistingServerProduct(local, local.barcode.trim());
        if (linked) {
          const found = await productService.findByBarcode(local.barcode.trim());
          return found?.id ?? 0;
        }
      }
      throw error;
    }
  }

  private async linkLocalToExistingServerProduct(
    local: PendingProductRow,
    barcode: string
  ): Promise<boolean> {
    const found = await productService.findByBarcode(barcode);
    if (!found?.id) {
      return false;
    }
    await productDAO.updateSyncStatus(local.id, 'synced', Number(found.id));
    return true;
  }
}

export const pendingProductSyncService = new PendingProductSyncService();
export default pendingProductSyncService;
