import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Switch,
  ActivityIndicator,
  Platform,
  Alert,
  TextInput,
  AppState,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useBluetooth } from '../bluetooth/useBluetooth';
import ScannerConnectButton from '../components/bluetooth/ScannerConnectButton';
import { scannerService } from '../bluetooth/BluetoothScannerService';
import { BluetoothDevice, ScanEvent, ScanSuffix } from '../bluetooth/scannerTypes';
import { openApplicationSettings as openSalesManagerAppSettings } from '../bluetooth/bluetoothPermissions';
import { ANDROID_APP_PACKAGE, isNativeDevBuildRequired } from '../utils/expoRuntime';

interface BluetoothSettingsScreenProps {
  onBack: () => void;
}

const BluetoothSettingsScreen: React.FC<BluetoothSettingsScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const {
    connectionState,
    connectedDevice,
    displayDevices,
    savedScannerMac,
    isLoadingDevices,
    isDiscovering,
    isGrantingPermissions,
    deviceSearchPhase,
    connect,
    disconnect,
    refreshPairedDevices,
    discoverNearbyDevices,
    pairDevice,
    connectByMacAddress,
    preferences,
    updatePreferences,
    devicesError,
    grantBluetoothPermissions,
    openSystemBluetoothSettings,
    openApplicationSettings,
  } = useBluetooth({ autoConnectOnInit: false, loadDevicesOnInit: false });

  const [lastScan, setLastScan] = useState<ScanEvent | null>(null);
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null);
  const [manualMac, setManualMac] = useState('');
  const runningInExpoGo = isNativeDevBuildRequired();

  const handleGrantPermissions = () => {
    if (runningInExpoGo) {
      Alert.alert(t('bluetooth.expo_go_title'), t('bluetooth.expo_go_message'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('bluetooth.expo_go_open_settings'),
          onPress: () => void openSalesManagerAppSettings(),
        },
      ]);
      return;
    }
    void grantBluetoothPermissions();
  };

  useEffect(() => {
    const unsubscribe = scannerService.onScan((event) => {
      setLastScan(event);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (savedScannerMac && !manualMac.trim()) {
      setManualMac(savedScannerMac);
    }
  }, [savedScannerMac, manualMac]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        nextState === 'active' &&
        (deviceSearchPhase === 'idle' || devicesError === 'PERMISSION_DENIED_BT')
      ) {
        void refreshPairedDevices();
      }
    });
    return () => subscription.remove();
  }, [refreshPairedDevices, deviceSearchPhase, devicesError]);

  const handleConnect = async (deviceId: string) => {
    try {
      setConnectingDeviceId(deviceId);
      await connect(deviceId);
    } catch (error: any) {
      const needsPermission =
        error?.code === 'PERMISSIONS_REQUIRED' || error?.message === 'PERMISSIONS_REQUIRED';
      if (needsPermission) {
        Alert.alert(t('bluetooth.status_error'), t('bluetooth.permissions_required'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('bluetooth.grant_permission'), onPress: handleGrantPermissions },
        ]);
        return;
      }
      Alert.alert(t('bluetooth.status_error'), error?.message || t('bluetooth.permission_denied'));
    } finally {
      setConnectingDeviceId(null);
    }
  };

  const handleManualConnect = async () => {
    try {
      setConnectingDeviceId(manualMac);
      await connectByMacAddress(manualMac);
    } catch (error: any) {
      Alert.alert(t('bluetooth.status_error'), error?.message || t('common.error'));
    } finally {
      setConnectingDeviceId(null);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error: any) {
      Alert.alert(t('bluetooth.status_error'), error?.message || t('common.error'));
    }
  };

  const renderStatusLabel = () => {
    switch (connectionState) {
      case 'CONNECTED':
        return connectedDevice
          ? `${t('bluetooth.status_connected')}: ${connectedDevice.name}`
          : t('bluetooth.status_connected');
      case 'CONNECTING':
        return t('bluetooth.status_connecting');
      case 'ERROR':
        return scannerService.getLastErrorMessage() || t('bluetooth.status_error');
      default:
        return t('bluetooth.status_disconnected');
    }
  };

  const renderStatusIcon = () => {
    switch (connectionState) {
      case 'CONNECTED':
        return '✅';
      case 'CONNECTING':
        return '⏳';
      case 'ERROR':
        return '⚠️';
      default:
        return '❌';
    }
  };

  const setScanSuffix = (suffix: ScanSuffix) => {
    void updatePreferences({ scanSuffix: suffix });
  };

  const handlePair = useCallback(
    async (deviceId: string) => {
      try {
        setConnectingDeviceId(deviceId);
        await pairDevice(deviceId);
        Alert.alert(t('bluetooth.pair_success_title'), t('bluetooth.pair_success_message'));
        await refreshPairedDevices();
      } catch (error: any) {
        Alert.alert(t('bluetooth.status_error'), error?.message || t('common.error'));
      } finally {
        setConnectingDeviceId(null);
      }
    },
    [pairDevice, refreshPairedDevices, t]
  );

  const renderDevice = ({ item }: { item: BluetoothDevice }) => {
    const isConnected = connectedDevice?.id === item.id && connectionState === 'CONNECTED';
    const isConnecting = connectingDeviceId === item.id;
    const isSavedMac = savedScannerMac === item.id;
    const needsPair = !item.bonded;

    return (
      <View style={styles.deviceRow}>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>
            {isSavedMac ? t('bluetooth.saved_scanner') : item.name}
          </Text>
          <Text style={styles.deviceMacLabel}>{t('bluetooth.device_mac')}</Text>
          <Text style={styles.deviceId}>{item.id}</Text>
          {needsPair && (
            <Text style={styles.needsPairHint}>{t('bluetooth.needs_pairing')}</Text>
          )}
        </View>
        {needsPair ? (
          <TouchableOpacity
            style={styles.pairButton}
            onPress={() => void handlePair(item.id)}
            disabled={isConnecting}
          >
            <Text style={styles.pairButtonText}>{t('bluetooth.pair_device')}</Text>
          </TouchableOpacity>
        ) : (
          <ScannerConnectButton
            device={item}
            isConnected={isConnected}
            isConnecting={isConnecting}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        )}
      </View>
    );
  };

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📶 {t('bluetooth.settings_title')}</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.androidOnly}>{t('bluetooth.android_only')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📶 {t('bluetooth.settings_title')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {runningInExpoGo && (
          <View style={styles.expoGoBlock}>
            <Text style={styles.expoGoTitle}>{t('bluetooth.expo_go_title')}</Text>
            <Text style={styles.expoGoText}>{t('bluetooth.expo_go_message')}</Text>
            <Text style={styles.expoGoPackage}>{ANDROID_APP_PACKAGE}</Text>
            <TouchableOpacity
              style={[styles.retryButton, styles.primarySettingsButton]}
              onPress={() => void openSalesManagerAppSettings()}
            >
              <Text style={styles.retryButtonText}>{t('bluetooth.expo_go_open_settings')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>{t('bluetooth.connection_status')}</Text>
        <View style={styles.statusCard}>
          <Text style={styles.statusIcon}>{renderStatusIcon()}</Text>
          <Text style={styles.statusText}>{renderStatusLabel()}</Text>
        </View>

        <View style={styles.teraHelpCard}>
          <Text style={styles.teraHelpTitle}>{t('bluetooth.tera_help_title')}</Text>
          <Text style={styles.teraHelpSteps}>{t('bluetooth.tera_help_steps')}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('bluetooth.quick_connect')}</Text>
        <View style={styles.manualCard}>
          <Text style={styles.helpText}>{t('bluetooth.mac_only_hint')}</Text>
          <TextInput
            style={styles.macInput}
            value={manualMac}
            onChangeText={setManualMac}
            placeholder="AA:BB:CC:DD:EE:FF"
            placeholderTextColor="#aaa"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => void handleManualConnect()}
            disabled={!manualMac.trim() || connectingDeviceId !== null}
          >
            <Text style={styles.retryButtonText}>
              {savedScannerMac && manualMac === savedScannerMac
                ? t('bluetooth.reconnect_saved')
                : t('bluetooth.connect_by_mac')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('bluetooth.paired_devices')}</Text>
          <TouchableOpacity onPress={() => void refreshPairedDevices()}>
            <Text style={styles.refreshLink}>{t('bluetooth.refresh_devices')}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.listHint}>{t('bluetooth.devices_list_hint')}</Text>

        {deviceSearchPhase !== 'idle' && !isGrantingPermissions && (
          <View
            style={[
              styles.searchResultBanner,
              deviceSearchPhase === 'error' && styles.searchResultBannerError,
              deviceSearchPhase === 'done' &&
                displayDevices.length > 0 &&
                styles.searchResultBannerSuccess,
            ]}
          >
            <Text style={styles.searchResultText}>
              {deviceSearchPhase === 'bonded'
                ? t('bluetooth.search_scanning_bonded')
                : deviceSearchPhase === 'discovering'
                  ? t('bluetooth.discovering_devices')
                  : deviceSearchPhase === 'error' && devicesError
                    ? devicesError === 'NO_DEVICES'
                      ? t('bluetooth.no_devices')
                      : devicesError === 'PERMISSIONS_REQUIRED'
                        ? t('bluetooth.permissions_required')
                        : devicesError === 'PERMISSION_DENIED_BT'
                          ? t('bluetooth.permission_denied_bt')
                          : devicesError === 'PERMISSION_DENIED'
                            ? t('bluetooth.permission_denied')
                            : devicesError
                    : deviceSearchPhase === 'done' && displayDevices.length > 0
                      ? t('bluetooth.search_done_count', { count: displayDevices.length })
                      : t('bluetooth.search_done_empty')}
            </Text>
          </View>
        )}

        {isLoadingDevices || isDiscovering || isGrantingPermissions ? (
          <View style={styles.loaderBlock}>
            <ActivityIndicator color="#667eea" />
            <Text style={styles.loadingHint}>
              {isGrantingPermissions
                ? t('bluetooth.granting_permissions')
                : isDiscovering
                  ? t('bluetooth.discovering_devices')
                  : deviceSearchPhase === 'bonded'
                    ? t('bluetooth.search_scanning_bonded')
                    : t('bluetooth.loading_devices')}
            </Text>
          </View>
        ) : devicesError && !(devicesError === 'NO_DEVICES' && savedScannerMac) ? (
          <View style={styles.errorBlock}>
            <Text style={styles.errorText}>
              {devicesError === 'NO_DEVICES'
                ? t('bluetooth.no_devices')
                : devicesError === 'PERMISSIONS_REQUIRED'
                  ? t('bluetooth.permissions_required')
                  : devicesError === 'PERMISSION_DENIED'
                  ? t('bluetooth.permission_denied')
                  : devicesError === 'PERMISSION_DENIED_BT'
                    ? t('bluetooth.permission_denied_bt')
                    : devicesError}
            </Text>
            {(devicesError === 'PERMISSIONS_REQUIRED' ||
              devicesError === 'PERMISSION_DENIED' ||
              devicesError === 'PERMISSION_DENIED_BT') && (
              <>
                {devicesError === 'PERMISSION_DENIED_BT' ? (
                  <Text style={styles.helpText}>{t('bluetooth.permission_bt_settings_steps')}</Text>
                ) : (
                  <Text style={styles.helpText}>{t('bluetooth.permissions_help')}</Text>
                )}
                <TouchableOpacity
                  style={[styles.retryButton, styles.primarySettingsButton]}
                  onPress={() => void openSalesManagerAppSettings()}
                >
                  <Text style={styles.retryButtonText}>
                    {t('bluetooth.open_permissions_settings')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleGrantPermissions}
                >
                  <Text style={styles.retryButtonText}>{t('bluetooth.grant_permission')}</Text>
                </TouchableOpacity>
              </>
            )}
            {devicesError !== 'PERMISSIONS_REQUIRED' &&
              devicesError !== 'PERMISSION_DENIED' &&
              devicesError !== 'PERMISSION_DENIED_BT' && (
              <>
                <Text style={styles.helpText}>{t('bluetooth.pairing_help')}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => void discoverNearbyDevices()}
                >
                  <Text style={styles.retryButtonText}>{t('bluetooth.discover_devices')}</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.settingsLink} onPress={openSystemBluetoothSettings}>
              <Text style={styles.settingsLinkText}>{t('bluetooth.open_system_settings')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retryButton} onPress={() => void refreshPairedDevices()}>
              <Text style={styles.retryButtonText}>{t('bluetooth.refresh_devices')}</Text>
            </TouchableOpacity>
          </View>
        ) : displayDevices.length === 0 ? (
          <Text style={styles.emptyText}>{t('bluetooth.no_devices')}</Text>
        ) : (
          <FlatList
            data={displayDevices}
            keyExtractor={(item) => item.id}
            renderItem={renderDevice}
            scrollEnabled={false}
            style={styles.deviceList}
          />
        )}

        <Text style={styles.sectionTitle}>{t('bluetooth.test_scan')}</Text>
        <View style={styles.testCard}>
          <Text style={styles.testLabel}>{t('bluetooth.last_scan')}</Text>
          <Text style={styles.testValue}>
            {lastScan?.barcode ?? '—'}
          </Text>
          {lastScan && (
            <Text style={styles.testMeta}>
              {new Date(lastScan.timestamp).toLocaleString()}
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>{t('bluetooth.preferences')}</Text>
        <View style={styles.prefRow}>
          <Text style={styles.prefLabel}>{t('bluetooth.auto_reconnect')}</Text>
          <Switch
            value={preferences.autoReconnect}
            onValueChange={(value) => void updatePreferences({ autoReconnect: value })}
          />
        </View>
        <View style={styles.prefRow}>
          <Text style={styles.prefLabel}>{t('bluetooth.sound_enabled')}</Text>
          <Switch
            value={preferences.soundEnabled}
            onValueChange={(value) => void updatePreferences({ soundEnabled: value })}
          />
        </View>
        <View style={styles.prefRow}>
          <Text style={styles.prefLabel}>{t('bluetooth.vibration_enabled')}</Text>
          <Switch
            value={preferences.vibrationEnabled}
            onValueChange={(value) => void updatePreferences({ vibrationEnabled: value })}
          />
        </View>

        <Text style={styles.prefLabel}>{t('bluetooth.scan_suffix')}</Text>
        <View style={styles.suffixRow}>
          <TouchableOpacity
            style={[
              styles.suffixButton,
              preferences.scanSuffix === 'LF' && styles.suffixButtonActive,
            ]}
            onPress={() => setScanSuffix('LF')}
          >
            <Text
              style={[
                styles.suffixButtonText,
                preferences.scanSuffix === 'LF' && styles.suffixButtonTextActive,
              ]}
            >
              {t('bluetooth.suffix_lf')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.suffixButton,
              preferences.scanSuffix === 'CRLF' && styles.suffixButtonActive,
            ]}
            onPress={() => setScanSuffix('CRLF')}
          >
            <Text
              style={[
                styles.suffixButtonText,
                preferences.scanSuffix === 'CRLF' && styles.suffixButtonTextActive,
              ]}
            >
              {t('bluetooth.suffix_crlf')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#667eea',
    marginTop: 16,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  refreshLink: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  statusText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  loaderBlock: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingHint: {
    fontSize: 13,
    color: '#666',
  },
  errorBlock: {
    backgroundColor: '#fff8e1',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ffe082',
    marginBottom: 8,
  },
  errorText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  helpText: {
    color: '#666',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  settingsLink: {
    marginBottom: 10,
  },
  settingsLinkText: {
    color: '#667eea',
    fontWeight: '600',
    fontSize: 14,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#667eea',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  primarySettingsButton: {
    backgroundColor: '#1565c0',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    paddingVertical: 12,
  },
  deviceList: {
    marginBottom: 8,
  },
  expoGoBlock: {
    backgroundColor: '#ffebee',
    borderRadius: 10,
    padding: 16,
    borderWidth: 2,
    borderColor: '#ef5350',
    marginBottom: 16,
  },
  expoGoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 10,
  },
  expoGoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 21,
    marginBottom: 8,
  },
  expoGoPackage: {
    fontSize: 12,
    color: '#666',
    fontFamily: Platform.OS === 'android' ? 'monospace' : undefined,
    marginBottom: 12,
  },
  teraHelpCard: {
    backgroundColor: '#e8f4fd',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#90caf9',
    marginBottom: 12,
  },
  teraHelpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1565c0',
    marginBottom: 8,
  },
  teraHelpSteps: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  manualCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 8,
  },
  macInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginVertical: 10,
    fontFamily: Platform.OS === 'android' ? 'monospace' : undefined,
    color: '#333',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  deviceInfo: {
    flex: 1,
    marginRight: 10,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  listHint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
    lineHeight: 19,
  },
  searchResultBanner: {
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#c5cae9',
  },
  searchResultBannerSuccess: {
    backgroundColor: '#e8f5e9',
    borderColor: '#a5d6a7',
  },
  searchResultBannerError: {
    backgroundColor: '#fff8e1',
    borderColor: '#ffe082',
  },
  searchResultText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  deviceMacLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  deviceId: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
    fontFamily: Platform.OS === 'android' ? 'monospace' : undefined,
    fontWeight: '600',
  },
  needsPairHint: {
    fontSize: 12,
    color: '#e65100',
    marginTop: 4,
  },
  pairButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pairButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  testCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  testLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  testValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: Platform.OS === 'android' ? 'monospace' : undefined,
  },
  testMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  prefLabel: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  suffixRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  suffixButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  suffixButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  suffixButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  suffixButtonTextActive: {
    color: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  androidOnly: {
    textAlign: 'center',
    fontSize: 15,
    color: '#666',
  },
});

export default BluetoothSettingsScreen;
