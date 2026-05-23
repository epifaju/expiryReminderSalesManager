import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useBluetooth } from '../../bluetooth/useBluetooth';
import { scannerService } from '../../bluetooth/BluetoothScannerService';
import { ScannerConnectionState } from '../../bluetooth/scannerTypes';

interface ScannerStatusBarProps {
  compact?: boolean;
}

const stateColor = (state: ScannerConnectionState): string => {
  switch (state) {
    case 'CONNECTED':
      return '#28a745';
    case 'CONNECTING':
      return '#ffc107';
    case 'ERROR':
      return '#dc3545';
    default:
      return '#6c757d';
  }
};

const ScannerStatusBar: React.FC<ScannerStatusBarProps> = ({ compact = true }) => {
  const { t } = useTranslation();
  const { connectionState, connectedDevice, preferences } = useBluetooth({
    autoConnectOnInit: true,
    loadDevicesOnInit: false,
  });
  const [sessionScanCount, setSessionScanCount] = useState(0);

  const isConfigured =
    Boolean(preferences.favoriteDeviceId) ||
    connectionState === 'CONNECTED' ||
    preferences.autoReconnect;

  useEffect(() => {
    if (!isConfigured) {
      return undefined;
    }
    const unsubscribe = scannerService.onScan(() => {
      setSessionScanCount((c) => c + 1);
    });
    return unsubscribe;
  }, [isConfigured]);

  if (Platform.OS !== 'android' || !isConfigured) {
    return null;
  }

  const statusLabel = (() => {
    if (connectionState === 'CONNECTED' && connectedDevice) {
      return `${t('bluetooth.status_connected')}: ${connectedDevice.name}`;
    }
    switch (connectionState) {
      case 'CONNECTING':
        return t('bluetooth.status_connecting');
      case 'ERROR':
        return t('bluetooth.status_error');
      default:
        return t('bluetooth.status_disconnected');
    }
  })();

  return (
    <View style={[styles.bar, compact && styles.barCompact]}>
      <Text style={[styles.icon, { color: stateColor(connectionState) }]}>📶</Text>
      <Text style={styles.text} numberOfLines={1}>
        {statusLabel}
      </Text>
      <Text style={styles.count}>
        {sessionScanCount} {t('bluetooth.session_scans')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderTopWidth: 1,
    borderTopColor: '#c7d2fe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  barCompact: {
    paddingVertical: 6,
  },
  icon: {
    fontSize: 16,
  },
  text: {
    flex: 1,
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  count: {
    fontSize: 11,
    color: '#667eea',
    fontWeight: '600',
  },
});

export default ScannerStatusBar;
