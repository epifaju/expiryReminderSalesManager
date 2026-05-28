import productDAO from '../dao/ProductDAO';
import productService, { Product } from './productService';
import {
  CatalogProduct,
  isLocalOnlyCatalogProduct,
  localProductToCatalogItem,
} from '../utils/productCatalogMerge';
import { LocalProduct } from '../types/localProduct';
import { applyScannerSqlMigrations } from '../database/scannerSqlMigrations';

async function resolveLocalCatalogProduct(
  catalog: CatalogProduct
): Promise<CatalogProduct | null> {
  await applyScannerSqlMigrations();

  if (catalog.localSqliteId) {
    const row = await productDAO.getById(catalog.localSqliteId);
    if (row) {
      return localProductToCatalogItem({
        ...(row as LocalProduct),
        barcode: (row as LocalProduct).barcode ?? catalog.barcode ?? null,
        category: (row as LocalProduct).category ?? catalog.category ?? null,
        description:
          (row as LocalProduct).description ?? catalog.description ?? null,
        purchase_price:
          (row as LocalProduct).purchase_price ?? catalog.purchasePrice ?? null,
      });
    }
  }

  if (catalog.barcode?.trim()) {
    const found = await productDAO.findByBarcode(catalog.barcode);
    if (found) {
      return localProductToCatalogItem(found);
    }
  }

  return null;
}

/**
 * Charge le détail produit : API si l'id est valide dans l'org courante,
 * sinon données SQLite (lien serveur obsolète / produit local).
 */
export async function loadProductDetail(catalog: CatalogProduct): Promise<{
  product: CatalogProduct;
  refreshFailed: boolean;
}> {
  if (isLocalOnlyCatalogProduct(catalog) || !catalog.id) {
    const fromLocal = await resolveLocalCatalogProduct(catalog);
    return { product: fromLocal ?? catalog, refreshFailed: false };
  }

  const fresh: Product | null = await productService.getProductByIdOptional(catalog.id);
  if (fresh) {
    return {
      product: {
        ...fresh,
        localSqliteId: catalog.localSqliteId,
        syncPending: false,
      },
      refreshFailed: false,
    };
  }

  const fromLocal = await resolveLocalCatalogProduct(catalog);
  if (fromLocal) {
    return { product: fromLocal, refreshFailed: true };
  }

  return { product: catalog, refreshFailed: true };
}
