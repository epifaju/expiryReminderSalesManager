jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

const mockExecuteSql = jest.fn();

jest.mock('../../services/database/DatabaseService', () => ({
  __esModule: true,
  default: {
    executeSql: (...args: unknown[]) => mockExecuteSql(...args),
  },
}));

import productDAO from '../ProductDAO';

describe('ProductDAO.findByBarcode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retourne null si le barcode est vide', async () => {
    const result = await productDAO.findByBarcode('   ');
    expect(result).toBeNull();
    expect(mockExecuteSql).not.toHaveBeenCalled();
  });

  it('retourne le produit avec barcode quand trouvé', async () => {
    mockExecuteSql.mockResolvedValue({
      rows: {
        length: 1,
        item: (index: number) =>
          index === 0
            ? {
                id: 'uuid-1',
                name: 'Pain',
                price: 250,
                stock_quantity: 20,
                expiration_date: null,
                created_at: '2025-01-01T00:00:00.000Z',
                updated_at: '2025-01-01T00:00:00.000Z',
                is_deleted: 0,
                sync_status: 'pending',
                user_id: 'user-1',
                barcode: '5901234123457',
              }
            : undefined,
      },
    });

    const product = await productDAO.findByBarcode('5901234123457', 'user-1');

    expect(mockExecuteSql).toHaveBeenCalledWith(
      expect.stringContaining('WHERE barcode = ?'),
      ['5901234123457', 'user-1']
    );
    expect(product).toMatchObject({
      id: 'uuid-1',
      name: 'Pain',
      barcode: '5901234123457',
    });
  });

  it('retourne null si aucune ligne', async () => {
    mockExecuteSql.mockResolvedValue({
      rows: { length: 0, item: jest.fn() },
    });

    const product = await productDAO.findByBarcode('00000000');
    expect(product).toBeNull();
  });
});
