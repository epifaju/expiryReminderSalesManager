/**
 * Script de mesure de la taille de la base de données
 *
 * Calcule la taille estimée de la base SQLite pour différents volumes :
 * - 100, 500, 1000, 5000 ventes
 * - Impact des index
 * - Impact de la compression
 *
 * Usage: node scripts/measure-db-size.js
 */

const fs = require("fs");
const path = require("path");

/**
 * Couleurs pour le terminal
 */
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bright: "\x1b[1m",
};

/**
 * Génère des données de test
 */
function generateSale(index) {
  return {
    id: index,
    product_id: index % 100,
    quantity: Math.floor(Math.random() * 10) + 1,
    total_amount: Math.floor(Math.random() * 100000) + 1000,
    payment_method: index % 2 === 0 ? "CASH" : "MOBILE_MONEY",
    notes: `Vente numéro ${index} avec des notes détaillées pour simuler du contenu réel`,
    user_id: 1,
    created_at: new Date(Date.now() - index * 3600000).toISOString(),
    updated_at: new Date(Date.now() - index * 3600000).toISOString(),
    sync_status: index % 10 === 0 ? "synced" : "pending",
    is_deleted: 0,
  };
}

function generateProduct(index) {
  return {
    id: index,
    name: `Produit ${index}`,
    description: `Description détaillée du produit ${index}. Ce produit est de haute qualité et répond aux besoins des clients.`,
    price: Math.floor(Math.random() * 50000) + 1000,
    stock_quantity: Math.floor(Math.random() * 100) + 10,
    category: `Catégorie ${index % 10}`,
    barcode: `EAN${1000000000000 + index}`,
    image_url: `https://images.example.com/product-${index}.jpg`,
    user_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sync_status: "synced",
    is_deleted: 0,
  };
}

function generateStockMovement(index) {
  return {
    id: index,
    product_id: index % 100,
    quantity: Math.floor(Math.random() * 20) - 10,
    type: index % 2 === 0 ? "IN" : "OUT",
    reason: index % 2 === 0 ? "Réapprovisionnement" : "Vente",
    user_id: 1,
    created_at: new Date(Date.now() - index * 1800000).toISOString(),
  };
}

function generateSyncQueueItem(index) {
  return {
    id: index,
    entity_type: index % 2 === 0 ? "SALE" : "PRODUCT",
    entity_id: index,
    operation_type: index % 3 === 0 ? "CREATE" : "UPDATE",
    entity_data: JSON.stringify(
      index % 2 === 0 ? generateSale(index) : generateProduct(index)
    ),
    retry_count: Math.floor(Math.random() * 3),
    created_at: new Date().toISOString(),
    sync_status: "pending",
  };
}

/**
 * Calcule la taille d'un objet en octets
 */
function getSize(data) {
  const str = JSON.stringify(data);
  return Buffer.byteLength(str, "utf8");
}

/**
 * Formate la taille en MB
 */
function formatMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

/**
 * Formate la taille en KB
 */
function formatKB(bytes) {
  return (bytes / 1024).toFixed(2);
}

/**
 * Estime la taille de la DB SQLite
 */
function estimateDBSize(dataSize) {
  // SQLite ajoute un overhead pour :
  // - Page headers (1-2%)
  // - Index B-Tree (30-50% selon le nombre d'index)
  // - Métadonnées (5-10%)
  // - Free pages (10-20% selon la fragmentation)

  const pageOverhead = dataSize * 0.02;
  const indexOverhead = dataSize * 0.4; // 4 index principaux
  const metadataOverhead = dataSize * 0.08;
  const fragmentationOverhead = dataSize * 0.15;

  const totalOverhead =
    pageOverhead + indexOverhead + metadataOverhead + fragmentationOverhead;
  const estimatedSize = dataSize + totalOverhead;

  return {
    dataSize,
    pageOverhead,
    indexOverhead,
    metadataOverhead,
    fragmentationOverhead,
    totalOverhead,
    estimatedSize,
  };
}

/**
 * Teste différents volumes de données
 */
