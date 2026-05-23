import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Package Android du build natif (expo run:android), pas Expo Go. */
export const ANDROID_APP_PACKAGE = 'com.anonymous.mobileexpo';

/** true si le JS tourne dans Expo Go — Bluetooth SPP et module natif indisponibles. */
export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

export function isNativeDevBuildRequired(): boolean {
  return Platform.OS === 'android' && isExpoGo();
}

export function getRuntimeAppLabel(): string {
  if (isExpoGo()) {
    return 'Expo Go';
  }
  return Constants.expoConfig?.name ?? 'mobile-expo';
}
