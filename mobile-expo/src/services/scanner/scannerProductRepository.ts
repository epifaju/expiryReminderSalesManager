import DatabaseService from '../database/DatabaseService';
import { generateUuid } from '../../utils/generateId';
import { applyScannerSqlMigrations } from '../../database/scannerSqlMigrations';
import { LocalProduct } from '../../types/localProduct';
import { QuickProductFormData } from '../../components/bluetooth/UnknownBarcodeModal';
import productDAO from '../../dao/ProductDAO';

/**
 * Création rapide d'un produit en SQLite (sync_status pending) — PRD §10.
 */
export async function createQuickProduct(
  data: QuickProductFormData,
  userId: string
): Promise<LocalProduct> {
  await applyScannerSqlMigrations();

  const existing = await productDAO.findByBarcode(data.barcode, userId);
  const now = new Date().toISOString();

  // Si le barcode existe déjà localement, on met à jour (idempotent) au lieu de planter en UNIQUE.
  if (existing?.id) {
    await DatabaseService.executeSql(
      `UPDATE products SET
        name = ?,
        price = ?,
        stock_quantity = ?,
        category = ?,
        expiration_date = ?,
        updated_at = ?,
        is_deleted = 0,
        sync_status = 'pending'
      WHERE id = ?`,
      [
        data.name.trim(),
        data.sellingPrice,
        data.stockQuantity,
        data.category?.trim() || null,
        data.expiryDate || null,
        now,
        existing.id,
      ]
    );

    return {
      ...existing,
      name: data.name.trim(),
      price: data.sellingPrice,
      stock_quantity: data.stockQuantity,
      category: data.category?.trim() || undefined,
      expiration_date: data.expiryDate,
      updated_at: now,
      is_deleted: 0,
      sync_status: 'pending',
      user_id: userId,
      barcode: data.barcode,
    };
  }

  const id = generateUuid();
  await DatabaseService.executeSql(
    `INSERT INTO products (
      id, name, price, stock_quantity, category, expiration_date,
      created_at, updated_at, is_deleted, sync_status, user_id, barcode
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending', ?, ?)`,
    [
      id,
      data.name.trim(),
      data.sellingPrice,
      data.stockQuantity,
      data.category?.trim() || null,
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
    category: data.category?.trim() || undefined,
    expiration_date: data.expiryDate,
    created_at: now,
    updated_at: now,
    is_deleted: 0,
    sync_status: 'pending',
    user_id: userId,
    barcode: data.barcode,
  };
}
