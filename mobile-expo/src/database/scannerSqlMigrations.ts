import DatabaseService from '../services/database/DatabaseService';

const MIGRATION_VERSION_KEY = 'scanner_schema_version';

let migrationsApplied = false;

async function tableExists(tableName: string): Promise<boolean> {
  const result = await DatabaseService.executeSql(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    [tableName]
  );
  return result.rows.length > 0;
}

async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const result = await DatabaseService.executeSql(`PRAGMA table_info(${tableName})`);
  for (let i = 0; i < result.rows.length; i++) {
    if (result.rows.item(i).name === columnName) {
      return true;
    }
  }
  return false;
}

async function getAppliedVersion(): Promise<number> {
  if (!(await tableExists('scanner_schema_migrations'))) {
    return 0;
  }
  const result = await DatabaseService.executeSql(
    `SELECT version FROM scanner_schema_migrations WHERE id = ?`,
    [MIGRATION_VERSION_KEY]
  );
  if (result.rows.length === 0) {
    return 0;
  }
  return Number(result.rows.item(0).version) || 0;
}

async function setAppliedVersion(version: number): Promise<void> {
  await DatabaseService.executeSql(`
    CREATE TABLE IF NOT EXISTS scanner_schema_migrations (
      id TEXT PRIMARY KEY,
      version INTEGER NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await DatabaseService.executeSql(
    `INSERT OR REPLACE INTO scanner_schema_migrations (id, version, applied_at)
     VALUES (?, ?, datetime('now'))`,
    [MIGRATION_VERSION_KEY, version]
  );
}

/** Migration 001 — colonne barcode + index (PRD §13). */
async function migration001(): Promise<void> {
  if (!(await columnExists('products', 'barcode'))) {
    await DatabaseService.executeSql(`ALTER TABLE products ADD COLUMN barcode TEXT`);
  }

  await DatabaseService.executeSql(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)
    WHERE barcode IS NOT NULL
  `);
}

/** Migration 002 — table préférences scanner (PRD §13). */
async function migration002(): Promise<void> {
  await DatabaseService.executeSql(`
    CREATE TABLE IF NOT EXISTS scanner_preferences (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

/** Migration 003 — historique des scans (PRD §13, MVP V2). */
async function migration003(): Promise<void> {
  await DatabaseService.executeSql(`
    CREATE TABLE IF NOT EXISTS scan_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT NOT NULL,
      product_id TEXT,
      scan_result TEXT NOT NULL,
      context TEXT NOT NULL,
      device_id TEXT,
      scanned_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await DatabaseService.executeSql(`
    CREATE INDEX IF NOT EXISTS idx_scan_history_barcode ON scan_history(barcode)
  `);

  await DatabaseService.executeSql(`
    CREATE INDEX IF NOT EXISTS idx_scan_history_date ON scan_history(scanned_at)
  `);
}

/** Migration 004 — colonne category pour pré-remplissage modal. */
async function migration004(): Promise<void> {
  if (!(await columnExists('products', 'category'))) {
    await DatabaseService.executeSql(`ALTER TABLE products ADD COLUMN category TEXT`);
  }
}

/**
 * Applique les migrations scanner (idempotentes). N'altère pas DatabaseService.
 */
export async function applyScannerSqlMigrations(): Promise<void> {
  if (migrationsApplied) {
    return;
  }

  if (!DatabaseService.isInitialized()) {
    await DatabaseService.initDatabase();
  }

  let version = await getAppliedVersion();

  if (version < 1) {
    await migration001();
    version = 1;
    await setAppliedVersion(version);
  }

  if (version < 2) {
    await migration002();
    version = 2;
    await setAppliedVersion(version);
  }

  if (version < 3) {
    await migration003();
    version = 3;
    await setAppliedVersion(version);
  }

  if (version < 4) {
    await migration004();
    version = 4;
    await setAppliedVersion(version);
  }

  migrationsApplied = true;
}

/** Réinitialise le cache (tests uniquement). */
export function resetScannerMigrationsCache(): void {
  migrationsApplied = false;
}
