import React from 'react';
import { useScannerEvent } from '../../hooks/useScannerEvent';
import { getScanCallbacks, ScanCallbackSource } from '../../hooks/scannerBridge';

interface AppScannerHostProps {
  enabled: boolean;
  source: ScanCallbackSource;
}

/**
 * Écoute les scans Bluetooth au niveau app.
 * Les callbacks métier sont fournis par l'écran actif via scannerBridge.
 */
const AppScannerHost: React.FC<AppScannerHostProps> = ({ enabled, source }) => {
  useScannerEvent({
    enabled,
    onBarcodeResolved: (barcode, local) => {
      const callbacks = getScanCallbacks(source);
      if (!callbacks) {
        return;
      }
      if (callbacks.onBarcodeResolved) {
        callbacks.onBarcodeResolved(barcode, local);
        return;
      }
      if (local) {
        callbacks.onProductFound?.(local);
      } else {
        callbacks.onProductNotFound?.(barcode);
      }
    },
    onScanError: (message) => {
      getScanCallbacks(source)?.onScanError?.(message);
    },
  });

  return null;
};

export default AppScannerHost;
