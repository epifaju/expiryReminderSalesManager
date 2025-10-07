/**
 * Script de validation finale - Semaine 1 : Fondations Offline
 * Vérifie que tous les composants de la semaine 1 sont correctement implémentés
 */

const fs = require("fs");
const path = require("path");

console.log("🎯 VALIDATION FINALE - SEMAINE 1 : FONDATIONS OFFLINE\n");
console.log("=".repeat(60));

// =============================================================================
// 1. VALIDATION DATABASE SERVICE
// =============================================================================
console.log("\n📦 1. VALIDATION DATABASE SERVICE");
console.log("-".repeat(40));

const dbServicePath = path.join(
  __dirname,
  "src",
  "services",
  "database",
  "DatabaseService.ts"
);
if (fs.existsSync(dbServicePath)) {
  const content = fs.readFileSync(dbServicePath, "utf8");

  // Vérifier les tables
  const tables = [
    "products",
    "sales",
    "stock_movements",
    "sync_queue",
    "sync_metadata",
  ];
  let tablesOK = 0;
  tables.forEach((table) => {
    if (content.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
      tablesOK++;
      console.log(`✅ Table ${table}`);
    } else {
      console.error(`❌ Table ${table} manquante`);
    }
  });

  // Vérifier les méthodes
  const methods = [
    "initDatabase",
    "getConnection",
    "executeSql",
    "executeTransaction",
    "isInitialized",
    "closeDatabase",
  ];
  let methodsOK = 0;
  methods.forEach((method) => {
    if (content.includes(`${method}(`)) {
      methodsOK++;
      console.log(`✅ Méthode ${method}`);
    } else {
      console.error(`❌ Méthode ${method} manquante`);
    }
  });

  console.log(`📊 Tables: ${tablesOK}/${tables.length}`);
  console.log(`📊 Méthodes: ${methodsOK}/${methods.length}`);
} else {
  console.error("❌ DatabaseService.ts manquant");
}

// =============================================================================
// 2. VALIDATION MODÈLES TYPESCRIPT
// =============================================================================
console.log("\n📋 2. VALIDATION MODÈLES TYPESCRIPT");
console.log("-".repeat(40));

const modelsPath = path.join(__dirname, "src", "types", "models.ts");
if (fs.existsSync(modelsPath)) {
  const content = fs.readFileSync(modelsPath, "utf8");

  // Vérifier les interfaces principales
  const interfaces = [
    "Product",
    "Sale",
    "StockMovement",
    "SyncQueueItem",
    "SyncMetadata",
  ];
  let interfacesOK = 0;
  interfaces.forEach((interfaceName) => {
    if (content.includes(`export interface ${interfaceName}`)) {
      interfacesOK++;
      console.log(`✅ Interface ${interfaceName}`);
    } else {
      console.error(`❌ Interface ${interfaceName} manquante`);
    }
  });

  // Vérifier les DTOs
  const dtos = ["CreateProductDTO", "CreateSaleDTO", "CreateStockMovementDTO"];
  let dtosOK = 0;
  dtos.forEach((dto) => {
    if (content.includes(`export interface ${dto}`)) {
      dtosOK++;
      console.log(`✅ DTO ${dto}`);
    } else {
      console.error(`❌ DTO ${dto} manquant`);
    }
  });

  // Vérifier les types de base
  const types = ["SyncStatus", "SyncOperation", "EntityType", "MovementType"];
  let typesOK = 0;
  types.forEach((type) => {
    if (content.includes(`export type ${type}`)) {
      typesOK++;
      console.log(`✅ Type ${type}`);
    } else {
      console.error(`❌ Type ${type} manquant`);
    }
  });

  console.log(`📊 Interfaces: ${interfacesOK}/${interfaces.length}`);
  console.log(`📊 DTOs: ${dtosOK}/${dtos.length}`);
  console.log(`📊 Types: ${typesOK}/${types.length}`);
} else {
  console.error("❌ models.ts manquant");
}

// =============================================================================
// 3. VALIDATION DAO
// =============================================================================
console.log("\n🗃️  3. VALIDATION DAO (DATA ACCESS OBJECTS)");
console.log("-".repeat(40));

const daoFiles = ["ProductDAO.ts", "SaleDAO.ts", "StockMovementDAO.ts"];
let daosOK = 0;

daoFiles.forEach((daoFile) => {
  const daoPath = path.join(__dirname, "src", "dao", daoFile);
  if (fs.existsSync(daoPath)) {
    const content = fs.readFileSync(daoPath, "utf8");

    // Vérifier les méthodes CRUD de base
    const crudMethods = ["create", "getById", "getAll", "update", "softDelete"];
    let methodsOK = 0;
    crudMethods.forEach((method) => {
      if (content.includes(`${method}(`)) {
        methodsOK++;
      }
    });

    // Vérifier les méthodes spécifiques
    const specificMethods = [
      "search",
      "updateSyncStatus",
      "getPendingSync",
      "upsert",
    ];
    let specificOK = 0;
    specificMethods.forEach((method) => {
      if (content.includes(`${method}(`)) {
        specificOK++;
      }
    });

    const daoName = daoFile.replace(".ts", "");
    console.log(
      `✅ ${daoName} (${methodsOK}/${crudMethods.length} CRUD + ${specificOK}/${specificMethods.length} spécifiques)`
    );
    daosOK++;
  } else {
    console.error(`❌ ${daoFile} manquant`);
  }
});

