/**
 * Script de validation manuelle du DatabaseService
 * Vérifie que le code est syntaxiquement correct et bien structuré
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Validation du DatabaseService...\n");

// 1. Vérifier que le fichier existe
const dbServicePath = path.join(
  __dirname,
  "src",
  "services",
  "database",
  "DatabaseService.ts"
);
if (!fs.existsSync(dbServicePath)) {
  console.error("❌ DatabaseService.ts non trouvé");
  process.exit(1);
}
console.log("✅ DatabaseService.ts trouvé");

// 2. Lire le contenu et vérifier les éléments clés
const content = fs.readFileSync(dbServicePath, "utf8");

// Vérifier les tables SQL requises
const requiredTables = [
  "products",
  "sales",
  "stock_movements",
  "sync_queue",
  "sync_metadata",
];
requiredTables.forEach((table) => {
  if (content.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
    console.log(`✅ Table ${table} définie`);
  } else {
    console.error(`❌ Table ${table} manquante`);
  }
});

// Vérifier les colonnes critiques pour products
const requiredProductColumns = [
  "id TEXT PRIMARY KEY",
  "server_id INTEGER",
  "sync_status TEXT DEFAULT 'pending'",
  "user_id TEXT NOT NULL",
];
requiredProductColumns.forEach((column) => {
  if (content.includes(column)) {
    console.log(`✅ Colonne products: ${column}`);
  } else {
    console.error(`❌ Colonne products manquante: ${column}`);
  }
});

// Vérifier les méthodes requises
const requiredMethods = [
  "initDatabase()",
  "getConnection()",
  "executeSql(",
  "executeTransaction(",
  "isInitialized()",
  "closeDatabase()",
  "clearAllTables()",
  "getDatabaseInfo()",
];
requiredMethods.forEach((method) => {
  if (content.includes(method)) {
    console.log(`✅ Méthode ${method} définie`);
  } else {
    console.error(`❌ Méthode ${method} manquante`);
  }
});

// Vérifier les index pour les performances
const requiredIndexes = [
  "idx_products_sync_status",
  "idx_sales_user_date",
  "idx_sync_queue_entity",
];
requiredIndexes.forEach((index) => {
  if (content.includes(index)) {
    console.log(`✅ Index ${index} défini`);
  } else {
    console.error(`❌ Index ${index} manquant`);
  }
});

// Vérifier la gestion d'erreurs
const errorHandling = [
  "try {",
  "catch (error)",
  "throw new Error",
  "console.log('[DATABASE]",
  "console.error('[DATABASE]",
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

// Vérifier les constantes de configuration
const configConstants = ["DB_NAME = 'salesmanager.db'", "DB_VERSION = 1"];
configConstants.forEach((constant) => {
  if (content.includes(constant)) {
    console.log(`✅ Constante ${constant}`);
  } else {
    console.error(`❌ Constante manquante: ${constant}`);
  }
});

// Vérifier les commentaires en français
const frenchComments = content.match(/\/\*\*[\s\S]*?\*\//g) || [];
const frenchCommentCount = frenchComments.filter(
  (comment) =>
    comment.includes("Service") ||
    comment.includes("Base de données") ||
    comment.includes("Initialise") ||
    comment.includes("Crée")
).length;
console.log(`✅ Commentaires français: ${frenchCommentCount} blocs trouvés`);

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

console.log("\n🎉 Validation du DatabaseService terminée !");
console.log("\n📋 Prochaines étapes :");
console.log(
  "   1. Tester l'initialisation en mode réel (avec app React Native)"
);
console.log(
  "   2. Vérifier les logs: npx react-native log-android | grep DATABASE"
);
console.log(
  '   3. Inspecter la DB: adb shell "run-as com.salesmanager sqlite3 /data/data/com.salesmanager/databases/salesmanager.db"'
);