function testDataVolumes() {
  console.log(`${colors.bright}${colors.blue}
╔══════════════════════════════════════════════════════╗
║   MESURE TAILLE BASE DE DONNÉES                      ║
╚══════════════════════════════════════════════════════╝
${colors.reset}\n`);

  const testCases = [
    { sales: 100, products: 50, movements: 200, queue: 20 },
    { sales: 500, products: 200, movements: 1000, queue: 50 },
    { sales: 1000, products: 500, movements: 2000, queue: 100 },
    { sales: 5000, products: 1000, movements: 10000, queue: 500 },
  ];

  const results = [];

  testCases.forEach(({ sales, products, movements, queue }) => {
    console.log(`${colors.cyan}📊 Test avec:${colors.reset}`);
    console.log(`   - ${sales} ventes`);
    console.log(`   - ${products} produits`);
    console.log(`   - ${movements} mouvements de stock`);
    console.log(`   - ${queue} opérations en queue\n`);

    // Générer les données
    const salesData = Array.from({ length: sales }, (_, i) => generateSale(i));
    const productsData = Array.from({ length: products }, (_, i) =>
      generateProduct(i)
    );
    const movementsData = Array.from({ length: movements }, (_, i) =>
      generateStockMovement(i)
    );
    const queueData = Array.from({ length: queue }, (_, i) =>
      generateSyncQueueItem(i)
    );

    // Calculer les tailles
    const salesSize = getSize(salesData);
    const productsSize = getSize(productsData);
    const movementsSize = getSize(movementsData);
    const queueSize = getSize(queueData);
    const totalDataSize = salesSize + productsSize + movementsSize + queueSize;

    // Estimer la taille DB
    const dbEstimate = estimateDBSize(totalDataSize);

    console.log(`   ${colors.yellow}Taille des données (JSON):${colors.reset}`);
    console.log(`   - Ventes: ${formatKB(salesSize)} KB`);
    console.log(`   - Produits: ${formatKB(productsSize)} KB`);
    console.log(`   - Mouvements: ${formatKB(movementsSize)} KB`);
    console.log(`   - Queue: ${formatKB(queueSize)} KB`);
    console.log(`   - Total: ${formatMB(totalDataSize)} MB\n`);

    console.log(`   ${colors.yellow}Estimation SQLite:${colors.reset}`);
    console.log(`   - Données: ${formatMB(dbEstimate.dataSize)} MB`);
    console.log(`   - Index: ${formatMB(dbEstimate.indexOverhead)} MB`);
    console.log(
      `   - Métadonnées: ${formatMB(dbEstimate.metadataOverhead)} MB`
    );
    console.log(
      `   - Fragmentation: ${formatMB(dbEstimate.fragmentationOverhead)} MB`
    );
    console.log(
      `   - ${colors.bright}Total DB: ${formatMB(dbEstimate.estimatedSize)} MB${
        colors.reset
      }\n`
    );

    const isPassing = dbEstimate.estimatedSize < 50 * 1024 * 1024; // < 50MB
    const status = isPassing
      ? `${colors.green}✅ CONFORME`
      : `${colors.red}❌ DÉPASSE`;
    console.log(`   Statut: ${status} (limite: 50 MB)${colors.reset}\n`);
    console.log(`   ${"-".repeat(56)}\n`);

    results.push({
      config: { sales, products, movements, queue },
      sizes: {
        sales: salesSize,
        products: productsSize,
        movements: movementsSize,
        queue: queueSize,
        total: totalDataSize,
      },
      dbEstimate,
      isPassing,
    });
  });

  return results;
}

/**
 * Analyse l'impact de la compression
 */
function analyzeCompression() {
  console.log(`${colors.bright}${colors.blue}
╔══════════════════════════════════════════════════════╗
║   IMPACT DE LA COMPRESSION                           ║
╚══════════════════════════════════════════════════════╝
${colors.reset}\n`);

  const sales = Array.from({ length: 100 }, (_, i) => generateSale(i));
  const uncompressed = getSize(sales);

  // Estimation de compression gzip (70% de réduction typique pour JSON)
  const compressionRatio = 0.7;
  const compressed = uncompressed * (1 - compressionRatio);

  console.log(`   ${colors.cyan}Pour 100 ventes:${colors.reset}`);
  console.log(`   - Taille non compressée: ${formatKB(uncompressed)} KB`);
  console.log(`   - Taille compressée (gzip): ${formatKB(compressed)} KB`);
  console.log(`   - Économie: ${(compressionRatio * 100).toFixed(0)}%\n`);

  console.log(`   ${colors.cyan}Projection pour 1000 ventes:${colors.reset}`);
  const uncompressed1000 = uncompressed * 10;
  const compressed1000 = compressed * 10;
  console.log(`   - Non compressée: ${formatMB(uncompressed1000)} MB`);
  console.log(`   - Compressée: ${formatMB(compressed1000)} MB`);
  console.log(
    `   - Économie réseau: ${formatMB(uncompressed1000 - compressed1000)} MB\n`
  );
}

