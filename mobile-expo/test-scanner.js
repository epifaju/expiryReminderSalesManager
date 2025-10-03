// Test simple du scanner - à exécuter dans l'app
console.log("🔍 Test scanner en cours...");

import { Platform } from "react-native";

// Test des permissions
const testCamera = async () => {
  try {
    const { Camera } = await import("expo-camera");
    console.log("📱 Caméra importée avec succès");

    const { status } = await Camera.requestCameraPermissionsAsync();
    console.log("🔒 Permission caméra:", status);

    return status === "granted";
  } catch (error) {
    console.error("❌ Erreur caméra:", error);
    return false;
  }
};

if (Platform.OS !== "web") {
  testCamera();
} else {
  console.log("🌐 Mode web détecté - scanner non disponible");
}
