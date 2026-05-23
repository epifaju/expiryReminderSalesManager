import React from 'react';
import { useScannerEvent } from '../../hooks/useScannerEvent';
import { getSalesScanCallbacks } from '../../hooks/scannerSaleBridge';

interface SalesScannerHostProps {
  enabled: boolean;
}

/**
 * Écoute les scans Bluetooth au niveau app (toujours monté sur l'onglet Ventes).
 * Les callbacks métier sont fournis par SalesScreen via scannerSaleBridge.
 */
const SalesScannerHost: React.FC<SalesScannerHostProps> = ({ enabled }) => {
  useScannerEvent({
    enabled,
    onProductFound: (local) => {
      getSalesScanCallbacks()?.onProductFound(local);
    },
    onProductNotFound: (barcode) => {
      getSalesScanCallbacks()?.onProductNotFound(barcode);
    },
    onScanError: (message) => {
      getSalesScanCallbacks()?.onScanError?.(message);
    },
  });

  return null;
};

export default SalesScannerHost;
