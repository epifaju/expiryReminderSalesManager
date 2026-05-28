import DatabaseService from '../database/DatabaseService';
import { generateUuid } from '../../utils/generateId';
import { applyScannerSqlMigrations } from '../../database/scannerSqlMigrations';
import { LocalProduct } from '../../types/localProduct';
import { QuickProductFormData } from '../../components/bluetooth/UnknownBarcodeModal';
import productDAO from '../../dao/ProductDAO';
import { ProductRequest } from '../productService';
import { clampProductText, PRODUCT_TEXT_LIMITS } from '../../database/productSql';

/**
 * Création rapide d'un produit en SQLite (sync_status pending) — PRD §10.
 */
export async function createQuickProduct(
  data: QuickProductFormData,
  userId: string
): Promise<LocalProduct> {
  await applyScannerSqlMigrations();

  const existing = await productDAO.findByBarcodeForUpsert(data.barcode);
  const now = new Date().toISOString();

  // Si le barcode existe déjà localement, on met à jour (idempotent) au lieu de planter en UNIQUE.
  const name = clampProductText(data.name, PRODUCT_TEXT_LIMITS.name)!;
  const description = clampProductText(data.description, PRODUCT_TEXT_LIMITS.description);
  const category = clampProductText(data.category, PRODUCT_TEXT_LIMITS.category);
  const barcode = clampProductText(data.barcode, PRODUCT_TEXT_LIMITS.barcode)!;

  if (existing?.id) {
    await DatabaseService.executeSql(
      `UPDATE products SET
        name = ?,
        description = ?,
        purchase_price = ?,
        price = ?,
        stock_quantity = ?,
        category = ?,
        expiration_date = ?,
        updated_at = ?,
        user_id = ?,
        is_deleted = 0,
        sync_status = 'pending'
      WHERE id = ?`,
      [
        name,
        description,
        data.purchasePrice,
        data.sellingPrice,
        data.stockQuantity,
        category,
        data.expiryDate || null,
        now,
        userId,
        existing.id,
      ]
    );

    return {
      ...existing,
      name,
      description,
      purchase_price: data.purchasePrice,
      price: data.sellingPrice,
      stock_quantity: data.stockQuantity,
      category: category ?? undefined,
      expiration_date: data.expiryDate,
      updated_at: now,
      is_deleted: 0,
      sync_status: 'pending',
      user_id: userId,
      barcode,
    };
  }

  const id = generateUuid();
  await DatabaseService.executeSql(
    `INSERT INTO products (
      id, name, description, purchase_price, price, stock_quantity, category, expiration_date,
      created_at, updated_at, is_deleted, sync_status, user_id, barcode
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending', ?, ?)`,
    [
      id,
      name,
      description,
      data.purchasePrice,
      data.sellingPrice,
      data.stockQuantity,
      category,
      data.expiryDate || null,
      now,
      now,
      userId,
      barcode,
    ]
  );

  return {
    id,
    name,
    description,
    purchase_price: data.purchasePrice,
    price: data.sellingPrice,
    stock_quantity: data.stockQuantity,
    category: category ?? undefined,
    expiration_date: data.expiryDate,
    created_at: now,
    updated_at: now,
    is_deleted: 0,
    sync_status: 'pending',
    user_id: userId,
    barcode,
  };
}

/** Met à jour une ligne SQLite à partir d'un ProductRequest (formulaire complet). */
export async function updateLocalFromProductRequest(
  localId: string,
  payload: ProductRequest,
  userId: string
): Promise<LocalProduct> {
  await applyScannerSqlMigrations();
  const now = new Date().toISOString();
  const name = clampProductText(payload.name, PRODUCT_TEXT_LIMITS.name)!;
  const description = clampProductText(payload.description, PRODUCT_TEXT_LIMITS.description);
  const category = clampProductText(payload.category, PRODUCT_TEXT_LIMITS.category);
  const barcode = clampProductText(payload.barcode, PRODUCT_TEXT_LIMITS.barcode);

  await DatabaseService.executeSql(
    `UPDATE products SET
      name = ?,
      description = ?,
      purchase_price = ?,
      price = ?,
      stock_quantity = ?,
      category = ?,
      expiration_date = ?,
      barcode = ?,
      updated_at = ?,
      user_id = ?,
      sync_status = 'pending',
      server_id = NULL
    WHERE id = ?`,
    [
      name,
      description,
      payload.purchasePrice,
      payload.sellingPrice,
      payload.stockQuantity,
      category,
      payload.expiryDate || null,
      barcode,
      now,
      userId,
      localId,
    ]
  );

  return {
    id: localId,
    name,
    description,
    purchase_price: payload.purchasePrice,
    price: payload.sellingPrice,
    stock_quantity: payload.stockQuantity,
    category,
    expiration_date: payload.expiryDate,
    barcode,
    created_at: now,
    updated_at: now,
    is_deleted: 0,
    sync_status: 'pending',
    server_id: undefined,
    user_id: userId,
  };
}
