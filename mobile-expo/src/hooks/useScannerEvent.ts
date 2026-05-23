import { useCallback, useEffect, useRef, useState } from 'react';
import { scannerService } from '../bluetooth/BluetoothScannerService';
import { ScanEvent } from '../bluetooth/scannerTypes';
import { isValidBarcode, normalizeBarcode } from '../bluetooth/scannerUtils';
import productDAO from '../dao/ProductDAO';
import { applyScannerSqlMigrations } from '../database/scannerSqlMigrations';
import authService from '../services/authService';
import { LocalProduct } from '../types/localProduct';

export interface UseScannerEventOptions {
  onProductFound: (product: LocalProduct) => void;
  onProductNotFound: (barcode: string) => void;
  onScanError?: (error: string) => void;
  /** Permet de désactiver l'écoute (ex. écran non focalisé). */
  enabled?: boolean;
}

export interface UseScannerEventReturn {
  lastScan: ScanEvent | null;
  isScanning: boolean;
}

/**
 * Point d'entrée POS : écoute les scans Bluetooth et résout le produit en SQLite local.
 * PRD §8 — ne modifie pas le state des écrans parents (callbacks uniquement).
 */
export function useScannerEvent(options: UseScannerEventOptions): UseScannerEventReturn {
  const { enabled = true } = options;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [lastScan, setLastScan] = useState<ScanEvent | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const resolveScan = useCallback(async (event: ScanEvent) => {
    const { onProductFound, onProductNotFound, onScanError } = optionsRef.current;
    const barcode = normalizeBarcode(event.barcode);

    if (!isValidBarcode(barcode)) {
      if (__DEV__) {
        console.debug('[useScannerEvent] Barcode ignoré:', event.barcode);
      }
      return;
    }

    setLastScan(event);
    setIsScanning(true);
    console.log('[useScannerEvent] Scan reçu:', barcode);

    try {
      await applyScannerSqlMigrations();

      const user = authService.getUser();
      const userId = user ? String(user.id) : undefined;
      const product = await productDAO.findByBarcode(barcode, userId);

      if (product) {
        onProductFound(product);
      } else {
        onProductNotFound(barcode);
      }
    } catch (error: any) {
      const message = error?.message || 'Erreur lors de la recherche produit';
      console.error('[useScannerEvent]', message, error);
      onScanError?.(message);
    } finally {
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const unsubscribe = scannerService.onScan((event) => {
      void resolveScan(event);
    });

    return unsubscribe;
  }, [enabled, resolveScan]);

  return { lastScan, isScanning };
}
