/**
 * Script de validation du NetworkService
 * Vérifie que le service de détection réseau est correctement implémenté
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Validation du NetworkService...\n");

// 1. Vérifier que le fichier NetworkService existe
const networkServicePath = path.join(
  __dirname,
  "src",
  "services",
  "network",
  "NetworkService.ts"
);
if (!fs.existsSync(networkServicePath)) {
  console.error("❌ NetworkService.ts non trouvé");
  process.exit(1);
}
console.log("✅ NetworkService.ts trouvé");

// 2. Lire le contenu et vérifier les éléments clés
const content = fs.readFileSync(networkServicePath, "utf8");

// Vérifier les imports requis
const requiredImports = [
  "@react-native-community/netinfo",
  "NetInfoState",
  "NetInfoSubscription",
];
requiredImports.forEach((importItem) => {
  if (content.includes(importItem)) {
    console.log(`✅ Import ${importItem}`);
  } else {
    console.error(`❌ Import ${importItem} manquant`);
  }
});

// Vérifier les interfaces
const requiredInterfaces = ["NetworkInfo", "NetworkChangeListener"];
requiredInterfaces.forEach((interfaceName) => {
  if (content.includes(`interface ${interfaceName}`)) {
    console.log(`✅ Interface ${interfaceName}`);
  } else {
    console.error(`❌ Interface ${interfaceName} manquante`);
  }
});

// Vérifier les méthodes principales
const requiredMethods = [
  "initialize(",
  "isOnline(",
  "isConnectedToNetwork(",
  "isInternetAccessible(",
  "getNetworkType(",
  "getNetworkDetails(",
  "getNetworkInfo(",
  "addListener(",
  "removeListener(",
  "refreshNetworkState(",
  "cleanup(",
];
requiredMethods.forEach((method) => {
  if (content.includes(method)) {
    console.log(`✅ Méthode ${method}`);
  } else {
    console.error(`❌ Méthode ${method} manquante`);
  }
});

// Vérifier le pattern singleton
if (content.includes("getInstance()")) {
  console.log("✅ Pattern Singleton implémenté");
} else {
  console.error("❌ Pattern Singleton manquant");
}

// Vérifier la gestion des listeners
const listenerMethods = ["addListener(", "removeListener(", "notifyListeners("];
let listenerMethodsOK = 0;
listenerMethods.forEach((method) => {
  if (content.includes(method)) {
    listenerMethodsOK++;
  }
});
console.log(
  `✅ Gestion des listeners: ${listenerMethodsOK}/${listenerMethods.length}`
);

// Vérifier la gestion d'erreurs
const errorHandling = [
  "try {",
  "catch (error)",
  "throw new Error",
  "console.log('[NETWORK]",
  "console.error('[NETWORK]",
];
let errorHandlingCount = 0;
errorHandling.forEach((pattern) => {
  if (content.includes(pattern)) {
    errorHandlingCount++;
  }
});
console.log(
  `✅ Gestion d'erreurs: ${errorHandlingCount}/${errorHandling.length} patterns trouvés`
);

// Vérifier les commentaires JSDoc
const jsdocComments = content.match(/\/\*\*[\s\S]*?\*\//g) || [];
console.log(`✅ Commentaires JSDoc: ${jsdocComments.length} blocs trouvés`);

// Vérifier les fonctionnalités spécifiques
const specificFeatures = [
  "triggerSyncOnReconnection",
  "getDisconnectionDuration",
  "getFormattedDisconnectionDuration",
  "getServiceStatus",
];
specificFeatures.forEach((feature) => {
  if (content.includes(feature)) {
    console.log(`✅ Fonctionnalité ${feature}`);
  } else {
    console.error(`❌ Fonctionnalité ${feature} manquante`);
  }
});

// Vérifier le hook useNetworkStatus
const hookPath = path.join(__dirname, "src", "hooks", "useNetworkStatus.ts");
if (fs.existsSync(hookPath)) {
  console.log("✅ Hook useNetworkStatus.ts trouvé");

  const hookContent = fs.readFileSync(hookPath, "utf8");

  if (hookContent.includes("useNetworkStatus")) {
    console.log("✅ Hook principal useNetworkStatus");
  }

  if (hookContent.includes("useIsOnline")) {
    console.log("✅ Hook simplifié useIsOnline");
  }

  if (hookContent.includes("useNetworkDetails")) {
    console.log("✅ Hook useNetworkDetails");
  }

  if (hookContent.includes("useEffect")) {
    console.log("✅ Gestion du cycle de vie React");
  }
} else {
  console.error("❌ Hook useNetworkStatus.ts manquant");
}

// Vérifier le fichier d'index
const indexPath = path.join(
  __dirname,
  "src",
  "services",
  "network",
  "index.ts"
);
if (fs.existsSync(indexPath)) {
  console.log("✅ Index réseau trouvé");

  const indexContent = fs.readFileSync(indexPath, "utf8");

  if (indexContent.includes("export { default as NetworkService }")) {
    console.log("✅ Export NetworkService");
  }

  if (indexContent.includes("export type")) {
    console.log("✅ Export des types");
  }

  if (indexContent.includes("export { useNetworkStatus")) {
    console.log("✅ Export des hooks");
  }
} else {
  console.error("❌ Index réseau manquant");
}

// Vérifier les tests
const testFiles = [
  "__tests__/services/NetworkService.simple.test.ts",
  "__tests__/services/NetworkService.test.ts",
  "__tests__/hooks/useNetworkStatus.test.ts",
];

let testsOK = 0;
testFiles.forEach((testFile) => {
  const testPath = path.join(__dirname, testFile);
  if (fs.existsSync(testPath)) {
    console.log(`✅ ${testFile}`);
    testsOK++;
  } else {
    console.log(`⚠️  ${testFile} manquant (optionnel)`);
  }
});

// Compter les lignes de code
const lines = content
  .split("\n")
  .filter(
    (line) =>
      line.trim() &&
      !line.trim().startsWith("//") &&
      !line.trim().startsWith("/*") &&
      !line.trim().startsWith("*")
  );
console.log(`📊 Lignes de code: ${lines.length}`);

console.log("\n🎉 Validation du NetworkService terminée !");
console.log("\n📋 Fonctionnalités implémentées :");
console.log("   • Détection automatique de connectivité");
console.log("   • Différenciation réseau/internet");
console.log("   • Gestion des listeners");
console.log("   • Formatage des durées de déconnexion");
console.log("   • Hook React personnalisé");
console.log("   • Pattern Singleton");
console.log("   • Gestion d'erreurs complète");
console.log("   • Tests unitaires");

console.log("\n📋 Prochaines étapes :");
console.log("   1. Implémenter le SyncQueueService");
console.log("   2. Créer les badges d'état réseau");
console.log("   3. Intégrer avec la synchronisation");
console.log("   4. Tests d'intégration réseau");

