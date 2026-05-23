import { LocalProduct } from '../types/localProduct';

export interface SalesScanCallbacks {
  onProductFound: (product: LocalProduct) => void;
  onProductNotFound: (barcode: string) => void;
  onScanError?: (error: string) => void;
}

let activeCallbacks: SalesScanCallbacks | null = null;

export function registerSalesScanCallbacks(callbacks: SalesScanCallbacks | null): void {
  activeCallbacks = callbacks;
}

export function getSalesScanCallbacks(): SalesScanCallbacks | null {
  return activeCallbacks;
}
