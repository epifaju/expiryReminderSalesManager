import { LocalProduct } from '../types/localProduct';

export interface SalesScanCallbacks {
  onProductFound: (product: LocalProduct) => void;
  onProductNotFound: (barcode: string) => void;
  onScanError?: (error: string) => void;
}

export {
  registerScanCallbacks,
  getScanCallbacks,
  registerSalesScanCallbacks,
  getSalesScanCallbacks,
} from './scannerBridge';

export type { ScanCallbacks, ScanCallbackSource } from './scannerBridge';
