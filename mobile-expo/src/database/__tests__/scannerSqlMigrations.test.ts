const mockExecuteSql = jest.fn();
const mockInitDatabase = jest.fn().mockResolvedValue(undefined);
const mockIsInitialized = jest.fn(() => true);

jest.mock('../../services/database/DatabaseService', () => ({
  __esModule: true,
  default: {
    executeSql: (...args: unknown[]) => mockExecuteSql(...args),
    initDatabase: () => mockInitDatabase(),
    isInitialized: () => mockIsInitialized(),
  },
}));

import { applyScannerSqlMigrations, resetScannerMigrationsCache } from '../scannerSqlMigrations';

describe('scannerSqlMigrations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetScannerMigrationsCache();
    mockIsInitialized.mockReturnValue(true);

    mockExecuteSql.mockImplementation(async (query: string) => {
      if (query.includes('sqlite_master')) {
        return { rows: { length: 1, item: () => ({ name: 'scanner_schema_migrations' }) } };
      }
      if (query.includes('PRAGMA table_info')) {
        return { rows: { length: 0, item: () => ({}) } };
      }
      if (query.includes('scanner_schema_migrations') && query.includes('SELECT')) {
        return { rows: { length: 0, item: () => ({}) } };
      }
      return { rows: { length: 0, item: () => ({}) } };
    });
  });

  it('applique les migrations barcode et tables scanner', async () => {
    await applyScannerSqlMigrations();

    const queries = mockExecuteSql.mock.calls.map((call) => String(call[0]));
    expect(queries.some((q) => q.includes('ALTER TABLE products ADD COLUMN barcode'))).toBe(true);
    expect(queries.some((q) => q.includes('idx_products_barcode'))).toBe(true);
    expect(queries.some((q) => q.includes('CREATE TABLE IF NOT EXISTS scanner_preferences'))).toBe(
      true
    );
    expect(queries.some((q) => q.includes('CREATE TABLE IF NOT EXISTS scan_history'))).toBe(true);
  });
});
