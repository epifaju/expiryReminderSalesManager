import { Platform } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import { scannerService } from '../BluetoothScannerService';

jest.mock('react-native-bluetooth-classic', () => {
  const mockDevice = {
    address: 'AA:BB:CC:DD:EE:01',
    id: 'AA:BB:CC:DD:EE:01',
    name: 'BarCode Scanner SPP',
    bonded: true,
    isConnected: jest.fn().mockResolvedValue(true),
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
      connectToDevice: jest.fn().mockResolvedValue(mockDevice),
      onDeviceRead: jest.fn(() => ({ remove: jest.fn() })),
      availableFromDevice: jest.fn().mockResolvedValue(0),
      readFromDevice: jest.fn().mockResolvedValue(''),
      __mockDevice: mockDevice,
    },
  };
});

jest.mock('../bluetoothPermissions', () => ({
  checkBluetoothPermissions: jest.fn().mockResolvedValue(true),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

const getMockDevice = () =>
  (RNBluetoothClassic as unknown as { __mockDevice: { available: jest.Mock; read: jest.Mock } })
    .__mockDevice;

const flushAsync = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('BluetoothScannerService scan emission', () => {
  beforeAll(() => {
    Platform.OS = 'android';
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    getMockDevice().available.mockResolvedValue(0);
    getMockDevice().read.mockResolvedValue('');
    getMockDevice().isConnected.mockResolvedValue(true);
    try {
      await scannerService.disconnect();
    } catch {
      // ignore
    }
  });

  afterEach(async () => {
    try {
      await scannerService.disconnect();
    } catch {
      // ignore
    }
  });

  it('émet un ScanEvent via la boucle read() (message sans suffixe)', async () => {
    const onScan = jest.fn();
    scannerService.onScan(onScan);
    await scannerService.connect('AA:BB:CC:DD:EE:01');
    await flushAsync();

    getMockDevice().available.mockResolvedValue(1);
    getMockDevice().read.mockResolvedValue('5901234123457');

    await new Promise<void>((resolve) => setTimeout(resolve, 200));
    await flushAsync();

    expect(onScan).toHaveBeenCalledWith(
      expect.objectContaining({ barcode: '5901234123457' })
    );
    expect(RNBluetoothClassic.connectToDevice).toHaveBeenCalledWith(
      'AA:BB:CC:DD:EE:01',
      expect.objectContaining({
        connectorType: 'rfcomm',
        connectionType: 'delimited',
        delimiter: '',
        charset: 'utf-8',
      })
    );
    expect(getMockDevice().onDataReceived).toHaveBeenCalled();
  });

  it('segmente un flux CRLF via le parser si read renvoie des fragments', async () => {
    const onScan = jest.fn();
    scannerService.onScan(onScan);
    await scannerService.connect('AA:BB:CC:DD:EE:01');
    await flushAsync();

    getMockDevice().available.mockResolvedValue(1);
    getMockDevice().read.mockResolvedValue('1111111111111\r\n');

    await new Promise<void>((resolve) => setTimeout(resolve, 200));
    await flushAsync();

    expect(onScan).toHaveBeenCalledWith(
      expect.objectContaining({ barcode: '1111111111111' })
    );
  });
});
