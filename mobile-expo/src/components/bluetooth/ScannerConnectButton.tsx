import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { BluetoothDevice } from '../../bluetooth/scannerTypes';

interface ScannerConnectButtonProps {
  device: BluetoothDevice;
  isConnected: boolean;
  isConnecting: boolean;
  disabled?: boolean;
  onConnect: (deviceId: string) => void;
  onDisconnect: () => void;
  style?: ViewStyle;
}

const ScannerConnectButton: React.FC<ScannerConnectButtonProps> = ({
  device,
  isConnected,
  isConnecting,
  disabled = false,
  onConnect,
  onDisconnect,
  style,
}) => {
  const { t } = useTranslation();

  const handlePress = () => {
    if (isConnected) {
      onDisconnect();
    } else {
      onConnect(device.id);
    }
  };

  const label = isConnected
    ? t('bluetooth.disconnect_button')
    : t('bluetooth.connect_button');

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isConnected ? styles.disconnect : styles.connect,
        (disabled || isConnecting) && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || isConnecting}
      activeOpacity={0.7}
    >
      {isConnecting && !isConnected ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.buttonText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connect: {
    backgroundColor: '#667eea',
  },
  disconnect: {
    backgroundColor: '#dc3545',
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ScannerConnectButton;
