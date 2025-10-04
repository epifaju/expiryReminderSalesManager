import { Platform, Alert } from 'react-native';

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

/**
 * Version web du service de téléchargement
 * Utilise les APIs web natives pour télécharger les PDFs
 */
export const downloadAndSavePdf = async (
  pdfData: string, // Base64 string
  fileName: string,
  options: DownloadOptions = {}
): Promise<string> => {
  try {
    console.log('📥 Début du téléchargement PDF (web):', fileName);
    
    if (Platform.OS !== 'web') {
      throw new Error('Ce service est uniquement pour le web');
    }
    
    // Convertir base64 en blob
    const base64Data = pdfData.replace(/^data:application\/pdf;base64,/, '');
    const bytes = atob(base64Data);
    const byteNumbers = new Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      byteNumbers[i] = bytes.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    
    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    
    // Déclencher le téléchargement
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Nettoyer l'URL
    window.URL.revokeObjectURL(url);
    
    console.log('✅ PDF téléchargé via le navigateur:', fileName);
    
    // Afficher un message de succès
    Alert.alert(
      'Téléchargement réussi',
      `Le fichier ${fileName} a été téléchargé dans votre dossier de téléchargements.`,
      [{ text: 'OK' }]
    );
    
    return `web-download://${fileName}`;
  } catch (error) {
    console.error('❌ Erreur téléchargement PDF (web):', error);
    throw error;
  }
};

export const shareFile = async (filePath: string, fileName: string): Promise<void> => {
  if (Platform.OS === 'web') {
    Alert.alert(
      'Partage non disponible',
      'Le partage de fichiers n\'est pas disponible dans le navigateur. Le fichier a été téléchargé.',
      [{ text: 'OK' }]
    );
    return;
  }
  throw new Error('Fonction non implémentée pour cette plateforme');
};

export const requestStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return true; // Pas de permissions nécessaires sur le web
  }
  return false;
};

// Export par défaut pour compatibilité
export default {
  downloadAndSavePdf,
  shareFile,
  requestStoragePermission,
};
