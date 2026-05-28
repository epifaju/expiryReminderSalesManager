/** Colonnes produit lues/écrites en SQLite (évite SELECT * et CursorWindow overflow). */

export const PRODUCT_TEXT_LIMITS = {
  name: 255,
  description: 500,
  barcode: 128,
  category: 128,
} as const;

export const PRODUCT_COLUMNS =
  'id, server_id, name, price, purchase_price, description, stock_quantity, expiration_date, category, barcode, created_at, updated_at, is_deleted, sync_status, user_id';

export function productSelectSql(whereClause = ''): string {
  return `SELECT ${PRODUCT_COLUMNS} FROM products${whereClause ? ` ${whereClause}` : ''}`;
}

export function clampProductText(
  value: string | null | undefined,
  maxLen: number
): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}
