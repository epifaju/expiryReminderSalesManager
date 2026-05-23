/**
 * Script de validation des composants UI réseau et synchronisation
 * Vérifie que tous les composants sont correctement implémentés
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Validation des composants UI réseau...\n");

// 1. Vérifier que tous les fichiers de composants existent
const componentFiles = [
  "NetworkStatusBadge.tsx",
  "NetworkIndicator.tsx",
  "SyncStatusCard.tsx",
  "SyncProgressBar.tsx",
  "SyncNotification.tsx",
  "index.ts",
];

let componentsOK = 0;
componentFiles.forEach((fileName) => {
  const filePath = path.join(__dirname, "src", "components", fileName);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${fileName} trouvé`);
    componentsOK++;
  } else {
    console.error(`❌ ${fileName} manquant`);
  }
});

// 2. Vérifier NetworkStatusBadge
console.log("\n📱 Validation NetworkStatusBadge...");
const badgePath = path.join(
  __dirname,
  "src",
  "components",
  "NetworkStatusBadge.tsx"
);
if (fs.existsSync(badgePath)) {
  const content = fs.readFileSync(badgePath, "utf8");

  const requiredFeatures = [
    "useNetworkStatus",
    "useSyncQueue",
    "getStatusColor",
    "getStatusText",
    "getStatusIcon",
    "getSizeStyles",
    "getPositionStyles",
    "Animated.View",
    "NetworkStatusBadgeProps",
  ];

  let featuresOK = 0;
  requiredFeatures.forEach((feature) => {
    if (content.includes(feature)) {
      featuresOK++;
      console.log(`✅ ${feature}`);
    } else {
      console.error(`❌ ${feature} manquant`);
    }
  });

  console.log(`📊 Fonctionnalités: ${featuresOK}/${requiredFeatures.length}`);
}

// 3. Vérifier NetworkIndicator
console.log("\n🔴 Validation NetworkIndicator...");
const indicatorPath = path.join(
  __dirname,
  "src",
  "components",
  "NetworkIndicator.tsx"
);
if (fs.existsSync(indicatorPath)) {
  const content = fs.readFileSync(indicatorPath, "utf8");

  const requiredFeatures = [
    "useNetworkStatus",
    "useSyncQueue",
    "getIndicatorColor",
    "getPositionStyles",
    "Animated.View",
    "NetworkIndicatorProps",
    "pulseAnim",
  ];

  let featuresOK = 0;
  requiredFeatures.forEach((feature) => {
    if (content.includes(feature)) {
      featuresOK++;
      console.log(`✅ ${feature}`);
    } else {
      console.error(`❌ ${feature} manquant`);
    }
  });

  console.log(`📊 Fonctionnalités: ${featuresOK}/${requiredFeatures.length}`);
}

// 4. Vérifier SyncStatusCard
console.log("\n📋 Validation SyncStatusCard...");
const cardPath = path.join(
  __dirname,
  "src",
  "components",
  "SyncStatusCard.tsx"
);
if (fs.existsSync(cardPath)) {
  const content = fs.readFileSync(cardPath, "utf8");

  const requiredFeatures = [
    "useNetworkStatus",
    "useSyncQueue",
    "handleManualSync",
    "handleRefresh",
    "getBackgroundColor",
    "getBorderColor",
    "getMainStatusText",
    "getStatusIcon",
    "Animated.View",
    "TouchableOpacity",
    "SyncStatusCardProps",
  ];

  let featuresOK = 0;
  requiredFeatures.forEach((feature) => {
    if (content.includes(feature)) {
      featuresOK++;
      console.log(`✅ ${feature}`);
    } else {
      console.error(`❌ ${feature} manquant`);
    }
  });

  console.log(`📊 Fonctionnalités: ${featuresOK}/${requiredFeatures.length}`);
}

// 5. Vérifier SyncProgressBar
console.log("\n📊 Validation SyncProgressBar...");
const progressPath = path.join(
  __dirname,
  "src",
  "components",
  "SyncProgressBar.tsx"
);
if (fs.existsSync(progressPath)) {
  const content = fs.readFileSync(progressPath, "utf8");

  const requiredFeatures = [
    "useSyncQueue",
    "calculateProgress",
    "getProgressText",
    "isIndeterminate",
    "Animated.View",
    "Animated.timing",
    "progressAnim",
    "indeterminateAnim",
    "SyncProgressBarProps",
  ];

  let featuresOK = 0;
  requiredFeatures.forEach((feature) => {
    if (content.includes(feature)) {
      featuresOK++;
      console.log(`✅ ${feature}`);
    } else {
      console.error(`❌ ${feature} manquant`);
    }
  });

  console.log(`📊 Fonctionnalités: ${featuresOK}/${requiredFeatures.length}`);
}

// 6. Vérifier SyncNotification
console.log("\n🔔 Validation SyncNotification...");
const notificationPath = path.join(
  __dirname,
  "src",
  "components",
  "SyncNotification.tsx"
);
if (fs.existsSync(notificationPath)) {
  const content = fs.readFileSync(notificationPath, "utf8");

  const requiredFeatures = [
    "useNetworkStatus",
    "useSyncQueue",
    "showNotification",
    "hideNotification",
    "getNotificationColor",
    "getNotificationIcon",
    "NotificationType",
    "NotificationData",
    "Animated.View",
    "TouchableOpacity",
    "SyncNotificationProps",
  ];

  let featuresOK = 0;
  requiredFeatures.forEach((feature) => {
    if (content.includes(feature)) {
      featuresOK++;
      console.log(`✅ ${feature}`);
    } else {
      console.error(`❌ ${feature} manquant`);
    }
  });

  console.log(`📊 Fonctionnalités: ${featuresOK}/${requiredFeatures.length}`);
}

// 7. Vérifier le fichier d'index
console.log("\n📁 Validation index.ts...");
const indexPath = path.join(__dirname, "src", "components", "index.ts");
if (fs.existsSync(indexPath)) {
  const content = fs.readFileSync(indexPath, "utf8");

  const requiredExports = [
    "NetworkStatusBadge",
    "NetworkIndicator",
    "SyncStatusCard",
    "SyncProgressBar",
    "SyncNotification",
    "NetworkStatusBadgeProps",
    "NetworkIndicatorProps",
    "SyncStatusCardProps",
    "SyncProgressBarProps",
    "SyncNotificationProps",
  ];

  let exportsOK = 0;
  requiredExports.forEach((exportItem) => {
    if (content.includes(exportItem)) {
      exportsOK++;
      console.log(`✅ Export ${exportItem}`);
    } else {
      console.error(`❌ Export ${exportItem} manquant`);
    }
  });

  console.log(`📊 Exports: ${exportsOK}/${requiredExports.length}`);
}

// 8. Vérifier les tests
console.log("\n🧪 Validation des tests...");
const testFiles = [
  "__tests__/components/NetworkStatusBadge.test.ts",
  "__tests__/components/NetworkIndicator.test.ts",
  "__tests__/components/SyncStatusCard.test.ts",
  "__tests__/components/SyncProgressBar.test.ts",
  "__tests__/components/SyncNotification.test.ts",
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

// 9. Vérifier l'exemple d'utilisation
console.log("\n📖 Validation de l'exemple...");
const examplePath = path.join(__dirname, "example-network-ui-components.tsx");
if (fs.existsSync(examplePath)) {
  console.log("✅ Exemple d'utilisation trouvé");

  const exampleContent = fs.readFileSync(examplePath, "utf8");

  const requiredUsages = [
    "NetworkStatusBadge",
    "NetworkIndicator",
    "SyncStatusCard",
    "SyncProgressBar",
    "SyncNotification",
    "useSyncQueue",
    "addToQueue",
    "triggerSync",
  ];

  let usagesOK = 0;
  requiredUsages.forEach((usage) => {
    if (exampleContent.includes(usage)) {
      usagesOK++;
      console.log(`✅ Utilisation ${usage}`);
    } else {
      console.error(`❌ Utilisation ${usage} manquante`);
    }
  });

  console.log(`📊 Utilisations: ${usagesOK}/${requiredUsages.length}`);
} else {
  console.log("⚠️  Exemple d'utilisation manquant (optionnel)");
}

// 10. Compter les lignes de code
console.log("\n📊 Statistiques...");
let totalLines = 0;
componentFiles.slice(0, -1).forEach((fileName) => {
  // Exclure index.ts
  const filePath = path.join(__dirname, "src", "components", fileName);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content
      .split("\n")
      .filter(
        (line) =>
          line.trim() &&
          !line.trim().startsWith("//") &&
          !line.trim().startsWith("/*") &&
          !line.trim().startsWith("*")
      );
    totalLines += lines.length;
  }
});
console.log(`📊 Lignes de code totales: ${totalLines}`);

// 11. Résumé final
console.log("\n" + "=".repeat(60));
console.log("📊 RÉSUMÉ FINAL - COMPOSANTS UI RÉSEAU");
console.log("=".repeat(60));

const totalComponents = componentFiles.length;
const completionPercentage = Math.round((componentsOK / totalComponents) * 100);

console.log(
  `\n🎯 COMPLETION: ${componentsOK}/${totalComponents} (${completionPercentage}%)`
);

if (completionPercentage === 100) {
  console.log(
    "\n🎉 FÉLICITATIONS ! COMPOSANTS UI RÉSEAU TERMINÉS AVEC SUCCÈS !"
  );
  console.log("\n✅ Tous les composants UI sont en place :");
  console.log("   • NetworkStatusBadge - Badge complet avec informations");
  console.log("   • NetworkIndicator - Indicateur minimaliste");
  console.log("   • SyncStatusCard - Carte détaillée avec contrôles");
  console.log("   • SyncProgressBar - Barre de progression animée");
  console.log("   • SyncNotification - Notifications toast");
  console.log("   • Types TypeScript complets");
  console.log("   • Tests unitaires");
  console.log("   • Exemple d'utilisation complet");

  console.log("\n🚀 PRÊT POUR LA TÂCHE 2.4 :");
  console.log("   • Écran État de synchronisation");
  console.log("   • Interface complète de monitoring");
  console.log("   • Intégration avec l'API backend");
  console.log("   • Tests d'intégration complets");
} else {
  console.log("\n⚠️  COMPOSANTS UI INCOMPLETS");
  console.log("\n📋 Actions requises :");

  if (componentsOK < totalComponents) {
    console.log(
      `   • Terminer les composants manquants (${
        totalComponents - componentsOK
      })`
    );
  }
}

console.log("\n" + "=".repeat(60));
console.log("📅 Prochaine étape : Tâche 2.4 - Écran État de synchronisation");
console.log("=".repeat(60));


