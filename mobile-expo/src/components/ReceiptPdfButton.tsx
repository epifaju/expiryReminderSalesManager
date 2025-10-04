import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  View,
} from 'react-native';
import { receiptService, Receipt } from '../services/receiptService';
import { fileDownloadService, DownloadOptions } from '../services/fileDownloadService';

interface ReceiptPdfButtonProps {
  receipt: Receipt;
  onDownloadStart?: () => void;
  onDownloadSuccess?: (filePath: string) => void;
  onDownloadError?: (error: string) => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  showLoadingText?: boolean;
  downloadOptions?: DownloadOptions;
  style?: any;
  textStyle?: any;
}

export const ReceiptPdfButton: React.FC<ReceiptPdfButtonProps> = ({
  receipt,
  onDownloadStart,
  onDownloadSuccess,
  onDownloadError,
  variant = 'primary',
  size = 'medium',
  showLoadingText = true,
  downloadOptions = {},
  style,
  textStyle,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    // Vérifier si le reçu peut être téléchargé
    if (!receiptService.isReceiptDownloadable(receipt)) {
      Alert.alert(
        'Reçu non disponible',
        'Ce reçu ne peut pas être téléchargé actuellement.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsDownloading(true);
    onDownloadStart?.();

    try {
      // Télécharger le PDF depuis l'API
      const pdfBlob = await receiptService.downloadReceiptPdf(receipt.id);
      
      // Sauvegarder le fichier sur le device
      const result = await fileDownloadService.savePdfBlob(
        pdfBlob,
        `receipt_${receipt.receiptNumber}`,
        downloadOptions
      );

      if (result.success) {
        onDownloadSuccess?.(result.filePath!);
        
        Alert.alert(
          'Téléchargement réussi',
          `Le reçu PDF a été téléchargé avec succès.\n${result.filePath}`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors du téléchargement du PDF';
      onDownloadError?.(errorMessage);
      
      Alert.alert(
        'Erreur de téléchargement',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];
    
    switch (variant) {
      case 'primary':
        return [...baseStyle, styles.primary];
      case 'secondary':
        return [...baseStyle, styles.secondary];
      case 'outline':
        return [...baseStyle, styles.outline];
      default:
        return [...baseStyle, styles.primary];
    }
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${size}Text`]];
    
    switch (variant) {
      case 'primary':
        return [...baseStyle, styles.primaryText];
      case 'secondary':
        return [...baseStyle, styles.secondaryText];
      case 'outline':
        return [...baseStyle, styles.outlineText];
      default:
        return [...baseStyle, styles.primaryText];
    }
  };

  const getButtonContent = () => {
    if (isDownloading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={variant === 'outline' ? '#007AFF' : '#FFFFFF'}
          />
          {showLoadingText && (
            <Text style={[getTextStyle(), styles.loadingText]}>
              Génération...
            </Text>
          )}
        </View>
      );
    }

    return (
      <Text style={[getTextStyle(), textStyle]}>
        📄 Télécharger PDF
      </Text>
    );
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={handleDownload}
      disabled={isDownloading}
      activeOpacity={0.7}
    >
      {getButtonContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  // Sizes
  small: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 52,
  },
  
  // Variants
  primary: {
    backgroundColor: '#007AFF',
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: '#34C759',
    borderWidth: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  
  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  
  // Text colors
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: '#007AFF',
  },
  
  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
  },
});

export default ReceiptPdfButton;
