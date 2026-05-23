import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { scannerService } from '../../bluetooth/BluetoothScannerService';
import NetworkService from '../network/NetworkService';
import { pendingProductSyncService } from './PendingProductSyncService';

type Unsubscribe = () => void;

/**
 * Coordonne sync produits pending + reconnexion scanner Bluetooth au retour réseau.
 * PRD Bloc 6 — s'initialise depuis AppWrapper (fichier dédié, sans modifier NetworkService).
 */
class ScannerConnectivityCoordinator {
  private started = false;
  private netInfoUnsubscribe: Unsubscribe | null = null;
  private networkListenerUnsubscribe: Unsubscribe | null = null;
  private wasOffline = false;

  async start(): Promise<void> {
    if (this.started) {
      return;
    }
    this.started = true;

    if (!NetworkService.isServiceInitialized()) {
      await NetworkService.initialize();
    }

    const initial = await NetInfo.fetch();
    this.wasOffline = !this.isOnlineState(initial);

    if (!this.wasOffline) {
      await this.onBackOnline();
    }

    this.netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      void this.handleNetInfoChange(state);
    });

    this.networkListenerUnsubscribe = NetworkService.addListener((info) => {
      const online = info.isConnected && info.isInternetReachable;
      if (online && this.wasOffline) {
        void this.onBackOnline();
      }
      this.wasOffline = !online;
    });
  }

  async stop(): Promise<void> {
    this.netInfoUnsubscribe?.();
    this.netInfoUnsubscribe = null;
    this.networkListenerUnsubscribe?.();
    this.networkListenerUnsubscribe = null;
    this.started = false;
  }

  private isOnlineState(state: {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
  }): boolean {
    return Boolean(state.isConnected && state.isInternetReachable);
  }

  private async handleNetInfoChange(state: {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
  }): Promise<void> {
    const online = this.isOnlineState(state);
    if (online && this.wasOffline) {
      await this.onBackOnline();
    }
    this.wasOffline = !online;
  }

  private async onBackOnline(): Promise<void> {
    if (__DEV__) {
      console.log('[ScannerConnectivity] Réseau disponible — sync pending + Bluetooth');
    }

    try {
      const syncResult = await pendingProductSyncService.syncAll();
      if (__DEV__ && (syncResult.synced > 0 || syncResult.failed > 0)) {
        console.log('[ScannerConnectivity] Sync produits:', syncResult);
      }
    } catch (error) {
      console.warn('[ScannerConnectivity] Échec sync produits pending:', error);
    }

    if (Platform.OS === 'android') {
      try {
        await scannerService.autoConnectFavorite();
      } catch (error) {
        console.warn('[ScannerConnectivity] Auto-connect scanner:', error);
      }
    }
  }
}

export const scannerConnectivityCoordinator = new ScannerConnectivityCoordinator();
export default scannerConnectivityCoordinator;
