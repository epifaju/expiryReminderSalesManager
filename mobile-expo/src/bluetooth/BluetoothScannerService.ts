import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNBluetoothClassic, {
  BluetoothDevice as NativeBluetoothDevice,
  BluetoothDeviceReadEvent,
  BluetoothEventSubscription,
} from 'react-native-bluetooth-classic';
import { ScannerParser } from './ScannerParser';
import {
  BLUETOOTH_PERMISSIONS_REQUIRED,
  checkBluetoothPermissionsWithTimeout,
  checkBluetoothPermissions,
  ensureLocationForBluetoothDiscovery,
} from './bluetoothPermissions';
import { fetchBondedDevicesFromNative } from './bondedDevicesNative';
import {
  BluetoothDevice,
  DEFAULT_SCANNER_PREFERENCES,
  RECONNECT_INTERVAL_MS,
  RECONNECT_MAX_ATTEMPTS,
  RECONNECT_PAUSE_MS,
  SCANNER_PREFERENCES_STORAGE_KEY,
  ScanEvent,
  ScannerConnectionState,
  ScannerPreferences,
  ScanListener,
  StateChangeListener,
  Unsubscribe,
} from './scannerTypes';
import {
  ScanDebouncer,
  isValidBarcode,
  normalizeBarcode,
  withTimeout,
  BLUETOOTH_LIST_DEVICES_TIMEOUT_MS,
  BLUETOOTH_CONNECT_TIMEOUT_MS,
  BLUETOOTH_NATIVE_STEP_TIMEOUT_MS,
  BLUETOOTH_DISCOVERY_TIMEOUT_MS,
  mergeBluetoothDevices,
  normalizeBluetoothMacAddress,
} from './scannerUtils';

class SimpleEventEmitter {
  private scanListeners = new Set<ScanListener>();
  private stateListeners = new Set<StateChangeListener>();

  onScan(listener: ScanListener): Unsubscribe {
    this.scanListeners.add(listener);
    return () => this.scanListeners.delete(listener);
  }

  onStateChange(listener: StateChangeListener): Unsubscribe {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  emitScan(event: ScanEvent): void {
    const listeners = Array.from(this.scanListeners);
    setImmediate(() => {
      listeners.forEach((listener) => listener(event));
    });
  }

  emitState(state: ScannerConnectionState): void {
    const listeners = Array.from(this.stateListeners);
    setImmediate(() => {
      listeners.forEach((listener) => listener(state));
    });
  }

  clear(): void {
    this.scanListeners.clear();
    this.stateListeners.clear();
  }
}

function mapNativeDevice(device: NativeBluetoothDevice): BluetoothDevice {
  const rawAddress = device.address || device.id || '';
  let id = rawAddress;
  try {
    if (rawAddress) {
      id = normalizeBluetoothMacAddress(rawAddress);
    }
  } catch {
    id = rawAddress.toUpperCase();
  }
  return {
    id,
    name: device.name || id || 'Appareil Bluetooth',
    bonded: Boolean(device.bonded ?? true),
  };
}

function resolveDeviceAddress(deviceId: string): string {
  try {
    return normalizeBluetoothMacAddress(deviceId);
  } catch {
    return deviceId.trim();
  }
}

/** Options de connexion SPP : flux brut, segmentation côté ScannerParser (LF/CR/CRLF). */
function getSppConnectOptions(): Record<string, string> {
  return {
    connectorType: 'rfcomm',
    connectionType: 'delimited',
    delimiter: '',
    charset: 'utf-8',
  };
}

const READ_POLL_INTERVAL_MS = 80;

function collectDeviceAddresses(
  device: NativeBluetoothDevice,
  connectedId?: string | null
): string[] {
  const addresses = new Set<string>();
  const candidates = [device.address, device.id, connectedId].filter(Boolean) as string[];
  for (const raw of candidates) {
    addresses.add(raw);
    try {
      addresses.add(normalizeBluetoothMacAddress(raw));
    } catch {
      addresses.add(raw.toUpperCase());
    }
  }
  return Array.from(addresses);
}

class BluetoothScannerService {
  private connectionState: ScannerConnectionState = 'DISCONNECTED';
  private connectedDevice: BluetoothDevice | null = null;
  private preferences: ScannerPreferences = { ...DEFAULT_SCANNER_PREFERENCES };
  private readonly events = new SimpleEventEmitter();
  private readonly parser = new ScannerParser(this.preferences.scanSuffix);
  private readonly debouncer = new ScanDebouncer();
  private nativeDevice: NativeBluetoothDevice | null = null;
  private dataSubscriptions: BluetoothEventSubscription[] = [];
  private readPollTimer: ReturnType<typeof setTimeout> | null = null;
  private readLoopGeneration = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionWatchTimer: ReturnType<typeof setInterval> | null = null;
  private disconnectSubscription: BluetoothEventSubscription | null = null;
  private reconnectAttempts = 0;
  private destroyed = false;
  private userInitiatedDisconnect = false;
  private lastErrorMessage: string | null = null;
  /** Évite deux appels natifs getBondedDevices en parallèle (bloque sur certaines tablettes). */
  private pairedDevicesInflight: Promise<BluetoothDevice[]> | null = null;
  /** Une seule découverte BT à la fois (sinon blocage natif). */
  private discoveryInflight: Promise<BluetoothDevice[]> | null = null;

