import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useScannerEvent } from '../useScannerEvent';
import { scannerService } from '../../bluetooth/BluetoothScannerService';
import productDAO from '../../dao/ProductDAO';
import { applyScannerSqlMigrations } from '../../database/scannerSqlMigrations';

jest.mock('../../bluetooth/BluetoothScannerService', () => ({
  scannerService: {
    onScan: jest.fn(),
  },
}));

jest.mock('../../dao/ProductDAO', () => ({
  __esModule: true,
  default: {
    findByBarcode: jest.fn(),
  },
}));

jest.mock('../../database/scannerSqlMigrations', () => ({
  applyScannerSqlMigrations: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../services/authService', () => ({
  __esModule: true,
  default: {
    getUser: jest.fn(() => ({ id: 1, username: 'admin' })),
  },
}));

describe('useScannerEvent', () => {
  let scanHandler: ((event: { barcode: string; timestamp: number; deviceId: string }) => void) | null =
    null;

  beforeEach(() => {
    scanHandler = null;
    jest.clearAllMocks();
    (scannerService.onScan as jest.Mock).mockImplementation((handler) => {
      scanHandler = handler;
      return jest.fn();
    });
  });

  const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

  it('appelle onProductFound quand le produit existe en SQLite', async () => {
    const onProductFound = jest.fn();
    const onProductNotFound = jest.fn();

    const mockProduct = {
      id: 'p1',
      name: 'Lait',
      price: 500,
      stock_quantity: 10,
      barcode: '1234567890123',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
      is_deleted: 0,
      sync_status: 'pending' as const,
      user_id: '1',
    };

    (productDAO.findByBarcode as jest.Mock).mockResolvedValue(mockProduct);

    function Probe() {
      useScannerEvent({ onProductFound, onProductNotFound });
      return null;
    }

    act(() => {
      TestRenderer.create(<Probe />);
    });

    await act(async () => {
      scanHandler?.({
        barcode: '1234567890123',
        timestamp: Date.now(),
        deviceId: 'AA:BB:CC:DD:EE:FF',
      });
      await flushPromises();
    });

    expect(applyScannerSqlMigrations).toHaveBeenCalled();
    expect(productDAO.findByBarcode).toHaveBeenCalledWith('1234567890123', '1');
    expect(onProductFound).toHaveBeenCalledWith(mockProduct);
    expect(onProductNotFound).not.toHaveBeenCalled();
  });

  it('appelle onProductNotFound quand aucun produit ne correspond', async () => {
    const onProductFound = jest.fn();
    const onProductNotFound = jest.fn();

    (productDAO.findByBarcode as jest.Mock).mockResolvedValue(null);

    function Probe() {
      useScannerEvent({ onProductFound, onProductNotFound });
      return null;
    }

    act(() => {
      TestRenderer.create(<Probe />);
    });

    await act(async () => {
      scanHandler?.({
        barcode: '9999999999999',
        timestamp: Date.now(),
        deviceId: 'AA:BB:CC:DD:EE:FF',
      });
      await flushPromises();
    });

    expect(onProductNotFound).toHaveBeenCalledWith('9999999999999');
    expect(onProductFound).not.toHaveBeenCalled();
  });
});
