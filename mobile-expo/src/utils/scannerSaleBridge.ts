import { LocalProduct } from '../types/localProduct';
import { barcodesEquivalent } from '../bluetooth/gs1BarcodeParser';

/** Produit format écran ventes (API). */
export interface SaleCartProduct {
  id: number;
  name: string;
  sellingPrice: number;
  stockQuantity: number;
  category: string;
  unit: string;
  barcode: string;
}

/**
 * Associe un produit SQLite local à un produit du catalogue API (par code-barres ou server_id).
 */
export function resolveSaleProductFromLocal(
  local: LocalProduct,
  apiProducts: SaleCartProduct[]
): SaleCartProduct | null {
  if (local.server_id) {
    const byServerId = apiProducts.find((p) => p.id === local.server_id);
    if (byServerId) {
      return byServerId;
    }
  }

  if (local.barcode) {
    const byBarcode = apiProducts.find(
      (p) => p.barcode && barcodesEquivalent(p.barcode, local.barcode!)
    );
    if (byBarcode) {
      return byBarcode;
    }
  }

  return null;
}

export function mapLocalToSaleProduct(local: LocalProduct): SaleCartProduct {
  return {
    id: local.server_id ?? 0,
    name: local.name,
    sellingPrice: local.price,
    stockQuantity: local.stock_quantity,
    category: '',
    unit: 'pcs',
    barcode: local.barcode ?? '',
  };
}
