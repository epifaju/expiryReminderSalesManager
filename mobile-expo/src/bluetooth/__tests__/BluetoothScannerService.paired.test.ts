import { Platform } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import { scannerService } from '../BluetoothScannerService';
import { checkBluetoothPermissionsWithTimeout } from '../bluetoothPermissions';
import { fetchBondedDevicesFromNative } from '../bondedDevicesNative';

jest.mock('react-native-bluetooth-classic', () => ({
  __esModule: true,
  default: {
    isBluetoothAvailable: jest.fn().mockResolvedValue(true),
    isBluetoothEnabled: jest.fn().mockResolvedValue(true),
    getBondedDevices: jest.fn().mockResolvedValue([
      {
        address: 'AA:BB:CC:DD:EE:01',
        id: 'AA:BB:CC:DD:EE:01',
        name: 'Scanner Test',
        bonded: true,
      },
      {
        address: 'AA:BB:CC:DD:EE:02',
        id: 'AA:BB:CC:DD:EE:02',
        name: 'Scanner 2',
        bonded: true,
      },
    ]),
    connectToDevice: jest.fn(),
  },
}));

jest.mock('../bluetoothPermissions', () => ({
  checkBluetoothPermissionsWithTimeout: jest.fn().mockResolvedValue(true),
  checkBluetoothPermissions: jest.fn().mockResolvedValue(true),
  requestBluetoothPermissions: jest.fn().mockResolvedValue(true),
  ensureLocationForBluetoothDiscovery: jest.fn().mockResolvedValue(true),
  BLUETOOTH_PERMISSIONS_REQUIRED: 'PERMISSIONS_REQUIRED',
}));

jest.mock('../bondedDevicesNative', () => ({
  fetchBondedDevicesFromNative: jest.fn().mockResolvedValue([
    {
      id: 'AA:BB:CC:DD:EE:01',
      name: 'Scanner Test',
      bonded: true,
    },
    {
      id: 'AA:BB:CC:DD:EE:02',
      name: 'Scanner 2',
      bonded: true,
    },
  ]),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

describe('BluetoothScannerService.getPairedDevices', () => {
  beforeAll(() => {
    Platform.OS = 'android';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    scannerService.destroy();
  });

  it('retourne la liste des appareils appairés mappés', async () => {
    const devices = await scannerService.getPairedDevices();

    expect(checkBluetoothPermissionsWithTimeout).toHaveBeenCalled();
    expect(RNBluetoothClassic.isBluetoothAvailable).toHaveBeenCalled();
    expect(RNBluetoothClassic.isBluetoothEnabled).toHaveBeenCalled();
    expect(fetchBondedDevicesFromNative).toHaveBeenCalled();

    expect(devices).toHaveLength(2);
    expect(devices[0]).toEqual({
      id: 'AA:BB:CC:DD:EE:01',
      name: 'Scanner Test',
      bonded: true,
    });
    expect(devices[1].id).toBe('AA:BB:CC:DD:EE:02');
  });

  it('échoue si les permissions sont refusées', async () => {
    (checkBluetoothPermissionsWithTimeout as jest.Mock).mockResolvedValueOnce(false);

    await expect(scannerService.getPairedDevices()).rejects.toThrow('PERMISSIONS_REQUIRED');
  });
});
