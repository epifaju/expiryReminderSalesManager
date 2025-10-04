import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import receiptService from '../services/receiptService.web';
import fileDownloadService from '../services/fileDownloadService.web';

interface CreateReceiptButtonProps {
  saleId: number;
  onReceiptCreated?: (receipt: any) => void;
  style?: any;
}

const CreateReceiptButton: React.FC<CreateReceiptButtonProps> = ({
  saleId,
  onReceiptCreated,
  style,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateReceipt = async () => {
    try {
      setIsLoading(true);
      
      // 1. Créer le reçu
      const receiptResponse = await receiptService.createReceipt({ saleId });
      
      if (receiptResponse.success) {
        Alert.alert(
          'Reçu créé !',
          `Le reçu ${receiptResponse.receipt.receiptNumber} a été généré avec succès.`,
          [
            {
              text: 'Télécharger PDF',
              onPress: () => downloadReceiptPdf(receiptResponse.receipt.id),
            },
            { text: 'Fermer' },
          ]
        );
        
        // Appeler le callback
        if (onReceiptCreated) {
          onReceiptCreated(receiptResponse.receipt);
        }
      }
    } catch (error: any) {
      console.error('Erreur création reçu:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Impossible de créer le reçu',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReceiptPdf = async (receiptId: number) => {
    try {
      setIsLoading(true);
      
      // Télécharger le PDF
      const pdfData = await receiptService.downloadReceiptPdf(receiptId);
      
      // Télécharger le fichier
      const fileName = `receipt-${receiptId}-${Date.now()}.pdf`;
      await fileDownloadService.downloadAndSavePdf(pdfData, fileName);
      
    } catch (error: any) {
      console.error('Erreur téléchargement PDF:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Impossible de télécharger le PDF',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleCreateReceipt}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          <Text style={styles.icon}>🧾</Text>
          <Text style={styles.text}>Générer Reçu</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CreateReceiptButton;