  getConnectionState(): ScannerConnectionState {
    return this.connectionState;
  }

  getConnectedDevice(): BluetoothDevice | null {
    return this.connectedDevice;
  }

  getLastErrorMessage(): string | null {
    return this.lastErrorMessage;
  }

  onScan(listener: ScanListener): Unsubscribe {
    return this.events.onScan(listener);
  }

  onStateChange(listener: StateChangeListener): Unsubscribe {
    return this.events.onStateChange(listener);
  }

  private setConnectionState(state: ScannerConnectionState, errorMessage?: string): void {
    this.connectionState = state;
    if (errorMessage) {
      this.lastErrorMessage = errorMessage;
    }
    this.events.emitState(state);
  }

  private assertAndroid(): void {
    if (Platform.OS !== 'android') {
      throw new Error('Bluetooth SPP scanner is only supported on Android');
    }
  }

  async getPairedDevices(): Promise<BluetoothDevice[]> {
    this.assertAndroid();

    if (this.pairedDevicesInflight) {
      return this.pairedDevicesInflight;
    }

    this.pairedDevicesInflight = withTimeout(
      this.fetchPairedDevicesUncached(),
      BLUETOOTH_LIST_DEVICES_TIMEOUT_MS,
      'Délai dépassé lors de la lecture des scanners appairés'
    ).finally(() => {
      this.pairedDevicesInflight = null;
    });

    return this.pairedDevicesInflight;
  }

  private async assertBluetoothPermissionsForList(): Promise<void> {
    const granted = await checkBluetoothPermissionsWithTimeout();
    if (!granted) {
      const error = new Error(BLUETOOTH_PERMISSIONS_REQUIRED);
      (error as Error & { code: string }).code = BLUETOOTH_PERMISSIONS_REQUIRED;
      throw error;
    }
  }

  private async ensureBluetoothReadyForAdapter(): Promise<void> {
    const available = await withTimeout(
      RNBluetoothClassic.isBluetoothAvailable(),
      BLUETOOTH_NATIVE_STEP_TIMEOUT_MS,
      'Bluetooth non disponible sur cet appareil'
    );
    if (!available) {
      this.setConnectionState('ERROR', 'Bluetooth non disponible sur cet appareil');
      throw new Error('Bluetooth non disponible sur cet appareil');
    }

    let enabled = await withTimeout(
      RNBluetoothClassic.isBluetoothEnabled(),
      BLUETOOTH_NATIVE_STEP_TIMEOUT_MS,
      'Impossible de vérifier l’état Bluetooth'
    );

    if (!enabled) {
      try {
        await withTimeout(
          RNBluetoothClassic.requestBluetoothEnabled(),
          BLUETOOTH_NATIVE_STEP_TIMEOUT_MS,
          'Activation Bluetooth annulée ou expirée'
        );
      } catch {
        // Utilisateur a refusé ou timeout — on re-vérifie une fois
      }
      enabled = await withTimeout(
        RNBluetoothClassic.isBluetoothEnabled(),
        BLUETOOTH_NATIVE_STEP_TIMEOUT_MS,
        'Impossible de vérifier l’état Bluetooth'
      );
    }

    if (!enabled) {
      this.setConnectionState('ERROR', 'Bluetooth désactivé');
      throw new Error('Bluetooth désactivé — activez-le dans les paramètres');
    }
  }

  private async fetchBondedDevices(): Promise<BluetoothDevice[]> {
    return withTimeout(
      fetchBondedDevicesFromNative(),
      BLUETOOTH_NATIVE_STEP_TIMEOUT_MS,
      'Délai dépassé lors de la lecture des scanners appairés'
    );
  }

