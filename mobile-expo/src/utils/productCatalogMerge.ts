import { barcodesEquivalent } from '../bluetooth/gs1BarcodeParser';
import { Product as ApiProduct } from '../services/productService';
import { LocalProduct } from '../types/localProduct';

/** Produit affiché dans la liste : API et/ou copie SQLite non encore sur le serveur. */
export type CatalogProduct = ApiProduct & {
  localSqliteId?: string;
  syncPending?: boolean;
};

export function localProductToCatalogItem(local: LocalProduct): CatalogProduct {
  const syncedOnServer = local.sync_status === 'synced' && local.server_id;
  return {
    id: syncedOnServer ? local.server_id! : 0,
    localSqliteId: typeof local.id === 'string' ? local.id : String(local.id),
    syncPending: !syncedOnServer,
    name: local.name,
    description: local.description ?? undefined,
    barcode: local.barcode ?? undefined,
    category: local.category ?? undefined,
    unit: 'pcs',
    purchasePrice:
      local.purchase_price != null ? Number(local.purchase_price) : Number(local.price),
    sellingPrice: Number(local.price),
    stockQuantity: Number(local.stock_quantity ?? 0),
    minStockLevel: 0,
    expiryDate: local.expiration_date,
    isActive: true,
  };
}

/**
 * Fusionne le catalogue API (organisation courante) avec les produits SQLite actifs
 * non encore présents côté serveur (même logique que le scan Bluetooth).
 */
export function mergeApiAndLocalProducts(
  apiProducts: ApiProduct[],
  localProducts: LocalProduct[]
): CatalogProduct[] {
  const merged: CatalogProduct[] = [...apiProducts];
  const apiIds = new Set(apiProducts.map((p) => p.id));
  const apiBarcodes = new Set(
    apiProducts
      .map((p) => p.barcode?.trim())
      .filter((b): b is string => Boolean(b))
  );

  for (const local of localProducts) {
    if (local.server_id && apiIds.has(local.server_id)) {
      continue;
    }
    if (local.barcode?.trim()) {
      const trimmed = local.barcode.trim();
      const alreadyListed = [...apiBarcodes].some((apiBc) =>
        barcodesEquivalent(apiBc, trimmed)
      );
      if (alreadyListed) {
        continue;
      }
    }

    // server_id SQLite obsolète (autre org / supprimé côté API) → afficher en local
    const normalizedLocal: LocalProduct =
      local.server_id && !apiIds.has(local.server_id)
        ? { ...local, server_id: undefined, sync_status: 'pending' }
        : local;

    merged.push(localProductToCatalogItem(normalizedLocal));
  }

  return merged.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export function isLocalOnlyCatalogProduct(product: CatalogProduct): boolean {
  return Boolean(product.syncPending && product.localSqliteId);
}
