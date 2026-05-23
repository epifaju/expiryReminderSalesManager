import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { scannerService } from './BluetoothScannerService';
import {
  BluetoothDevice,
  DEFAULT_SCANNER_PREFERENCES,
  ScannerConnectionState,
  ScannerPreferences,
} from './scannerTypes';
import {
  BLUETOOTH_DISCOVERY_TIMEOUT_MS,
  BLUETOOTH_LIST_DEVICES_TIMEOUT_MS,
  mergeBluetoothDevices,
  normalizeBluetoothMacAddress,
} from './scannerUtils';
import {
  BLUETOOTH_PERMISSION_DENIED_BT,
  BLUETOOTH_PERMISSIONS_REQUIRED,
  checkBluetoothPermissions,
  isBluetoothPermissionsRequiredError,
  openApplicationSettings,
  requestBluetoothPermissionsWithDetails,
} from './bluetoothPermissions';

export type DeviceSearchPhase = 'idle' | 'bonded' | 'discovering' | 'done' | 'error';

export interface UseBluetoothOptions {
  /** Désactivé sur l'écran Paramètres pour ne pas bloquer sur une connexion automatique. */
  autoConnectOnInit?: boolean;
  /**
   * false pour ScannerStatusBar : évite getPairedDevices() au montage
   * (sinon conflit natif avec l'écran Paramètres → loader infini).
   */
  loadDevicesOnInit?: boolean;
}

export interface UseBluetoothReturn {
  connectionState: ScannerConnectionState;
  connectedDevice: BluetoothDevice | null;
  pairedDevices: BluetoothDevice[];
  displayDevices: BluetoothDevice[];
  savedScannerMac: string | null;
  isLoadingDevices: boolean;
  isDiscovering: boolean;
  isGrantingPermissions: boolean;
  deviceSearchPhase: DeviceSearchPhase;
  devicesError: string | null;
  connect: (deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshPairedDevices: () => Promise<void>;
  discoverNearbyDevices: () => Promise<void>;
  pairDevice: (deviceId: string) => Promise<void>;
  connectByMacAddress: (macInput: string) => Promise<void>;
  grantBluetoothPermissions: () => Promise<boolean>;
  openSystemBluetoothSettings: () => void;
  openApplicationSettings: () => void;
  openPermissionsSettings: () => void;
  preferences: ScannerPreferences;
  updatePreferences: (prefs: Partial<ScannerPreferences>) => Promise<void>;
}

export function useBluetooth(options: UseBluetoothOptions = {}): UseBluetoothReturn {
  const { autoConnectOnInit = true, loadDevicesOnInit = true } = options;

  const [connectionState, setConnectionState] = useState<ScannerConnectionState>(
    scannerService.getConnectionState()
  );
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(
    scannerService.getConnectedDevice()
  );
  const [pairedDevices, setPairedDevices] = useState<BluetoothDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isGrantingPermissions, setIsGrantingPermissions] = useState(false);
  const [deviceSearchPhase, setDeviceSearchPhase] = useState<DeviceSearchPhase>('idle');
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<ScannerPreferences>({
    ...DEFAULT_SCANNER_PREFERENCES,
  });
  const loadingGuardRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchMutexRef = useRef(false);

  const clearLoadingGuard = () => {
    if (loadingGuardRef.current) {
      clearTimeout(loadingGuardRef.current);
      loadingGuardRef.current = null;
    }
  };

  const finishSearchUi = useCallback(() => {
    clearLoadingGuard();
    setIsLoadingDevices(false);
    setIsDiscovering(false);
    setIsGrantingPermissions(false);
    searchMutexRef.current = false;
  }, []);

