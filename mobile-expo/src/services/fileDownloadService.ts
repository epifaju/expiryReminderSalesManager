import { Platform, Alert, PermissionsAndroid } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Import conditionnel des modules natifs
let RNBlobUtil: any = null;
let share: any = null;

try {
  if (Platform.OS !== 'web') {
    RNBlobUtil = require('react-native-blob-util').default;
    share = require('react-native-share').share;
  }
} catch (error) {
  console.log('Modules natifs non disponibles (mode web)');
}

export interface DownloadOptions {
  fileName?: string;
  showShareOptions?: boolean;
  saveToDevice?: boolean;
}

export interface DownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

class FileDownloadService {
  private downloadsDir: string;

  constructor() {
    this.downloadsDir = RNBlobUtil?.fs?.dirs?.DownloadDir || FileSystem.documentDirectory || '';
  }

  /**
   * Vérifie si les modules natifs sont disponibles
   */
  private isNativeModuleAvailable(): boolean {
    const isAvailable = RNBlobUtil !== null && share !== null;
    if (!isAvailable) {
      console.log('Modules natifs non disponibles. RNBlobUtil:', !!RNBlobUtil, 'Share:', !!share);
    }
    return isAvailable;
  }

  /**
   * Demande les permissions nécessaires pour Android
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Permission de stockage',
            message: 'L\'application a besoin d\'accéder au stockage pour sauvegarder les fichiers PDF.',
            buttonNeutral: 'Demander plus tard',
            buttonNegative: 'Annuler',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        console.error('Erreur lors de la demande de permission:', error);
        return false;
      }
    }
    return true; // iOS n'a pas besoin de cette permission
  }

  /**
   * Télécharge un fichier PDF depuis une URL
   */
  async downloadPdfFromUrl(
    url: string,
    fileName: string,
    options: DownloadOptions = {}
  ): Promise<DownloadResult> {
    try {
      // Vérifier si les modules natifs sont disponibles
      if (!this.isNativeModuleAvailable()) {
        return {
          success: false,
          error: 'Modules natifs non disponibles (mode web ou problème de chargement)',
        };
      }

      const { showShareOptions = true, saveToDevice = true } = options;
      
      // Demander les permissions si nécessaire
      if (saveToDevice && Platform.OS === 'android') {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
          return {
            success: false,
            error: 'Permission de stockage refusée',
          };
        }
      }

      // Générer le nom de fichier unique
      const timestamp = new Date().getTime();
      const finalFileName = `${fileName}_${timestamp}.pdf`;
      const filePath = `${this.downloadsDir}/${finalFileName}`;

      // Télécharger le fichier
      const downloadResult = await RNBlobUtil!.config({
        fileCache: true,
        path: filePath,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path: filePath,
          description: 'Téléchargement du reçu PDF',
        },
      }).fetch('GET', url);

      if (showShareOptions) {
        await this.showShareOptions(filePath, finalFileName);
      }

      return {
        success: true,
        filePath: downloadResult.path(),
      };
    } catch (error: any) {
      console.error('Erreur lors du téléchargement:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors du téléchargement',
      };
    }
  }

  /**
   * Sauvegarde un blob PDF sur le device
   */
  async savePdfBlob(
    blob: Blob,
    fileName: string,
    options: DownloadOptions = {}
  ): Promise<DownloadResult> {
    try {
      // Vérifier si les modules natifs sont disponibles
      if (!this.isNativeModuleAvailable()) {
        console.log('Modules natifs non disponibles, utilisation du fallback Expo...');
        return await this.savePdfBlobWithExpo(blob, fileName, options);
      }

      const { showShareOptions = true, saveToDevice = true } = options;
      
      // Demander les permissions si nécessaire
      if (saveToDevice && Platform.OS === 'android') {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
          return {
            success: false,
            error: 'Permission de stockage refusée',
          };
        }
      }

      // Générer le nom de fichier unique
      const timestamp = new Date().getTime();
      const finalFileName = `${fileName}_${timestamp}.pdf`;
      const filePath = `${this.downloadsDir}/${finalFileName}`;

      // Convertir le blob en base64
      const base64Data = await this.blobToBase64(blob);

      // Sauvegarder le fichier
      await RNBlobUtil!.fs.writeFile(filePath, base64Data, 'base64');

      if (showShareOptions) {
        await this.showShareOptions(filePath, finalFileName);
      }

      return {
        success: true,
        filePath,
      };
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      // Essayer avec Expo en cas d'erreur
      console.log('Erreur avec modules natifs, tentative avec Expo...');
      return await this.savePdfBlobWithExpo(blob, fileName, options);
    }
  }

  /**
   * Affiche les options de partage
   */
  private async showShareOptions(filePath: string, fileName: string): Promise<void> {
    try {
      const shareOptions = {
        title: 'Partager le reçu PDF',
        message: `Reçu: ${fileName}`,
        url: Platform.OS === 'ios' ? filePath : `file://${filePath}`,
        type: 'application/pdf',
        subject: fileName,
      };

      await share!(shareOptions);
    } catch (error: any) {
      console.error('Erreur lors du partage:', error);
      // Ne pas faire échouer le téléchargement si le partage échoue
    }
  }

  /**
   * Convertit un blob en base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Supprimer le préfixe data:application/pdf;base64,
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Vérifie si un fichier existe
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      if (!this.isNativeModuleAvailable()) {
        return false;
      }
      return await RNBlobUtil!.fs.exists(filePath);
    } catch (error) {
      console.error('Erreur lors de la vérification du fichier:', error);
      return false;
    }
  }

  /**
   * Supprime un fichier
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      if (!this.isNativeModuleAvailable()) {
        return false;
      }
      await RNBlobUtil!.fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      return false;
    }
  }

  /**
   * Obtient la taille d'un fichier
   */
  async getFileSize(filePath: string): Promise<number> {
    try {
      if (!this.isNativeModuleAvailable()) {
        return 0;
      }
      const stat = await RNBlobUtil!.fs.stat(filePath);
      return stat.size;
    } catch (error) {
      console.error('Erreur lors de la récupération de la taille:', error);
      return 0;
    }
  }

  /**
   * Obtient le chemin du dossier de téléchargements
   */
  getDownloadsPath(): string {
    return this.downloadsDir;
  }

  /**
   * Formate la taille d'un fichier
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Sauvegarde un blob PDF en utilisant Expo (fallback)
   */
  private async savePdfBlobWithExpo(
    blob: Blob,
    fileName: string,
    options: DownloadOptions = {}
  ): Promise<DownloadResult> {
    try {
      const { showShareOptions = true } = options;
      
      // Convertir le blob en base64
      const base64 = await this.blobToBase64(blob);
      
      // Générer le nom de fichier unique
      const timestamp = new Date().getTime();
      const finalFileName = `${fileName}_${timestamp}.pdf`;
      
      // Créer le fichier avec Expo FileSystem
      const fileUri = `${FileSystem.documentDirectory}${finalFileName}`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (showShareOptions && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Partager le reçu PDF',
        });
      }

      return {
        success: true,
        filePath: fileUri,
      };
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde avec Expo:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la sauvegarde avec Expo',
      };
    }
  }
}

export const fileDownloadService = new FileDownloadService();
