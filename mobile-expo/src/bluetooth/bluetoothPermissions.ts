import * as IntentLauncher from 'expo-intent-launcher';
import { Linking, PermissionsAndroid, Platform } from 'react-native';
import { ANDROID_APP_PACKAGE } from '../utils/expoRuntime';
import { withTimeout } from './scannerUtils';

const ANDROID_API_BLUETOOTH_RUNTIME = 31;

/** Code d’erreur UI — permissions non accordées (demande via bouton utilisateur). */
export const BLUETOOTH_PERMISSIONS_REQUIRED = 'PERMISSIONS_REQUIRED';

export const BLUETOOTH_PERMISSION_DENIED = 'PERMISSION_DENIED';

/** Bluetooth CONNECT/SCAN refusés — activer dans les paramètres de l’app. */
export const BLUETOOTH_PERMISSION_DENIED_BT = 'PERMISSION_DENIED_BT';

const PERMISSION_CHECK_TIMEOUT_MS = 5_000;
const PERMISSION_REQUEST_TIMEOUT_MS = 60_000;

export interface BluetoothPermissionStatus {
  connect: boolean;
  scan: boolean;
  location: boolean;
}

export interface NearbyPermissionRequestResult {
  connect: boolean;
  scan: boolean;
  /** L’utilisateur a coché « Ne plus demander » — ouvrir les paramètres système. */
  mustOpenSettings: boolean;
}

export function isBluetoothPermissionsRequiredError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const code = (error as { code?: string }).code;
  const message = (error as { message?: string }).message;
  return code === BLUETOOTH_PERMISSIONS_REQUIRED || message === BLUETOOTH_PERMISSIONS_REQUIRED;
}

export async function getBluetoothPermissionStatus(): Promise<BluetoothPermissionStatus> {
  if (Platform.OS !== 'android') {
    return { connect: false, scan: false, location: false };
  }

  const connect = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
  );
  const scan = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
  const location = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );

  const apiLevel =
    typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10);

  if (apiLevel < ANDROID_API_BLUETOOTH_RUNTIME) {
    return { connect: true, scan: true, location };
  }

  return { connect, scan, location };
}

/**
 * Vérifie que les permissions Bluetooth requises sont accordées (PRD section 15).
 */
export async function checkBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  const status = await getBluetoothPermissionStatus();
  const apiLevel =
    typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10);

  if (apiLevel >= ANDROID_API_BLUETOOTH_RUNTIME) {
    return status.connect && status.scan;
  }

  return status.location;
}

export async function checkBluetoothPermissionsWithTimeout(): Promise<boolean> {
  try {
    return await withTimeout(
      checkBluetoothPermissions(),
      PERMISSION_CHECK_TIMEOUT_MS,
      'permission_check_timeout'
    );
  } catch {
    return false;
  }
}

/**
 * Deux dialogues distincts (CONNECT puis SCAN) — plus fiable que requestMultiple sur certaines tablettes.
 */
async function requestNearbyBluetoothPermissions(): Promise<NearbyPermissionRequestResult> {
  const connectResult = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    {
      title: 'Scanner Tera — Bluetooth',
      message:
        'Étape 1/2 : autorisez « Appareils à proximité » (connexion au scanner). La localisation seule ne suffit pas.',
      buttonPositive: 'Autoriser',
      buttonNegative: 'Refuser',
    }
  );

  const scanResult = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    {
      title: 'Scanner Tera — Bluetooth',
      message: 'Étape 2/2 : autorisez la recherche des scanners Bluetooth à proximité.',
      buttonPositive: 'Autoriser',
      buttonNegative: 'Refuser',
    }
  );

  const connect = connectResult === PermissionsAndroid.RESULTS.GRANTED;
  const scan = scanResult === PermissionsAndroid.RESULTS.GRANTED;
  const mustOpenSettings =
    connectResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
    scanResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;

  return { connect, scan, mustOpenSettings };
}

async function requestBluetoothPermissionsInner(): Promise<boolean> {
  const apiLevel =
    typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10);

  if (apiLevel >= ANDROID_API_BLUETOOTH_RUNTIME) {
    const bt = await requestNearbyBluetoothPermissions();
    if (!bt.connect || !bt.scan) {
      return false;
    }
    await ensureLocationForBluetoothDiscovery();
    return checkBluetoothPermissions();
  }

  const locationResult = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Bluetooth',
      message:
        'La localisation est requise pour lister les scanners Bluetooth appairés sur cette version d’Android.',
      buttonPositive: 'Autoriser',
      buttonNegative: 'Refuser',
    }
  );

  return locationResult === PermissionsAndroid.RESULTS.GRANTED;
}

export async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    return await withTimeout(
      requestBluetoothPermissionsInner(),
      PERMISSION_REQUEST_TIMEOUT_MS,
      'permission_request_timeout'
    );
  } catch {
    return false;
  }
}

/** Comme requestBluetoothPermissions, avec indication si les paramètres système sont requis. */
export async function requestBluetoothPermissionsWithDetails(): Promise<{
  granted: boolean;
  mustOpenSettings: boolean;
}> {
  if (Platform.OS !== 'android') {
    return { granted: false, mustOpenSettings: false };
  }

  const apiLevel =
    typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10);

  if (apiLevel < ANDROID_API_BLUETOOTH_RUNTIME) {
    const granted = await requestBluetoothPermissions();
    return { granted, mustOpenSettings: false };
  }

  const bt = await requestNearbyBluetoothPermissions();
  if (bt.mustOpenSettings) {
    return { granted: false, mustOpenSettings: true };
  }
  if (!bt.connect || !bt.scan) {
    return { granted: false, mustOpenSettings: false };
  }

  await ensureLocationForBluetoothDiscovery();
  const granted = await checkBluetoothPermissions();
  return { granted, mustOpenSettings: false };
}

export async function ensureBluetoothPermissions(): Promise<boolean> {
  const alreadyGranted = await checkBluetoothPermissionsWithTimeout();
  if (alreadyGranted) {
    return true;
  }
  return requestBluetoothPermissions();
}

/**
 * Ouvre les paramètres de l’APK Sales Manager (com.anonymous.mobileexpo),
 * pas Expo Go — important si le JS a été lancé depuis Expo Go par erreur.
 */
export async function openApplicationSettings(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
        { data: `package:${ANDROID_APP_PACKAGE}` }
      );
      return;
    } catch {
      // Repli ci-dessous
    }
  }
  void Linking.openSettings();
}

export async function ensureLocationForBluetoothDiscovery(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  const granted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );
  if (granted) {
    return true;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Localisation',
      message:
        'Étape optionnelle : la localisation aide à détecter le scanner Tera à proximité.',
      buttonPositive: 'Autoriser',
      buttonNegative: 'Plus tard',
    }
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}