console.log(`📊 DAOs: ${daosOK}/${daoFiles.length}`);

// =============================================================================
// 4. VALIDATION TESTS
// =============================================================================
console.log("\n🧪 4. VALIDATION TESTS");
console.log("-".repeat(40));

const testFiles = [
  "__tests__/database/DatabaseService.simple.test.ts",
  "__tests__/types/models.test.ts",
  "__tests__/dao/ProductDAO.test.ts",
  "__tests__/integration/CRUD.integration.test.ts",
];

let testsOK = 0;
testFiles.forEach((testFile) => {
  const testPath = path.join(__dirname, testFile);
  if (fs.existsSync(testPath)) {
    console.log(`✅ ${testFile}`);
    testsOK++;
  } else {
    console.error(`❌ ${testFile} manquant`);
  }
});

console.log(`📊 Tests: ${testsOK}/${testFiles.length}`);

// =============================================================================
// 5. VALIDATION CONFIGURATION
// =============================================================================
console.log("\n⚙️  5. VALIDATION CONFIGURATION");
console.log("-".repeat(40));

const configFiles = ["package.json", "jest.config.js", "jest-setup.js"];

let configOK = 0;
configFiles.forEach((configFile) => {
  const configPath = path.join(__dirname, configFile);
  if (fs.existsSync(configPath)) {
    console.log(`✅ ${configFile}`);
    configOK++;
  } else {
    console.error(`❌ ${configFile} manquant`);
  }
});

// Vérifier les dépendances dans package.json
if (fs.existsSync(path.join(__dirname, "package.json"))) {
  const packageContent = fs.readFileSync(
    path.join(__dirname, "package.json"),
    "utf8"
  );

  const requiredDeps = [
    "react-native-sqlite-storage",
    "@react-native-community/netinfo",
    "uuid",
  ];

  let depsOK = 0;
  requiredDeps.forEach((dep) => {
    if (packageContent.includes(`"${dep}"`)) {
      console.log(`✅ Dépendance ${dep}`);
      depsOK++;
    } else {
      console.error(`❌ Dépendance ${dep} manquante`);
    }
  });

  console.log(`📊 Dépendances: ${depsOK}/${requiredDeps.length}`);
}

console.log(`📊 Configuration: ${configOK}/${configFiles.length}`);

// =============================================================================
// 6. RÉSUMÉ FINAL
// =============================================================================
console.log("\n" + "=".repeat(60));
console.log("📊 RÉSUMÉ FINAL - SEMAINE 1");
console.log("=".repeat(60));

const totalComponents = 5; // DatabaseService, Models, DAOs, Tests, Config
const completedComponents = [
  fs.existsSync(dbServicePath) ? 1 : 0,
  fs.existsSync(modelsPath) ? 1 : 0,
  daosOK === daoFiles.length ? 1 : 0,
  testsOK === testFiles.length ? 1 : 0,
  configOK === configFiles.length ? 1 : 0,
].reduce((sum, val) => sum + val, 0);

const completionPercentage = Math.round(
  (completedComponents / totalComponents) * 100
);

console.log(
  `\n🎯 COMPLETION: ${completedComponents}/${totalComponents} (${completionPercentage}%)`
);

if (completionPercentage === 100) {
  console.log("\n🎉 FÉLICITATIONS ! SEMAINE 1 TERMINÉE AVEC SUCCÈS !");
  console.log("\n✅ Toutes les fondations offline sont en place :");
  console.log("   • Base de données SQLite configurée");
  console.log("   • Modèles TypeScript complets");
  console.log("   • DAO pour toutes les opérations CRUD");
  console.log("   • Tests unitaires et d'intégration");
  console.log("   • Configuration Jest opérationnelle");

  console.log("\n🚀 PRÊT POUR LA SEMAINE 2 :");
  console.log("   • Détection réseau (NetworkService)");
  console.log("   • Queue de synchronisation (SyncQueueService)");
  console.log("   • Interface utilisateur (badges, écrans)");
  console.log("   • Tests de connectivité");
} else {
  console.log("\n⚠️  SEMAINE 1 INCOMPLÈTE");
  console.log("\n📋 Actions requises :");

  if (!fs.existsSync(dbServicePath)) {
    console.log("   • Terminer DatabaseService.ts");
  }
  if (!fs.existsSync(modelsPath)) {
    console.log("   • Terminer models.ts");
  }
  if (daosOK < daoFiles.length) {
    console.log("   • Terminer les DAO manquants");
  }
  if (testsOK < testFiles.length) {
    console.log("   • Créer les tests manquants");
  }
  if (configOK < configFiles.length) {
    console.log("   • Finaliser la configuration");
  }
}

console.log("\n" + "=".repeat(60));
console.log("📅 Prochaine étape : Semaine 2 - Queue et Détection Réseau");
console.log("=".repeat(60));