  const runDeviceSearch = useCallback(async (options?: { bondedOnly?: boolean }) => {
    if (Platform.OS !== 'android') {
      setPairedDevices([]);
      setDevicesError(null);
      setDeviceSearchPhase('idle');
      return;
    }

    if (searchMutexRef.current) {
      return;
    }
    searchMutexRef.current = true;

    clearLoadingGuard();
    setIsLoadingDevices(true);
    setDevicesError(null);
    setDeviceSearchPhase('bonded');

    const guardMs =
      BLUETOOTH_LIST_DEVICES_TIMEOUT_MS +
      (options?.bondedOnly ? 0 : BLUETOOTH_DISCOVERY_TIMEOUT_MS) +
      3000;

    loadingGuardRef.current = setTimeout(() => {
      finishSearchUi();
      setDeviceSearchPhase('error');
      setDevicesError('Délai dépassé — réessayez ou ouvrez les paramètres Bluetooth Android');
    }, guardMs);

    try {
      const hasPermission = await checkBluetoothPermissions();
      if (!hasPermission) {
        setPairedDevices([]);
        setDevicesError(BLUETOOTH_PERMISSIONS_REQUIRED);
        setDeviceSearchPhase('error');
        return;
      }

      const bonded = await scannerService.getPairedDevices();
      let devices = bonded;

      if (!options?.bondedOnly && bonded.length === 0) {
        setDeviceSearchPhase('discovering');
        setIsDiscovering(true);
        try {
          const discovered = await scannerService.discoverDevices();
          devices = mergeBluetoothDevices(bonded, discovered);
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : 'Recherche Bluetooth impossible';
          setDevicesError(message);
          setDeviceSearchPhase('error');
          setPairedDevices([]);
          return;
        } finally {
          setIsDiscovering(false);
        }
      }

      setPairedDevices(devices);
      const prefs = await scannerService.loadPreferences();
      const hasSavedMac = Boolean(prefs.favoriteDeviceId);

      if (devices.length === 0 && !hasSavedMac) {
        setDevicesError('NO_DEVICES');
        setDeviceSearchPhase('done');
      } else {
        setDevicesError(null);
        setDeviceSearchPhase('done');
      }
    } catch (error: unknown) {
      setPairedDevices([]);
      if (isBluetoothPermissionsRequiredError(error)) {
        setDevicesError(BLUETOOTH_PERMISSIONS_REQUIRED);
      } else {
        const message = error instanceof Error ? error.message : 'Erreur Bluetooth';
        setDevicesError(message);
      }
      setDeviceSearchPhase('error');
    } finally {
      finishSearchUi();
    }
  }, [finishSearchUi]);

  const refreshPairedDevices = useCallback(async () => {
    await runDeviceSearch();
  }, [runDeviceSearch]);

  const pairDevice = useCallback(async (deviceId: string) => {
    const device = await scannerService.pairDevice(deviceId);
    setPairedDevices((current) => mergeBluetoothDevices(current, [device]));
    setDevicesError(null);
    setDeviceSearchPhase('done');
  }, []);

