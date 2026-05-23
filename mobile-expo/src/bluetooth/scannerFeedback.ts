import { Vibration, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { scannerService } from './BluetoothScannerService';

/**
 * Retour haptique/sonore optionnel après scan (PRD Bloc 6).
 * - Vibration : API React Native
 * - Son : retour système via expo-haptics (Expo SDK 51).
 *   Pour react-native-sound + fichiers .mp3 custom, voir assets/sounds/README.md
 */
export async function playScanSuccessFeedback(): Promise<void> {
  const prefs = await scannerService.loadPreferences();

  if (prefs.vibrationEnabled && Platform.OS !== 'web') {
    Vibration.vibrate(40);
  }

  if (prefs.soundEnabled && Platform.OS !== 'web') {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Module haptics indisponible
    }
  }
}

export async function playScanNotFoundFeedback(): Promise<void> {
  const prefs = await scannerService.loadPreferences();

  if (prefs.vibrationEnabled && Platform.OS !== 'web') {
    Vibration.vibrate([0, 50, 30, 50]);
  }

  if (prefs.soundEnabled && Platform.OS !== 'web') {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // ignore
    }
  }
}
