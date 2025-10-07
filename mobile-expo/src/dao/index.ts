/**
 * Point d'entrée pour tous les DAO (Data Access Objects)
 * Export centralisé de toutes les classes DAO
 */

// Export des classes DAO
export { ProductDAO } from './ProductDAO';
export { SaleDAO } from './SaleDAO';
export { StockMovementDAO } from './StockMovementDAO';

// Export des instances singleton (recommandé pour l'utilisation)
export { default as productDAO } from './ProductDAO';
export { default as saleDAO } from './SaleDAO';
export { default as stockMovementDAO } from './StockMovementDAO';

// Type pour faciliter l'utilisation
export type DAOInstance = typeof import('./ProductDAO').default;

