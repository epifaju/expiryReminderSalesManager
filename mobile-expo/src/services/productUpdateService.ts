import productService, { Product, ProductRequest } from './productService';
import productDAO from '../dao/ProductDAO';
import authService from './authService';
import { pendingProductSyncService, PendingProductRow } from './scanner/PendingProductSyncService';
import { updateLocalFromProductRequest } from './scanner/scannerProductRepository';
import { CatalogProduct, isLocalOnlyCatalogProduct } from '../utils/productCatalogMerge';
import { applyScannerSqlMigrations } from '../database/scannerSqlMigrations';
import { LocalProduct } from '../types/localProduct';

function isNotFoundError(error: unknown): boolean {
  const message = String((error as Error)?.message ?? '');
  return (
    message.includes('404') ||
    message.includes('introuvable') ||
    message.includes('non trouvé')
  );
}

function toPendingRow(local: LocalProduct, barcode?: string): PendingProductRow {
  return {
    id: local.id,
    server_id: local.server_id,
    name: local.name,
    price: local.price,
    purchase_price: local.purchase_price ?? null,
    description: local.description ?? null,
    stock_quantity: local.stock_quantity,
    expiration_date: local.expiration_date,
    created_at: local.created_at,
    updated_at: local.updated_at,
    is_deleted: local.is_deleted,
    sync_status: local.sync_status,
    user_id: local.user_id,
    barcode: barcode ?? local.barcode ?? null,
  };
}

async function syncLocalThenUpdateApi(
  localId: string,
  payload: ProductRequest,
  userId: string
): Promise<Product> {
  const local = await updateLocalFromProductRequest(localId, payload, userId);

  const serverId = await pendingProductSyncService.syncLocalProduct(
    toPendingRow(local, payload.barcode)
  );

  if (serverId > 0) {
    try {
      return await productService.updateProduct(serverId, payload);
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }
      return await productService.getProductById(serverId);
    }
  }

  throw new Error('Synchronisation serveur impossible');
}

async function resolveLocalId(
  localSqliteId: string | undefined,
  barcode?: string
): Promise<string | null> {
  if (localSqliteId) {
    return localSqliteId;
  }
  if (!barcode?.trim()) {
    return null;
  }
  await applyScannerSqlMigrations();
  const found = await productDAO.findByBarcodeForUpsert(barcode.trim());
  return found?.id ?? null;
}

/**
 * Enregistre une modification produit : API si l'id serveur est valide,
 * sinon resynchronise depuis SQLite (id obsolète / autre organisation).
 */
export async function saveProductUpdate(
  selected: CatalogProduct | Product,
  payload: ProductRequest
): Promise<Product> {
  const user = authService.getUser();
  if (!user) {
    throw new Error('Non authentifié');
  }
  const userId = String(user.id);
  const catalog = selected as CatalogProduct;

  if (isLocalOnlyCatalogProduct(catalog) || !selected.id) {
    const localId = await resolveLocalId(catalog.localSqliteId, payload.barcode);
    if (!localId) {
      return productService.createProduct(payload);
    }
    return syncLocalThenUpdateApi(localId, payload, userId);
  }

  try {
    return await productService.updateProduct(selected.id, payload);
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error;
    }

    const localId = await resolveLocalId(catalog.localSqliteId, payload.barcode);
    if (localId) {
      await productDAO.resetServerLink(localId);
      return syncLocalThenUpdateApi(localId, payload, userId);
    }

    try {
      return await productService.createProduct(payload);
    } catch (createError: unknown) {
      const message = String((createError as Error)?.message ?? '');
      if (message.includes('409') && payload.barcode?.trim()) {
        const existing = await productService.findByBarcode(payload.barcode.trim());
        if (existing?.id) {
          return productService.updateProduct(existing.id, payload);
        }
      }
      throw createError;
    }
  }
}
