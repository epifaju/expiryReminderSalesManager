import { pendingProductSyncService } from '../PendingProductSyncService';
import apiClient from '../../apiClient';
import authService from '../../authService';
import productDAO from '../../../dao/ProductDAO';
import DatabaseService from '../../database/DatabaseService';

jest.mock('../../apiClient', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

jest.mock('../../authService', () => ({
  __esModule: true,
  default: {
    getUser: jest.fn(() => ({ id: 1, username: 'admin' })),
    getToken: jest.fn(() => 'token'),
  },
}));

jest.mock('../../../dao/ProductDAO', () => ({
  __esModule: true,
  default: {
    updateSyncStatus: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../database/DatabaseService', () => ({
  __esModule: true,
  default: {
    executeSql: jest.fn(),
  },
}));

jest.mock('../../../database/scannerSqlMigrations', () => ({
  applyScannerSqlMigrations: jest.fn().mockResolvedValue(undefined),
}));

describe('PendingProductSyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('pousse les produits pending vers l’API et marque synced', async () => {
    (DatabaseService.executeSql as jest.Mock).mockResolvedValue({
      rows: {
        length: 1,
        item: (i: number) =>
          i === 0
            ? {
                id: 'local-1',
                name: 'Riz 5kg',
                price: 5000,
                stock_quantity: 10,
                barcode: '6194001234567',
                expiration_date: null,
                created_at: '2025-01-01',
                updated_at: '2025-01-01',
                is_deleted: 0,
                sync_status: 'pending',
                user_id: '1',
              }
            : null,
      },
    });

    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: 99 } });

    const result = await pendingProductSyncService.syncAll();

    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/products',
      expect.objectContaining({ barcode: '6194001234567', name: 'Riz 5kg' })
    );
    expect(productDAO.updateSyncStatus).toHaveBeenCalledWith('local-1', 'synced', 99);
  });

  it('ignore si non authentifié', async () => {
    (authService.getUser as jest.Mock).mockReturnValueOnce(null);
    const result = await pendingProductSyncService.syncAll();
    expect(result.synced).toBe(0);
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
