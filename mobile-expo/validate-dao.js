/**
 * Script de validation des DAO (Data Access Objects)
 * Vérifie que tous les DAO sont correctement implémentés
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Validation des DAO...\n");

// 1. Vérifier que tous les fichiers DAO existent
const daoFiles = [
  "ProductDAO.ts",
  "SaleDAO.ts",
  "StockMovementDAO.ts",
  "index.ts",
];

daoFiles.forEach((fileName) => {
  const filePath = path.join(__dirname, "src", "dao", fileName);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${fileName} trouvé`);
  } else {
    console.error(`❌ ${fileName} manquant`);
  }
});

// 2. Vérifier ProductDAO
console.log("\n📦 Validation ProductDAO...");
const productDAOPath = path.join(__dirname, "src", "dao", "ProductDAO.ts");
if (fs.existsSync(productDAOPath)) {
  const content = fs.readFileSync(productDAOPath, "utf8");

  const requiredMethods = [
    "create(",
    "getById(",
    "getAll(",
    "update(",
    "softDelete(",
    "search(",
    "updateSyncStatus(",
    "getPendingSync(",
    "upsert(",
    "count(",
  ];

  requiredMethods.forEach((method) => {
    if (content.includes(method)) {
      console.log(`✅ Méthode ${method} définie`);
    } else {
      console.error(`❌ Méthode ${method} manquante`);
    }
  });

  // Vérifier les imports
  if (content.includes("import { v4 as uuidv4 } from 'uuid'")) {
    console.log("✅ Import UUID correct");
  } else {
    console.error("❌ Import UUID manquant");
  }

  if (content.includes("import DatabaseService")) {
    console.log("✅ Import DatabaseService correct");
  } else {
    console.error("❌ Import DatabaseService manquant");
  }

  // Vérifier les commentaires
  const commentCount = (content.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
  console.log(`✅ Commentaires JSDoc: ${commentCount} blocs`);
}

// 3. Vérifier SaleDAO
console.log("\n💰 Validation SaleDAO...");
const saleDAOPath = path.join(__dirname, "src", "dao", "SaleDAO.ts");
if (fs.existsSync(saleDAOPath)) {
  const content = fs.readFileSync(saleDAOPath, "utf8");

  const requiredMethods = [
    "create(",
    "getById(",
    "getAll(",
    "getAllWithProducts(",
    "update(",
    "softDelete(",
    "search(",
    "updateSyncStatus(",
    "getPendingSync(",
    "upsert(",
    "count(",
    "getTotalAmount(",
  ];

  requiredMethods.forEach((method) => {
    if (content.includes(method)) {
      console.log(`✅ Méthode ${method} définie`);
    } else {
      console.error(`❌ Méthode ${method} manquante`);
    }
  });

  // Vérifier la gestion des relations
  if (content.includes("SaleWithProduct")) {
    console.log("✅ Gestion des relations avec produits");
  } else {
    console.error("❌ Gestion des relations manquante");
  }
}

// 4. Vérifier StockMovementDAO
console.log("\n📊 Validation StockMovementDAO...");
const stockDAOPath = path.join(__dirname, "src", "dao", "StockMovementDAO.ts");
if (fs.existsSync(stockDAOPath)) {
  const content = fs.readFileSync(stockDAOPath, "utf8");

  const requiredMethods = [
    "create(",
    "getById(",
    "getAll(",
    "getByProduct(",
    "update(",
    "softDelete(",
    "search(",
    "updateSyncStatus(",
    "getPendingSync(",
    "upsert(",
    "getSummaryByProduct(",
    "count(",
  ];

  requiredMethods.forEach((method) => {
    if (content.includes(method)) {
      console.log(`✅ Méthode ${method} définie`);
    } else {
      console.error(`❌ Méthode ${method} manquante`);
    }
  });

  // Vérifier la gestion des mouvements
  if (content.includes("MovementType")) {
    console.log("✅ Gestion des types de mouvement");
  } else {
    console.error("❌ Types de mouvement manquants");
  }
}

// 5. Vérifier l'index
console.log("\n📁 Validation index.ts...");
const indexPath = path.join(__dirname, "src", "dao", "index.ts");
if (fs.existsSync(indexPath)) {
  const content = fs.readFileSync(indexPath, "utf8");

  if (content.includes("export { ProductDAO }")) {
    console.log("✅ Export ProductDAO");
  } else {
    console.error("❌ Export ProductDAO manquant");
  }

  if (content.includes("export { SaleDAO }")) {
    console.log("✅ Export SaleDAO");
  } else {
    console.error("❌ Export SaleDAO manquant");
  }

  if (content.includes("export { StockMovementDAO }")) {
    console.log("✅ Export StockMovementDAO");
  } else {
    console.error("❌ Export StockMovementDAO manquant");
  }

  if (content.includes("export { default as productDAO }")) {
    console.log("✅ Export instances singleton");
  } else {
    console.error("❌ Export instances singleton manquant");
  }
}

// 6. Compter les lignes de code totales
console.log("\n📊 Statistiques...");
let totalLines = 0;
daoFiles.slice(0, -1).forEach((fileName) => {
  // Exclure index.ts
  const filePath = path.join(__dirname, "src", "dao", fileName);
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

// 7. Vérifier les tests
console.log("\n🧪 Validation des tests...");
const testFiles = [
  "ProductDAO.test.ts",
  "SaleDAO.test.ts",
  "StockMovementDAO.test.ts",
];

testFiles.forEach((testFile) => {
  const testPath = path.join(__dirname, "__tests__", "dao", testFile);
  if (fs.existsSync(testPath)) {
    console.log(`✅ ${testFile} trouvé`);
  } else {
    console.log(`⚠️  ${testFile} manquant (optionnel)`);
  }
});

console.log("\n🎉 Validation des DAO terminée !");
console.log("\n📋 Prochaines étapes :");
console.log("   1. Tester l'intégration avec la base de données");
console.log("   2. Créer les tests E2E pour les opérations CRUD");
console.log("   3. Implémenter la synchronisation (Semaine 2)");