  const discoverNearbyDevices = useCallback(async () => {
    if (Platform.OS !== 'android' || searchMutexRef.current) {
      return;
    }

    searchMutexRef.current = true;
    setIsDiscovering(true);
    setDevicesError(null);
    setDeviceSearchPhase('discovering');

    try {
      const hasPermission = await checkBluetoothPermissions();
      if (!hasPermission) {
        setDevicesError(BLUETOOTH_PERMISSIONS_REQUIRED);
        setDeviceSearchPhase('error');
        return;
      }

      const discovered = await scannerService.discoverDevices();
      setPairedDevices((current) => {
        const merged = mergeBluetoothDevices(current, discovered);
        setDevicesError(merged.length === 0 ? 'NO_DEVICES' : null);
        setDeviceSearchPhase('done');
        return merged;
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur Bluetooth';
      setDevicesError(message);
      setDeviceSearchPhase('error');
    } finally {
      setIsDiscovering(false);
      searchMutexRef.current = false;
    }
  }, []);

  const grantBluetoothPermissions = useCallback(async (): Promise<boolean> => {
    if (searchMutexRef.current) {
      return false;
    }

    setDevicesError(null);
    setIsGrantingPermissions(true);

    try {
      const { granted, mustOpenSettings } = await requestBluetoothPermissionsWithDetails();
      if (!granted) {
        setDevicesError(BLUETOOTH_PERMISSION_DENIED_BT);
        setDeviceSearchPhase('error');
        if (mustOpenSettings) {
          void openApplicationSettings();
        }
        return false;
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
      await runDeviceSearch();
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur Bluetooth';
      setDevicesError(message);
      setDeviceSearchPhase('error');
      return false;
    } finally {
      setIsGrantingPermissions(false);
    }
  }, [runDeviceSearch]);

  const openSystemBluetoothSettings = useCallback(() => {
    if (Platform.OS === 'android') {
      try {
        const RNBluetoothClassic = require('react-native-bluetooth-classic').default;
        RNBluetoothClassic.openBluetoothSettings();
      } catch {
        // ignore
      }
    }
  }, []);

  const connect = useCallback(async (deviceId: string) => {
    await scannerService.connect(deviceId);
    const device = scannerService.getConnectedDevice();
    const favoriteId = device?.id ?? deviceId;
    setConnectedDevice(device);
    setConnectionState(scannerService.getConnectionState());
    await scannerService.savePreferences({ favoriteDeviceId: favoriteId });
    setPreferences((prev) => ({ ...prev, favoriteDeviceId: favoriteId }));
    setDevicesError(null);
    if (device) {
      setPairedDevices((current) => mergeBluetoothDevices(current, [device]));
    }
  }, []);

  const connectByMacAddress = useCallback(
    async (macInput: string) => {
      const address = normalizeBluetoothMacAddress(macInput);
      await connect(address);
    },
    [connect]
  );

  const disconnect = useCallback(async () => {
    await scannerService.disconnect();
    setConnectedDevice(scannerService.getConnectedDevice());
    setConnectionState(scannerService.getConnectionState());
  }, []);

  const updatePreferences = useCallback(async (prefs: Partial<ScannerPreferences>) => {
    await scannerService.savePreferences(prefs);
    const loaded = await scannerService.loadPreferences();
    setPreferences(loaded);
  }, []);

  const savedScannerMac = preferences.favoriteDeviceId;

  const displayDevices = useMemo(() => {
    const extras: BluetoothDevice[] = [];
    if (savedScannerMac) {
      extras.push({
        id: savedScannerMac,
        name: connectedDevice?.id === savedScannerMac ? connectedDevice.name : savedScannerMac,
        bonded: false,
      });
    }
    if (connectedDevice) {
      extras.push(connectedDevice);
    }
    return mergeBluetoothDevices(pairedDevices, extras);
  }, [pairedDevices, savedScannerMac, connectedDevice]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const loaded = await scannerService.loadPreferences();
      if (!mounted) {
        return;
      }

      setPreferences(loaded);
      setConnectionState(scannerService.getConnectionState());
      setConnectedDevice(scannerService.getConnectedDevice());

      if (loadDevicesOnInit) {
        await runDeviceSearch();
      }

      if (
        autoConnectOnInit &&
        Platform.OS === 'android' &&
        loaded.autoReconnect &&
        loaded.favoriteDeviceId
      ) {
        void scannerService.autoConnectFavorite().then(() => {
          if (!mounted) {
            return;
          }
          setConnectionState(scannerService.getConnectionState());
          setConnectedDevice(scannerService.getConnectedDevice());
        });
      }
    };

    void init();

    const unsubscribeState = scannerService.onStateChange((state) => {
      if (!mounted) {
        return;
      }
      setConnectionState(state);
      setConnectedDevice(scannerService.getConnectedDevice());
    });

    return () => {
      mounted = false;
      clearLoadingGuard();
      unsubscribeState();
    };
  }, [autoConnectOnInit, loadDevicesOnInit, runDeviceSearch]);

  return {
    connectionState,
    connectedDevice,
    pairedDevices,
    displayDevices,
    savedScannerMac,
    isLoadingDevices,
    isDiscovering,
    isGrantingPermissions,
    deviceSearchPhase,
    devicesError,
    connect,
    disconnect,
    refreshPairedDevices,
    discoverNearbyDevices,
    pairDevice,
    connectByMacAddress,
    grantBluetoothPermissions,
    openSystemBluetoothSettings,
    openApplicationSettings,
    openPermissionsSettings: openApplicationSettings,
    preferences,
    updatePreferences,
  };
};