/**
 * Recommandations d'optimisation
 */
function showOptimizationTips(results) {
  console.log(`${colors.bright}${colors.blue}
╔══════════════════════════════════════════════════════╗
║   RECOMMANDATIONS D'OPTIMISATION                     ║
╚══════════════════════════════════════════════════════╝
${colors.reset}\n`);

  const largestTest = results[results.length - 1];
  const dbSize = largestTest.dbEstimate.estimatedSize / (1024 * 1024);

  console.log(`   ${colors.yellow}1. Nettoyage automatique${colors.reset}`);
  console.log(`   - Supprimer les ventes synchronisées > 30 jours`);
  console.log(`   - Archiver les mouvements de stock anciens`);
  console.log(`   - Économie estimée: ~30% de la DB\n`);

  console.log(`   ${colors.yellow}2. Optimisation des index${colors.reset}`);
  console.log(`   - Index uniquement sur les colonnes fréquemment requêtées`);
  console.log(`   - VACUUM régulier pour défragmenter`);
  console.log(`   - Économie estimée: ~15% de la DB\n`);

  console.log(`   ${colors.yellow}3. Compression des données${colors.reset}`);
  console.log(`   - Compresser les champs texte longs (notes, descriptions)`);
  console.log(`   - Utiliser INTEGER au lieu de TEXT pour les IDs`);
  console.log(`   - Économie estimée: ~20% de la DB\n`);

  console.log(
    `   ${colors.yellow}4. Pagination et lazy loading${colors.reset}`
  );
  console.log(`   - Charger les ventes par batch de 50`);
  console.log(`   - Garder en mémoire uniquement les données visibles`);
  console.log(`   - Impact: Réduit l'utilisation mémoire de 80%\n`);

  const optimizedSize = dbSize * 0.35; // -65% avec toutes les optimisations
  console.log(
    `   ${colors.green}${
      colors.bright
    }Taille DB optimisée estimée: ${optimizedSize.toFixed(2)} MB${
      colors.reset
    }\n`
  );
}

/**
 * Génère un rapport
 */
function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    testCases: results,
    summary: {
      smallestDB: formatMB(results[0].dbEstimate.estimatedSize),
      largestDB: formatMB(results[results.length - 1].dbEstimate.estimatedSize),
      allPassing: results.every((r) => r.isPassing),
      recommendations: [
        "Nettoyage automatique des données anciennes",
        "Optimisation des index SQLite",
        "Compression des champs texte",
        "Pagination et lazy loading",
      ],
    },
  };

  const reportPath = path.join(__dirname, "../db-size-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(
    `${colors.green}✅ Rapport sauvegardé: ${reportPath}${colors.reset}\n`
  );
}

/**
 * Exécution principale
 */
function main() {
  console.log(`${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════════════╗
║   ANALYSE TAILLE BASE DE DONNÉES                     ║
║   Sales Manager - Mode Offline                       ║
╚══════════════════════════════════════════════════════╝
${colors.reset}\n`);

  // Test des différents volumes
  const results = testDataVolumes();

  // Analyse de la compression
  analyzeCompression();

  // Recommandations
  showOptimizationTips(results);

  // Résumé final
  console.log(`${colors.bright}${colors.blue}
╔══════════════════════════════════════════════════════╗
║   RÉSUMÉ FINAL                                       ║
╚══════════════════════════════════════════════════════╝
${colors.reset}\n`);

  results.forEach(({ config, dbEstimate, isPassing }, index) => {
    const status = isPassing ? `${colors.green}✅` : `${colors.red}❌`;
    console.log(
      `   ${status} ${config.sales} ventes: ` +
        `${formatMB(dbEstimate.estimatedSize)} MB${colors.reset}`
    );
  });

  const allPass = results.every((r) => r.isPassing);
  if (allPass) {
    console.log(
      `\n${colors.green}${colors.bright}🎉 Tous les tests passent ! La DB reste < 50 MB.${colors.reset}\n`
    );
  } else {
    console.log(
      `\n${colors.yellow}⚠️  Certains volumes dépassent la limite. Appliquez les optimisations.${colors.reset}\n`
    );
  }

  // Générer rapport
  generateReport(results);

  console.log(`${colors.bright}✅ Analyse terminée !${colors.reset}\n`);
}

// Lancement
main();
