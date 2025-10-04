import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Alert, TouchableOpacity, Modal, Dimensions, Platform } from 'react-native';
import { Camera, CameraType, PermissionStatus } from 'expo-camera';
import { BarCodeScanner as ExpoBarCodeScanner } from 'expo-barcode-scanner';

interface BarcodeScannerProps {
  isVisible: boolean;
  onScan: (barcode: string) => void;
  onClose: () => void;
  title?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  isVisible,
  onScan,
  onClose,
  title = "Scanner le code-barres"
}) => {
  const [scanned, setScanned] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    if (isVisible) {
      console.log('📱 Démarrage de l\'écran scanner...');
      setScanned(false);
    }
  }, [isVisible]);

  // Demande de permission caméra avec la nouvelle API
  useEffect(() => {
    const getCameraPermission = async () => {
      console.log('📱 Demande de permission pour la caméra...');
      const { status } = await Camera.requestCameraPermissionsAsync();
      console.log('📱 Statut de permission:', status);
      setHasPermission(status === PermissionStatus.GRANTED);
    };

    if (isVisible) {
      getCameraPermission();
    }
  }, [isVisible]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    console.log('🎯 Code-barres détecté:', { type, data });
    setScanned(true);
    
    // Alerte de confirmation
    Alert.alert(
      'Code-barres détecté',
      `Valeur: ${data}\nType: ${type}`,
      [
        { text: 'Annuler', onPress: () => setScanned(false) },
        { text: 'Valider', onPress: () => onScan(data) }
      ]
    );
  };

  const handleClose = () => {
    setScanned(false);
    onClose();
  };

  console.log('🎥 BarcodeScanner render - isVisible:', isVisible, 'hasPermission:', hasPermission);
  
  if (!isVisible) {
    console.log('🎥 BarcodeScanner: Composant masqué (isVisible=false)');
    return null;
  }
  console.log('🎥 BarcodeScanner: Début du rendu du composant');

  // Mode web - non supporté
  if (Platform.OS === 'web') {
    console.log('🎥 BarcodeScanner: Mode web détecté');
    return (
      <Modal visible={isVisible} animationType="slide">
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.scannerContainer}>
            <Text style={styles.instructionText}>
              🚫 Scanner non disponible dans le navigateur web
            </Text>
            <Text style={styles.instructionSubtext}>
              Veuillez utiliser l'application mobile sur votre téléphone
            </Text>
            <TouchableOpacity style={styles.manualButton} onPress={handleClose}>
              <Text style={styles.manualButtonText}>Saisie manuelle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Permission refusée
  if (hasPermission === false) {
    console.log('🎥 BarcodeScanner: Permission refusée (hasPermission=false)');
    return (
      <Modal visible={isVisible} animationType="slide">
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.scannerContainer}>
            <Text style={styles.instructionText}>
              ❌ Permission caméra refusée
            </Text>
            <Text style={styles.instructionSubtext}>
              Veuillez autoriser l'accès à la caméra dans les paramètres de votre appareil
            </Text>
            <TouchableOpacity style={styles.manualButton} onPress={handleClose}>
              <Text style={styles.manualButtonText}>Saisie manuelle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Demande de permission en cours
  if (hasPermission === null) {
    console.log('🎥 BarcodeScanner: Demande de permission en cours (hasPermission=null)');
    return (
      <Modal visible={isVisible} animationType="slide">
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.scannerContainer}>
            <Text style={styles.permissionText}>Demande d'autorisation...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  // Scanner actif - nouvelle implémentation avec expo-camera
  console.log('🎥 BarcodeScanner: Scanner actif - rendu de la caméra');
  return (
    <Modal visible={isVisible} animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scannerContainer}>
          <Camera
            ref={cameraRef}
            style={styles.scanner}
            type={CameraType.back}
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            barCodeScannerSettings={{
              barCodeTypes: [
                ExpoBarCodeScanner.Constants.BarCodeType.qr,
                ExpoBarCodeScanner.Constants.BarCodeType.code128,
                ExpoBarCodeScanner.Constants.BarCodeType.ean13,
                ExpoBarCodeScanner.Constants.BarCodeType.ean8,
                ExpoBarCodeScanner.Constants.BarCodeType.code39,
                ExpoBarCodeScanner.Constants.BarCodeType.code93,
                ExpoBarCodeScanner.Constants.BarCodeType.codabar,
                ExpoBarCodeScanner.Constants.BarCodeType.pdf417,
                ExpoBarCodeScanner.Constants.BarCodeType.aztec
              ],
            }}
          />
          
          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              Positionnez le code-barres dans le cadre
            </Text>
            <Text style={styles.instructionSubtext}>
              Le scan se fera automatiquement
            </Text>
          </View>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          {scanned && (
            <TouchableOpacity style={styles.retryButton} onPress={() => setScanned(false)}>
              <Text style={styles.retryButtonText}>Scanner à nouveau</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.manualButton} onPress={handleClose}>
            <Text style={styles.manualButtonText}>Saisie manuelle</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanner: {
    width: '100%',
    height: '100%',
  },
  instructions: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionSubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
  },
  bottomControls: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  manualButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  manualButtonText: {
    color: '#666',
    fontSize: 14,
  },
  permissionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    padding: 20,
  },
});

export default BarcodeScanner;