  private async fetchPairedDevicesUncached(): Promise<BluetoothDevice[]> {
    await this.assertBluetoothPermissionsForList();
    await this.ensureBluetoothReadyForAdapter();
    return this.fetchBondedDevices();
  }

  /**
   * Recherche les appareils Bluetooth à proximité (Android).
   * À utiliser si getBondedDevices() est vide alors que le scanner est allumé.
   */
  async discoverDevices(): Promise<BluetoothDevice[]> {
    this.assertAndroid();

    if (this.discoveryInflight) {
      return this.discoveryInflight;
    }

    this.discoveryInflight = this.discoverDevicesUncached().finally(() => {
      this.discoveryInflight = null;
    });

    return this.discoveryInflight;
  }

  private async discoverDevicesUncached(): Promise<BluetoothDevice[]> {
    await this.assertBluetoothPermissionsForList();
    await ensureLocationForBluetoothDiscovery();
    await this.ensureBluetoothReadyForAdapter();

    try {
      await RNBluetoothClassic.cancelDiscovery();
    } catch {
      // ignore
    }

    try {
      const discovered = await withTimeout(
        RNBluetoothClassic.startDiscovery(),
        BLUETOOTH_DISCOVERY_TIMEOUT_MS,
        'Recherche Bluetooth expirée — réessayez'
      );
      return discovered.map(mapNativeDevice);
    } finally {
      try {
        await RNBluetoothClassic.cancelDiscovery();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Liste appairés ; si vide, recherche automatique à proximité (~25 s).
   */
  async listAvailableDevices(options?: { includeDiscovery?: boolean }): Promise<BluetoothDevice[]> {
    const bonded = await this.getPairedDevices();
    const runDiscovery =
      options?.includeDiscovery === true ||
      (options?.includeDiscovery !== false && bonded.length === 0);

    if (!runDiscovery) {
      return bonded;
    }

    const discovered = await this.discoverDevices();
    return mergeBluetoothDevices(bonded, discovered);
  }

  /** Lance l’appairage système Android pour une adresse découverte. */
  async pairDevice(deviceId: string): Promise<BluetoothDevice> {
    this.assertAndroid();
    await this.assertBluetoothPermissionsForList();
    const address = resolveDeviceAddress(deviceId);
    const native = await RNBluetoothClassic.pairDevice(address);
    return mapNativeDevice(native);
  }

  async connect(deviceId: string): Promise<void> {
    this.assertAndroid();
    await this.loadPreferences();
    this.clearReconnectTimer();
    this.userInitiatedDisconnect = false;

    const address = resolveDeviceAddress(deviceId);

    const granted = await checkBluetoothPermissions();
    if (!granted) {
      const error = new Error(BLUETOOTH_PERMISSIONS_REQUIRED);
      (error as Error & { code: string }).code = BLUETOOTH_PERMISSIONS_REQUIRED;
      this.setConnectionState('ERROR', 'Permissions Bluetooth requises');
      throw error;
    }

    this.setConnectionState('CONNECTING');

    try {
      const connectOptions = getSppConnectOptions();
      const native = await withTimeout(
        RNBluetoothClassic.connectToDevice(address, connectOptions),
        BLUETOOTH_CONNECT_TIMEOUT_MS,
        'Délai de connexion au scanner dépassé'
      );

      const connected = await native.isConnected();
      if (!connected) {
        throw new Error(`Échec de connexion au scanner ${deviceId}`);
      }

      this.nativeDevice = native;
      this.connectedDevice = mapNativeDevice(native);
      this.attachDataListener(native);
      this.attachDisconnectListener(native);
      this.startConnectionWatch();
      this.reconnectAttempts = 0;
      this.setConnectionState('CONNECTED');
      console.log(
        '[BluetoothScanner] Connecté — écoute SPP active',
        this.connectedDevice?.name,
        connectOptions
      );
    } catch (error: any) {
      await this.cleanupConnection();
      const message = error?.message || 'Échec de connexion Bluetooth';
      this.setConnectionState('ERROR', message);
      this.scheduleReconnect();
      throw new Error(message);
    }
  }

  async disconnect(): Promise<void> {
    this.userInitiatedDisconnect = true;
    this.clearReconnectTimer();
    this.stopConnectionWatch();
    await this.cleanupConnection();
    this.setConnectionState('DISCONNECTED');
  }

  /**
   * Triple écoute SPP (cf. DelimitedStringDeviceConnectionImpl) :
   * - onDataReceived : active le drainage du buffer natif
   * - onDeviceRead (module) : événement DEVICE_READ@MAC
   * - boucle read() : secours si les événements ne partent pas
   */
  private attachDataListener(device: NativeBluetoothDevice): void {
    this.detachDataListeners();
    const deviceId = this.connectedDevice?.id ?? device.address ?? '';
    const addresses = collectDeviceAddresses(device, deviceId);

    const onPayload = (payload: string, source: string): void => {
      if (!payload) {
        return;
      }
      console.log(`[BluetoothScanner] ${source}:`, JSON.stringify(payload));
      this.handleIncomingData(payload, deviceId);
    };

    const deviceWithListener = device as NativeBluetoothDevice & {
      onDataReceived?: (
        listener: (event: BluetoothDeviceReadEvent) => void
      ) => BluetoothEventSubscription;
    };

    if (typeof deviceWithListener.onDataReceived === 'function') {
      const sub = deviceWithListener.onDataReceived((event) => {
        onPayload(event?.data ?? '', 'onDataReceived');
      });
      this.dataSubscriptions.push(sub);
    }

    for (const addr of addresses) {
      try {
        const sub = RNBluetoothClassic.onDeviceRead(addr, (event) => {
          onPayload(event?.data ?? '', `onDeviceRead@${addr}`);
        });
        this.dataSubscriptions.push(sub);
      } catch (error) {
        console.warn('[BluetoothScanner] onDeviceRead impossible:', addr, error);
      }
    }

    this.startReadLoop(device, deviceId, addresses);
  }

  private detachDataListeners(): void {
    for (const sub of this.dataSubscriptions) {
      try {
        sub.remove();
      } catch {
        // ignore
      }
    }
    this.dataSubscriptions = [];
  }

  private startReadLoop(
    device: NativeBluetoothDevice,
    deviceId: string,
    addresses: string[]
  ): void {
    this.stopReadLoop();
    const generation = ++this.readLoopGeneration;

    const tick = async (): Promise<void> => {
      if (generation !== this.readLoopGeneration || !this.nativeDevice) {
        return;
      }

      for (const addr of addresses.length > 0 ? addresses : [deviceId]) {
        if (!addr) {
          continue;
        }
        try {
          let pending = 0;
          if (typeof device.available === 'function') {
            pending = await device.available();
          } else {
            pending = await RNBluetoothClassic.availableFromDevice(addr);
          }

          for (let i = 0; i < pending; i += 1) {
            let message: string | null = null;
            if (typeof device.read === 'function') {
              message = String(await device.read());
            } else {
              message = await RNBluetoothClassic.readFromDevice(addr);
            }
            if (message != null && message.length > 0) {
              console.log('[BluetoothScanner] read():', JSON.stringify(message));
              this.handleIncomingData(message, deviceId);
            }
          }
        } catch (error) {
          console.warn('[BluetoothScanner] Boucle read:', addr, error);
        }
      }

      if (generation === this.readLoopGeneration && this.nativeDevice) {
        this.readPollTimer = setTimeout(() => void tick(), READ_POLL_INTERVAL_MS);
      }
    };

    void tick();
  }

  private stopReadLoop(): void {
    this.readLoopGeneration += 1;
    if (this.readPollTimer) {
      clearTimeout(this.readPollTimer);
      this.readPollTimer = null;
    }
  }

  private attachDisconnectListener(device: NativeBluetoothDevice): void {
    this.disconnectSubscription?.remove();
    const deviceAny = device as NativeBluetoothDevice & {
      onDisconnected?: (listener: () => void) => BluetoothEventSubscription;
    };
    if (typeof deviceAny.onDisconnected === 'function') {
      this.disconnectSubscription = deviceAny.onDisconnected(() => {
        void this.handleUnexpectedDisconnect();
      });
    }
  }

  private startConnectionWatch(): void {
    this.stopConnectionWatch();
    this.connectionWatchTimer = setInterval(() => {
      void this.checkConnectionAlive();
    }, 3000);
  }

  private stopConnectionWatch(): void {
    if (this.connectionWatchTimer) {
      clearInterval(this.connectionWatchTimer);
      this.connectionWatchTimer = null;
    }
  }

  private async checkConnectionAlive(): Promise<void> {
    if (!this.nativeDevice || this.userInitiatedDisconnect || this.destroyed) {
      return;
    }
    try {
      const connected = await this.nativeDevice.isConnected();
      if (!connected) {
        await this.handleUnexpectedDisconnect();
      }
    } catch {
      await this.handleUnexpectedDisconnect();
    }
  }

  private async handleUnexpectedDisconnect(): Promise<void> {
    if (this.userInitiatedDisconnect || this.destroyed) {
      return;
    }
    if (this.connectionState === 'DISCONNECTED' && !this.nativeDevice) {
      return;
    }

    await this.cleanupConnection();
    this.setConnectionState('DISCONNECTED');
    this.scheduleReconnect();
  }

  private handleIncomingData(chunk: string, deviceId: string): void {
    const barcodes = this.parser.feed(chunk);

    if (barcodes.length === 0 && chunk.trim()) {
      const stripped = normalizeBarcode(chunk);
      if (stripped && !/[\r\n]/.test(chunk)) {
        barcodes.push(stripped);
      }
    }

    for (const raw of barcodes) {
      this.emitBarcodeScan(raw, deviceId);
    }
  }

  private emitBarcodeScan(raw: string, deviceId: string): void {
    if (!isValidBarcode(raw)) {
      if (__DEV__) {
        console.debug('[BluetoothScanner] Barcode ignoré (invalide):', raw);
      }
      return;
    }
    if (!this.debouncer.shouldAccept(raw)) {
      if (__DEV__) {
        console.debug('[BluetoothScanner] Scan ignoré (debounce):', raw);
      }
      return;
    }
    const scanEvent: ScanEvent = {
      barcode: raw,
      timestamp: Date.now(),
      deviceId,
    };
    console.log('[BluetoothScanner] Scan émis:', raw);
    this.events.emitScan(scanEvent);
  }

  async loadPreferences(): Promise<ScannerPreferences> {
    try {
      const raw = await AsyncStorage.getItem(SCANNER_PREFERENCES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ScannerPreferences>;
        this.preferences = { ...DEFAULT_SCANNER_PREFERENCES, ...parsed };
      } else {
        this.preferences = { ...DEFAULT_SCANNER_PREFERENCES };
      }
    } catch (error) {
      console.warn('[BluetoothScanner] loadPreferences fallback:', error);
      this.preferences = { ...DEFAULT_SCANNER_PREFERENCES };
    }
    this.parser.setSuffix(this.preferences.scanSuffix);
    return { ...this.preferences };
  }

  async savePreferences(prefs: Partial<ScannerPreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...prefs };
    this.parser.setSuffix(this.preferences.scanSuffix);
    await AsyncStorage.setItem(
      SCANNER_PREFERENCES_STORAGE_KEY,
      JSON.stringify(this.preferences)
    );
  }

  async autoConnectFavorite(): Promise<boolean> {
    await this.loadPreferences();
    if (!this.preferences.autoReconnect || !this.preferences.favoriteDeviceId) {
      return false;
    }
    try {
      await this.connect(this.preferences.favoriteDeviceId);
      return this.connectionState === 'CONNECTED';
    } catch {
      this.scheduleReconnect();
      return false;
    }
  }

  private scheduleReconnect(): void {
    if (this.destroyed || !this.preferences.autoReconnect || !this.preferences.favoriteDeviceId) {
      return;
    }

    this.clearReconnectTimer();

    if (this.reconnectAttempts >= RECONNECT_MAX_ATTEMPTS) {
      this.reconnectAttempts = 0;
      this.reconnectTimer = setTimeout(() => this.tryReconnect(), RECONNECT_PAUSE_MS);
      return;
    }

    this.reconnectTimer = setTimeout(() => this.tryReconnect(), RECONNECT_INTERVAL_MS);
  }

  private async tryReconnect(): Promise<void> {
    if (this.destroyed || !this.preferences.favoriteDeviceId) {
      return;
    }
    this.reconnectAttempts += 1;
    try {
      await this.connect(this.preferences.favoriteDeviceId);
    } catch {
      this.scheduleReconnect();
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private async cleanupConnection(): Promise<void> {
    this.stopConnectionWatch();
    this.stopReadLoop();
    this.detachDataListeners();
    this.disconnectSubscription?.remove();
    this.disconnectSubscription = null;
    this.parser.clear();
    this.debouncer.reset();

    if (this.nativeDevice) {
      try {
        await this.nativeDevice.disconnect();
      } catch (error) {
        if (__DEV__) {
          console.debug('[BluetoothScanner] disconnect:', error);
        }
      }
      this.nativeDevice = null;
    }

    this.connectedDevice = null;
  }

  destroy(): void {
    this.destroyed = true;
    this.userInitiatedDisconnect = true;
    this.clearReconnectTimer();
    this.stopConnectionWatch();
    void this.cleanupConnection();
    this.events.clear();
    this.setConnectionState('DISCONNECTED');
  }
}

export const scannerService = new BluetoothScannerService();

export default BluetoothScannerService;
