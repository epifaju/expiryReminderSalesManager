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

interface CreateReceiptButtonProps {
  saleId: number;
  saleNumber?: string;
  onReceiptCreated?: (receipt: Receipt) => void;
  onError?: (error: string) => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  showLoadingText?: boolean;
  style?: any;
  textStyle?: any;
}

export const CreateReceiptButton: React.FC<CreateReceiptButtonProps> = ({
  saleId,
  saleNumber,
  onReceiptCreated,
  onError,
  variant = 'primary',
  size = 'medium',
  showLoadingText = true,
  style,
  textStyle,
}) => {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateReceipt = async () => {
    setIsCreating(true);

    try {
      const receipt = await receiptService.createReceipt(saleId);
      onReceiptCreated?.(receipt);
      
      Alert.alert(
        'Reçu créé avec succès',
        `Le reçu ${receipt.receiptNumber} a été généré pour la vente ${saleNumber || saleId}.`,
        [
          {
            text: 'Télécharger PDF',
            onPress: () => {
              // Ici on pourrait automatiquement déclencher le téléchargement
              console.log('Téléchargement automatique du PDF');
            },
          },
          { text: 'OK' },
        ]
      );
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la création du reçu';
      onError?.(errorMessage);
      
      Alert.alert(
        'Erreur de création',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsCreating(false);
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
    if (isCreating) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={variant === 'outline' ? '#007AFF' : '#FFFFFF'}
          />
          {showLoadingText && (
            <Text style={[getTextStyle(), styles.loadingText]}>
              Création...
            </Text>
          )}
        </View>
      );
    }

    return (
      <Text style={[getTextStyle(), textStyle]}>
        🧾 Créer Reçu
      </Text>
    );
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={handleCreateReceipt}
      disabled={isCreating}
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
    backgroundColor: '#34C759',
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: '#007AFF',
    borderWidth: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#34C759',
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
    color: '#34C759',
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

export default CreateReceiptButton;
