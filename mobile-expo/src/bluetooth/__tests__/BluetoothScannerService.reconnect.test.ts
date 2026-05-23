import { Platform } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import { scannerService } from '../BluetoothScannerService';

jest.useFakeTimers();

jest.mock('react-native-bluetooth-classic', () => {
  const mockDevice = {
    address: 'AA:BB:CC:DD:EE:01',
    id: 'AA:BB:CC:DD:EE:01',
    name: 'Netum Scanner',
    bonded: true,
    isConnected: jest.fn(),
    available: jest.fn().mockResolvedValue(0),
    read: jest.fn().mockResolvedValue(''),
    onDataReceived: jest.fn(() => ({ remove: jest.fn() })),
    onDisconnected: jest.fn(() => ({ remove: jest.fn() })),
    disconnect: jest.fn().mockResolvedValue(undefined),
  };

  return {
    __esModule: true,
    default: {
      isBluetoothAvailable: jest.fn().mockResolvedValue(true),
      isBluetoothEnabled: jest.fn().mockResolvedValue(true),
      getBondedDevices: jest.fn().mockResolvedValue([mockDevice]),
      connectToDevice: jest.fn().mockResolvedValue(mockDevice),
      onDeviceRead: jest.fn(() => ({ remove: jest.fn() })),
      availableFromDevice: jest.fn().mockResolvedValue(0),
      readFromDevice: jest.fn().mockResolvedValue(''),
    },
  };
});

jest.mock('../bluetoothPermissions', () => ({
  checkBluetoothPermissions: jest.fn().mockResolvedValue(true),
  checkBluetoothPermissionsWithTimeout: jest.fn().mockResolvedValue(true),
  ensureLocationForBluetoothDiscovery: jest.fn().mockResolvedValue(true),
}));

jest.mock('../bondedDevicesNative', () => ({
  fetchBondedDevicesFromNative: jest.fn().mockResolvedValue([]),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(
    JSON.stringify({
      favoriteDeviceId: 'AA:BB:CC:DD:EE:01',
      autoReconnect: true,
      scanSuffix: 'CRLF',
      soundEnabled: true,
      vibrationEnabled: true,
    })
  ),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

describe('BluetoothScannerService reconnexion (PRD §6 règle 3)', () => {
  beforeAll(() => {
    Platform.OS = 'android';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    scannerService.destroy();
    jest.clearAllTimers();
  });

  it('planifie une reconnexion après perte de connexion', async () => {
    const device = await RNBluetoothClassic.connectToDevice('AA:BB:CC:DD:EE:01', {
      connectorType: 'rfcomm',
      connectionType: 'delimited',
      delimiter: '',
      charset: 'utf-8',
    });
    (device.isConnected as jest.Mock)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    await scannerService.loadPreferences();
    await scannerService.connect('AA:BB:CC:DD:EE:01');

    jest.advanceTimersByTime(3000);
    await Promise.resolve();

    jest.advanceTimersByTime(5000);
    await Promise.resolve();

    expect(RNBluetoothClassic.connectToDevice).toHaveBeenCalledTimes(2);
  });
});
