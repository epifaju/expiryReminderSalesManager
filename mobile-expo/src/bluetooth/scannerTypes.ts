/**
 * Types Bluetooth SPP scanner — PRD section 5 + constantes foundation (Bloc 1).
 */

export type ScannerConnectionState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'ERROR';

export type ScanSuffix = 'LF' | 'CRLF';

export interface BluetoothDevice {
  /** Adresse MAC */
  id: string;
  name: string;
  bonded: boolean;
}

export interface ScanEvent {
  barcode: string;
  timestamp: number;
  deviceId: string;
}

export interface ScannerPreferences {
  favoriteDeviceId: string | null;
  autoReconnect: boolean;
  scanSuffix: ScanSuffix;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface ScannerErrorPayload {
  code: ScannerErrorCode;
  message: string;
}

export type ScannerErrorCode =
  | 'PERMISSION_DENIED'
  | 'BLUETOOTH_UNAVAILABLE'
  | 'BLUETOOTH_DISABLED'
  | 'CONNECTION_FAILED'
  | 'NOT_ANDROID'
  | 'UNKNOWN';

export type ScanListener = (event: ScanEvent) => void;
export type StateChangeListener = (state: ScannerConnectionState) => void;
export type Unsubscribe = () => void;

export const SCANNER_PREFERENCES_STORAGE_KEY = '@bluetooth_scanner_preferences';

export const DEFAULT_SCANNER_PREFERENCES: ScannerPreferences = {
  favoriteDeviceId: null,
  autoReconnect: true,
  scanSuffix: 'CRLF',
  soundEnabled: true,
  vibrationEnabled: true,
};

/** Debounce anti double-scan matériel (PRD section 6, règle 2). */
export const SCAN_DEBOUNCE_MS = 500;
/** Ignore tout scan supplémentaire dans cette fenêtre (fragments / double lecture SPP). */
export const SCAN_BURST_SUPPRESS_MS = 1200;

/** Reconnexion automatique (PRD section 6, règle 3). */
export const RECONNECT_INTERVAL_MS = 5000;
export const RECONNECT_MAX_ATTEMPTS = 3;
export const RECONNECT_PAUSE_MS = 30000;
