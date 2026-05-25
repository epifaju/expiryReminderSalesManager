import { LocalProduct } from '../types/localProduct';

export type ScanCallbackSource = 'sales' | 'products';

export interface ScanCallbacks {
  onProductFound?: (product: LocalProduct) => void;
  onProductNotFound?: (barcode: string) => void;
  onScanError?: (error: string) => void;
  /** Un seul appel par scan (recommandé pour les ventes). */
  onBarcodeResolved?: (barcode: string, localProduct: LocalProduct | null) => void;
}

const callbacksBySource: Partial<Record<ScanCallbackSource, ScanCallbacks>> = {};

export function registerScanCallbacks(
  source: ScanCallbackSource,
  callbacks: ScanCallbacks | null
): void {
  if (callbacks) {
    callbacksBySource[source] = callbacks;
  } else {
    delete callbacksBySource[source];
  }
}

export function getScanCallbacks(source: ScanCallbackSource): ScanCallbacks | null {
  return callbacksBySource[source] ?? null;
}

/** @deprecated Use registerScanCallbacks('sales', ...) */
export function registerSalesScanCallbacks(callbacks: ScanCallbacks | null): void {
  registerScanCallbacks('sales', callbacks);
}

/** @deprecated Use getScanCallbacks('sales') */
export function getSalesScanCallbacks(): ScanCallbacks | null {
  return getScanCallbacks('sales');
}

export type SalesScanCallbacks = ScanCallbacks;
