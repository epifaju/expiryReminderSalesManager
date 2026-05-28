import { Product } from './models';

/**
 * Produit local SQLite enrichi pour le flux scanner (PRD §8).
 */
export interface LocalProduct extends Product {
  barcode?: string | null;
  category?: string | null;
}
