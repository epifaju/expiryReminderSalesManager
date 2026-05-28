import { mergeApiAndLocalProducts, localProductToCatalogItem } from '../productCatalogMerge';
import { LocalProduct } from '../../types/localProduct';

const api = [
  {
    id: 1,
    name: 'API Product',
    unit: 'pcs',
    purchasePrice: 1,
    sellingPrice: 2,
    stockQuantity: 10,
    minStockLevel: 0,
    barcode: '111',
  },
];

const localPending: LocalProduct = {
  id: 'local-uuid',
  name: 'SQLite Only',
  price: 3,
  stock_quantity: 5,
  barcode: '222',
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
  is_deleted: 0,
  sync_status: 'pending',
  user_id: '5',
};

describe('productCatalogMerge', () => {
  it('ajoute les produits locaux absents de l’API', () => {
    const merged = mergeApiAndLocalProducts(api, [localPending]);
    expect(merged).toHaveLength(2);
    expect(merged.find((p) => p.name === 'SQLite Only')?.syncPending).toBe(true);
  });

  it('n’ajoute pas un local déjà présent par server_id', () => {
    const localSynced: LocalProduct = { ...localPending, server_id: 1, sync_status: 'synced' };
    const merged = mergeApiAndLocalProducts(api, [localSynced]);
    expect(merged).toHaveLength(1);
  });

  it('localProductToCatalogItem marque syncPending sans server_id', () => {
    const item = localProductToCatalogItem(localPending);
    expect(item.id).toBe(0);
    expect(item.syncPending).toBe(true);
    expect(item.localSqliteId).toBe('local-uuid');
  });

  it('n’expose pas un server_id obsolète si sync pending', () => {
    const stale: LocalProduct = {
      ...localPending,
      server_id: 99,
      sync_status: 'pending',
    };
    const item = localProductToCatalogItem(stale);
    expect(item.id).toBe(0);
    expect(item.syncPending).toBe(true);
  });

  it('réduit un server_id absent du catalogue API en produit local', () => {
    const stale: LocalProduct = {
      ...localPending,
      server_id: 8,
      sync_status: 'synced',
    };
    const merged = mergeApiAndLocalProducts(api, [stale]);
    const item = merged.find((p) => p.localSqliteId === 'local-uuid');
    expect(item?.id).toBe(0);
    expect(item?.syncPending).toBe(true);
  });
});
