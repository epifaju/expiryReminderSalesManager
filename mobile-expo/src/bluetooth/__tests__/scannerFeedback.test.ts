import { Vibration, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { playScanSuccessFeedback, playScanNotFoundFeedback } from '../scannerFeedback';
import { scannerService } from '../BluetoothScannerService';

jest.mock('../BluetoothScannerService', () => ({
  scannerService: {
    loadPreferences: jest.fn(),
  },
}));

jest.mock('expo-haptics', () => ({
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
  notificationAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('scannerFeedback', () => {
  beforeAll(() => {
    Platform.OS = 'android';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (scannerService.loadPreferences as jest.Mock).mockResolvedValue({
      soundEnabled: true,
      vibrationEnabled: true,
      autoReconnect: true,
      scanSuffix: 'CRLF',
      favoriteDeviceId: null,
    });
  });

  it('déclenche vibration et haptics en succès', async () => {
    const vibrateSpy = jest.spyOn(Vibration, 'vibrate').mockImplementation(() => {});

    await playScanSuccessFeedback();

    expect(vibrateSpy).toHaveBeenCalled();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  });

  it('respecte les préférences désactivées', async () => {
    (scannerService.loadPreferences as jest.Mock).mockResolvedValue({
      soundEnabled: false,
      vibrationEnabled: false,
    });
    const vibrateSpy = jest.spyOn(Vibration, 'vibrate').mockImplementation(() => {});

    await playScanNotFoundFeedback();

    expect(vibrateSpy).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });
});
