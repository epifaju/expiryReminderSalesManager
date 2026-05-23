import DatabaseService from '../database/DatabaseService';
import { generateUuid } from '../../utils/generateId';
import { applyScannerSqlMigrations } from '../../database/scannerSqlMigrations';
import { LocalProduct } from '../../types/localProduct';
import { QuickProductFormData } from '../../components/bluetooth/UnknownBarcodeModal';

/**
 * Création rapide d'un produit en SQLite (sync_status pending) — PRD §10.
 */
export async function createQuickProduct(
  data: QuickProductFormData,
  userId: string
): Promise<LocalProduct> {
  await applyScannerSqlMigrations();

  const id = generateUuid();
  const now = new Date().toISOString();

  await DatabaseService.executeSql(
    `INSERT INTO products (
      id, name, price, stock_quantity, expiration_date,
      created_at, updated_at, is_deleted, sync_status, user_id, barcode
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'pending', ?, ?)`,
    [
      id,
      data.name.trim(),
      data.sellingPrice,
      data.stockQuantity,
      data.expiryDate || null,
      now,
      now,
      userId,
      data.barcode,
    ]
  );

  return {
    id,
    name: data.name.trim(),
    price: data.sellingPrice,
    stock_quantity: data.stockQuantity,
    expiration_date: data.expiryDate,
    created_at: now,
    updated_at: now,
    is_deleted: 0,
    sync_status: 'pending',
    user_id: userId,
    barcode: data.barcode,
  };
}
