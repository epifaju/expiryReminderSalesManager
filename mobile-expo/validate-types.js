/**
 * Script de validation des modèles TypeScript
 * Vérifie que tous les types sont correctement définis et exportés
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Validation des modèles TypeScript...\n");

// 1. Vérifier que le fichier models.ts existe
const modelsPath = path.join(__dirname, "src", "types", "models.ts");
if (!fs.existsSync(modelsPath)) {
  console.error("❌ models.ts non trouvé");
  process.exit(1);
}
console.log("✅ models.ts trouvé");

// 2. Lire le contenu et vérifier les éléments clés
const content = fs.readFileSync(modelsPath, "utf8");

// Vérifier les interfaces principales
const requiredInterfaces = [
  "Product",
  "Sale",
  "StockMovement",
  "SyncQueueItem",
  "SyncMetadata",
];
requiredInterfaces.forEach((interfaceName) => {
  if (content.includes(`export interface ${interfaceName}`)) {
    console.log(`✅ Interface ${interfaceName} définie`);
  } else {
    console.error(`❌ Interface ${interfaceName} manquante`);
  }
});

// Vérifier les DTOs
const requiredDTOs = [
  "CreateProductDTO",
  "UpdateProductDTO",
  "CreateSaleDTO",
  "UpdateSaleDTO",
  "CreateStockMovementDTO",
  "CreateSyncQueueItemDTO",
  "CreateSyncMetadataDTO",
];
requiredDTOs.forEach((dtoName) => {
  if (content.includes(`export interface ${dtoName}`)) {
    console.log(`✅ DTO ${dtoName} défini`);
  } else {
    console.error(`❌ DTO ${dtoName} manquant`);
  }
});

// Vérifier les types de base
const requiredTypes = [
  "SyncStatus",
  "SyncOperation",
  "EntityType",
  "MovementType",
];
requiredTypes.forEach((typeName) => {
  if (content.includes(`export type ${typeName}`)) {
    console.log(`✅ Type ${typeName} défini`);
  } else {
    console.error(`❌ Type ${typeName} manquant`);
  }
});

// Vérifier les types de synchronisation
const syncTypes = [
  "SyncResult",
  "IdMapping",
  "SyncResponse",
  "ConflictInfo",
  "ServerUpdate",
  "DeltaSyncResponse",
];
syncTypes.forEach((typeName) => {
  if (content.includes(`export interface ${typeName}`)) {
    console.log(`✅ Type sync ${typeName} défini`);
  } else {
    console.error(`❌ Type sync ${typeName} manquant`);
  }
});

// Vérifier les types de recherche
const searchTypes = [
  "ProductSearchCriteria",
  "SaleSearchCriteria",
  "StockMovementSearchCriteria",
];
searchTypes.forEach((typeName) => {
  if (content.includes(`export interface ${typeName}`)) {
    console.log(`✅ Type recherche ${typeName} défini`);
  } else {
    console.error(`❌ Type recherche ${typeName} manquant`);
  }
});

// Vérifier les types de rapports
const reportTypes = ["SalesSummary", "TopProduct", "StockMovementSummary"];
reportTypes.forEach((typeName) => {
  if (content.includes(`export interface ${typeName}`)) {
    console.log(`✅ Type rapport ${typeName} défini`);
  } else {
    console.error(`❌ Type rapport ${typeName} manquant`);
  }
});

// Vérifier les types d'erreurs
const errorTypes = ["DatabaseError", "SyncError"];
errorTypes.forEach((typeName) => {
  if (content.includes(`export interface ${typeName}`)) {
    console.log(`✅ Type erreur ${typeName} défini`);
  } else {
    console.error(`❌ Type erreur ${typeName} manquant`);
  }
});

// Vérifier les commentaires JSDoc
const jsdocComments = content.match(/\/\*\*[\s\S]*?\*\//g) || [];
console.log(`✅ Commentaires JSDoc: ${jsdocComments.length} blocs trouvés`);

// Vérifier les exports
const exportCount = (
  content.match(/export\s+(interface|type|interface)/g) || []
).length;
console.log(`📊 Exports totaux: ${exportCount}`);

// Compter les lignes de code
const lines = content
  .split("\n")
  .filter(
    (line) =>
      line.trim() &&
      !line.trim().startsWith("//") &&
      !line.trim().startsWith("/*") &&
      !line.trim().startsWith("*") &&
      !line.trim().startsWith("/**")
  );
console.log(`📊 Lignes de code: ${lines.length}`);

// Vérifier le fichier index.ts
const indexPath = path.join(__dirname, "src", "types", "index.ts");
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, "utf8");
  if (indexContent.includes("export * from './models';")) {
    console.log("✅ Export centralisé dans index.ts");
  } else {
    console.error("❌ Export centralisé manquant dans index.ts");
  }
} else {
  console.error("❌ index.ts manquant");
}

console.log("\n🎉 Validation des modèles TypeScript terminée !");
console.log("\n📋 Prochaines étapes :");
console.log("   1. Créer les DAO (Data Access Objects)");
console.log("   2. Implémenter les opérations CRUD");
console.log("   3. Tester l'intégration avec la base de données");

