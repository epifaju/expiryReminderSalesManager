import { BluetoothDevice, SCAN_DEBOUNCE_MS } from './scannerTypes';

/** Timeout global liste appareils (permissions + module natif). */
export const BLUETOOTH_LIST_DEVICES_TIMEOUT_MS = 18_000;
export const BLUETOOTH_NATIVE_STEP_TIMEOUT_MS = 8_000;
export const BLUETOOTH_CONNECT_TIMEOUT_MS = 15_000;
export const BLUETOOTH_DISCOVERY_TIMEOUT_MS = 28_000;

const MAC_ADDRESS_PATTERN = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/;

/** Fusionne les listes par adresse MAC (insensible à la casse). */
export function mergeBluetoothDevices(...lists: BluetoothDevice[][]): BluetoothDevice[] {
  const byId = new Map<string, BluetoothDevice>();
  for (const list of lists) {
    for (const device of list) {
      const key = (device.id || '').toUpperCase();
      if (!key) {
        continue;
      }
      const existing = byId.get(key);
      if (!existing || (device.bonded && !existing.bonded)) {
        byId.set(key, { ...device, id: key });
      }
    }
  }
  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/** Normalise une adresse MAC saisie (avec ou sans « : »). */
export function normalizeBluetoothMacAddress(input: string): string {
  const hex = input.trim().replace(/[^a-fA-F0-9]/g, '');
  if (hex.length !== 12) {
    throw new Error('Adresse MAC invalide (12 chiffres hexadécimaux attendus)');
  }
  const mac = hex.match(/.{1,2}/g)!.join(':').toUpperCase();
  if (!MAC_ADDRESS_PATTERN.test(mac)) {
    throw new Error('Adresse MAC invalide');
  }
  return mac;
}

export function isBluetoothMacAddress(input: string): boolean {
  try {
    normalizeBluetoothMacAddress(input);
    return true;
  } catch {
    return false;
  }
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Valide un code-barres scanné (ASCII imprimable, longueur courante retail).
 * Les codes invalides sont ignorés silencieusement côté service (PRD section 17).
 */
export function isValidBarcode(raw: string): boolean {
  const barcode = raw.trim();
  if (barcode.length < 4 || barcode.length > 48) {
    return false;
  }
  return /^[\x20-\x7E]+$/.test(barcode);
}

/**
 * Normalise un code-barres (trim, sans caractères de contrôle résiduels).
 */
export function normalizeBarcode(raw: string): string {
  return raw.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

/**
 * Debounce 500 ms — ignore un scan identique au précédent dans la fenêtre.
 */
export class ScanDebouncer {
  private lastBarcode: string | null = null;
  private lastTimestamp = 0;

  constructor(private readonly windowMs: number = SCAN_DEBOUNCE_MS) {}

  shouldAccept(barcode: string): boolean {
    const now = Date.now();
    if (
      this.lastBarcode !== null &&
      barcode === this.lastBarcode &&
      now - this.lastTimestamp < this.windowMs
    ) {
      return false;
    }
    this.lastBarcode = barcode;
    this.lastTimestamp = now;
    return true;
  }

  reset(): void {
    this.lastBarcode = null;
    this.lastTimestamp = 0;
  }
}
