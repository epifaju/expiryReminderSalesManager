/**
 * Workflow Bloc 4 (logique pure) : scan → résolution panier / création rapide.
 */
import { resolveSaleProductFromLocal } from '../../utils/scannerSaleBridge';
import { LocalProduct } from '../../types/localProduct';

describe('sales scanner workflow', () => {
  const catalog = [
    {
      id: 10,
      name: 'Pain',
      sellingPrice: 2,
      stockQuantity: 5,
      category: '',
      unit: 'pcs',
      barcode: '5901234123457',
    },
  ];

  it('scan → produit trouvé (SQLite + API) → id panier valide', () => {
    const local: LocalProduct = {
      id: 'sqlite-1',
      name: 'Pain',
      price: 2,
      stock_quantity: 5,
      barcode: '5901234123457',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
      is_deleted: 0,
      sync_status: 'synced',
      user_id: '1',
      server_id: 10,
    };

    const cartProduct = resolveSaleProductFromLocal(local, catalog);
    expect(cartProduct?.id).toBe(10);
    expect(cartProduct?.name).toBe('Pain');
  });

  it('scan → produit inconnu → pas de résolution panier avant création', () => {
    const cartProduct = resolveSaleProductFromLocal(
      {
        id: 'new-local',
        name: 'Nouveau',
        price: 3,
        stock_quantity: 1,
        barcode: '1111111111111',
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
        is_deleted: 0,
        sync_status: 'pending',
        user_id: '1',
      },
      catalog
    );
    expect(cartProduct).toBeNull();
  });

  it('après création locale avec server_id → panier possible', () => {
    const afterCreate: LocalProduct = {
      id: 'new-local',
      name: 'Nouveau',
      price: 3,
      stock_quantity: 1,
      barcode: '1111111111111',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
      is_deleted: 0,
      sync_status: 'pending',
      user_id: '1',
      server_id: 99,
    };

    const extendedCatalog = [
      ...catalog,
      {
        id: 99,
        name: 'Nouveau',
        sellingPrice: 3,
        stockQuantity: 1,
        category: '',
        unit: 'pcs',
        barcode: '1111111111111',
      },
    ];

    expect(resolveSaleProductFromLocal(afterCreate, extendedCatalog)?.id).toBe(99);
  });
});
