import { NativeModules, Platform } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import { BluetoothDevice } from './scannerTypes';
import { normalizeBluetoothMacAddress } from './scannerUtils';

type RawBondedDevice = {
  address?: string;
  id?: string;
  name?: string;
  bonded?: boolean;
};

function mapRawBondedDevice(device: RawBondedDevice): BluetoothDevice | null {
  const rawAddress = device.address || device.id;
  if (!rawAddress) {
    return null;
  }
  let id = rawAddress;
  try {
    id = normalizeBluetoothMacAddress(rawAddress);
  } catch {
    id = rawAddress.toUpperCase();
  }
  return {
    id,
    name: device.name?.trim() || id,
    bonded: Boolean(device.bonded ?? true),
  };
}

/**
 * Lit les appareils appairés via le module natif dédié (permissions Android 12+),
 * avec repli sur react-native-bluetooth-classic.
 */
export async function fetchBondedDevicesFromNative(): Promise<BluetoothDevice[]> {
  if (Platform.OS !== 'android') {
    return [];
  }

  const nativeModule = NativeModules.BluetoothBondedDevices as
    | { getBondedDevices: () => Promise<RawBondedDevice[]> }
    | undefined;

  if (nativeModule?.getBondedDevices) {
    try {
      const raw = await nativeModule.getBondedDevices();
      return raw.map(mapRawBondedDevice).filter((d): d is BluetoothDevice => d !== null);
    } catch {
      // Repli bibliothèque ci-dessous
    }
  }

  const bonded = await RNBluetoothClassic.getBondedDevices();
  return bonded
    .map((device) =>
      mapRawBondedDevice({
        address: device.address,
        id: device.id,
        name: device.name,
        bonded: device.bonded,
      })
    )
    .filter((d): d is BluetoothDevice => d !== null);
}
