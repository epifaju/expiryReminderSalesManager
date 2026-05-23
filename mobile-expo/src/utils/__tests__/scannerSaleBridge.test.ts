import { resolveSaleProductFromLocal, mapLocalToSaleProduct } from '../scannerSaleBridge';
import { LocalProduct } from '../../types/localProduct';

const apiCatalog = [
  {
    id: 42,
    name: 'Coca API',
    sellingPrice: 1.5,
    stockQuantity: 100,
    category: 'Boissons',
    unit: 'pcs',
    barcode: '1234567890123',
  },
];

const localWithBarcode: LocalProduct = {
  id: 'local-1',
  name: 'Coca local',
  price: 1.5,
  stock_quantity: 10,
  barcode: '1234567890123',
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
  is_deleted: 0,
  sync_status: 'synced',
  user_id: '1',
};

describe('scannerSaleBridge', () => {
  it('résout un produit local par code-barres vers le catalogue API', () => {
    const resolved = resolveSaleProductFromLocal(localWithBarcode, apiCatalog);
    expect(resolved).toEqual(apiCatalog[0]);
  });

  it('résout par server_id si présent', () => {
    const local: LocalProduct = { ...localWithBarcode, server_id: 42, barcode: '999' };
    const resolved = resolveSaleProductFromLocal(local, apiCatalog);
    expect(resolved?.id).toBe(42);
  });

  it('retourne null si produit local sans correspondance API', () => {
    const local: LocalProduct = {
      ...localWithBarcode,
      barcode: '0000000000000',
      server_id: undefined,
    };
    expect(resolveSaleProductFromLocal(local, apiCatalog)).toBeNull();
  });

  it('mapLocalToSaleProduct expose les champs panier', () => {
    const mapped = mapLocalToSaleProduct({ ...localWithBarcode, server_id: 7 });
    expect(mapped.id).toBe(7);
    expect(mapped.sellingPrice).toBe(1.5);
    expect(mapped.barcode).toBe('1234567890123');
  });
});
