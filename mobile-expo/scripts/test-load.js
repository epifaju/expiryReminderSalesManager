/**
 * Script de test de charge
 *
 * Simule une charge importante sur l'application :
 * - Enregistrement massif de ventes
 * - Synchronisation sous charge
 * - Récupération de données volumineuses
 *
 * Usage: node scripts/test-load.js [nombre_operations]
 */

const axios = require("axios");

const BASE_URL = process.env.API_URL || "http://localhost:8080/api";
const NUM_OPERATIONS = parseInt(process.argv[2]) || 500;

let authToken = "";

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
 * Génère une vente de test
 */
function generateSale(index) {
  return {
    entity_id: `temp-load-sale-${index}-${Date.now()}`,
    entity_type: "SALE",
    operation_type: "CREATE",
    entity_data: {
      product_id: `product-${index % 100}`,
      quantity: Math.floor(Math.random() * 10) + 1,
      total_amount: Math.floor(Math.random() * 100000) + 1000,
      payment_method: index % 2 === 0 ? "CASH" : "MOBILE_MONEY",
      user_id: "1",
      created_at: new Date().toISOString(),
    },
    local_id: `local-sale-${index}`,
    client_timestamp: new Date().toISOString(),
  };
}

/**
 * Authentification
 */
async function authenticate() {
  console.log(`${colors.cyan}🔐 Authentification...${colors.reset}`);
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: "testuser",
      password: "password123",
    });
    authToken = response.data.token;
    console.log(`${colors.green}✅ Authentification réussie${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(
      `${colors.red}❌ Erreur authentification:${colors.reset}`,
      error.message
    );
    return false;
  }
}

/**
 * Envoie un batch de synchronisation
 */
async function sendSyncBatch(operations, batchNumber, totalBatches) {
  const startTime = Date.now();

  try {
    const response = await axios.post(
      `${BASE_URL}/sync/batch`,
      {
        device_id: "load-test-device",
        user_id: "1",
        operations,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        timeout: 60000, // 60s timeout
      }
    );

    const duration = Date.now() - startTime;
    const opsPerSec = (operations.length / (duration / 1000)).toFixed(2);

    console.log(
      `${colors.green}✅ Batch ${batchNumber}/${totalBatches}: ` +
        `${operations.length} ops en ${duration}ms ` +
        `(${opsPerSec} ops/s)${colors.reset}`
    );

    return {
      success: true,
      duration,
      operationsCount: operations.length,
      opsPerSec: parseFloat(opsPerSec),
      response: response.data,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `${colors.red}❌ Batch ${batchNumber}/${totalBatches} échoué après ${duration}ms:${colors.reset}`,
      error.message
    );

    return {
      success: false,
      duration,
      operationsCount: operations.length,
      error: error.message,
    };
  }
}

/**
 * Test de charge avec batches séquentiels
 */
async function runSequentialLoadTest(totalOps, batchSize) {
  console.log(`${colors.bright}${colors.blue}
╔══════════════════════════════════════════════════════╗
║   TEST DE CHARGE SÉQUENTIEL                          ║
╚══════════════════════════════════════════════════════╝
${colors.reset}`);

  console.log(`📊 Configuration:`);
  console.log(`   - Total opérations: ${totalOps}`);
  console.log(`   - Taille batch: ${batchSize}`);
  console.log(`   - Nombre de batches: ${Math.ceil(totalOps / batchSize)}\n`);

  const operations = Array.from({ length: totalOps }, (_, i) =>
    generateSale(i)
  );
  const batches = [];

  // Diviser en batches
  for (let i = 0; i < operations.length; i += batchSize) {
    batches.push(operations.slice(i, i + batchSize));
  }

  const results = [];
  const startTime = Date.now();

  // Envoyer les batches séquentiellement
  for (let i = 0; i < batches.length; i++) {
    const result = await sendSyncBatch(batches[i], i + 1, batches.length);
    results.push(result);

    // Pause entre les batches pour éviter de surcharger le serveur
    if (i < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  const totalDuration = Date.now() - startTime;
  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;
  const avgOpsPerSec =
    results
      .filter((r) => r.opsPerSec)
      .reduce((sum, r) => sum + r.opsPerSec, 0) / successCount;

  console.log(`\n${colors.bright}Résultats séquentiels:${colors.reset}`);
  console.log(`   ✅ Succès: ${successCount}/${batches.length} batches`);
  console.log(`   ❌ Échecs: ${failCount}/${batches.length} batches`);
  console.log(`   ⏱️  Durée totale: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`   📈 Débit moyen: ${avgOpsPerSec.toFixed(2)} ops/s`);

  return {
    type: "sequential",
    totalOps,
    batchSize,
    batches: batches.length,
    successCount,
    failCount,
    totalDuration,
    avgOpsPerSec,
    results,
  };
}

/**
 * Test de charge avec batches concurrents
 */
async function runConcurrentLoadTest(totalOps, batchSize) {
  console.log(`\n${colors.bright}${colors.blue}
╔══════════════════════════════════════════════════════╗
║   TEST DE CHARGE CONCURRENT                          ║
╚══════════════════════════════════════════════════════╝
${colors.reset}`);

  console.log(`📊 Configuration:`);
  console.log(`   - Total opérations: ${totalOps}`);
  console.log(`   - Taille batch: ${batchSize}`);
  console.log(`   - Batches concurrents: ${Math.ceil(totalOps / batchSize)}\n`);

  const operations = Array.from({ length: totalOps }, (_, i) =>
    generateSale(i)
  );
  const batches = [];

  for (let i = 0; i < operations.length; i += batchSize) {
    batches.push(operations.slice(i, i + batchSize));
  }

  const startTime = Date.now();

  // Envoyer tous les batches en parallèle
  const results = await Promise.all(
    batches.map((batch, index) =>
      sendSyncBatch(batch, index + 1, batches.length)
    )
  );

  const totalDuration = Date.now() - startTime;
  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;
  const avgOpsPerSec =
    results
      .filter((r) => r.opsPerSec)
      .reduce((sum, r) => sum + r.opsPerSec, 0) / successCount;

  console.log(`\n${colors.bright}Résultats concurrents:${colors.reset}`);
  console.log(`   ✅ Succès: ${successCount}/${batches.length} batches`);
  console.log(`   ❌ Échecs: ${failCount}/${batches.length} batches`);
  console.log(`   ⏱️  Durée totale: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`   📈 Débit moyen: ${avgOpsPerSec.toFixed(2)} ops/s`);

  return {
    type: "concurrent",
    totalOps,
    batchSize,
    batches: batches.length,
    successCount,
    failCount,
    totalDuration,
    avgOpsPerSec,
    results,
  };
}

/**
 * Test de stress progressif
 */
async function runStressTest() {
  console.log(`\n${colors.bright}${colors.blue}
╔══════════════════════════════════════════════════════╗
║   TEST DE STRESS PROGRESSIF                          ║
╚══════════════════════════════════════════════════════╝
${colors.reset}`);

  const testCases = [10, 50, 100, 200, 500];
  const results = [];

  for (const numOps of testCases) {
    console.log(
      `\n${colors.yellow}➡️  Test avec ${numOps} opérations...${colors.reset}`
    );

    const operations = Array.from({ length: numOps }, (_, i) =>
      generateSale(i)
    );
    const result = await sendSyncBatch(operations, 1, 1);
    results.push({ numOps, ...result });

    // Pause entre les tests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\n${colors.bright}Résultats du test de stress:${colors.reset}`);
  console.log(`\n   Opérations | Durée (ms) | Ops/s  | Statut`);
  console.log(`   ${"-".repeat(50)}`);

  results.forEach(({ numOps, duration, opsPerSec, success }) => {
    const status = success ? `${colors.green}✅` : `${colors.red}❌`;
    console.log(
      `   ${numOps.toString().padEnd(11)} | ` +
        `${duration.toString().padEnd(11)} | ` +
        `${(opsPerSec || 0).toFixed(2).padEnd(7)} | ` +
        `${status}${colors.reset}`
    );
  });

  return results;
}

/**
 * Génère un rapport
 */
function generateReport(sequentialResults, concurrentResults, stressResults) {
  const report = {
    timestamp: new Date().toISOString(),
    configuration: {
      baseUrl: BASE_URL,
      totalOperations: NUM_OPERATIONS,
    },
    tests: {
      sequential: sequentialResults,
      concurrent: concurrentResults,
      stress: stressResults,
    },
    summary: {
      totalTests: 3,
      allPassed:
        sequentialResults.successCount === sequentialResults.batches &&
        concurrentResults.successCount === concurrentResults.batches &&
        stressResults.every((r) => r.success),
    },
  };

  const fs = require("fs");
  const path = require("path");
  const reportPath = path.join(__dirname, "../load-test-report.json");

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(
    `\n${colors.green}✅ Rapport sauvegardé: ${reportPath}${colors.reset}`
  );
}

/**
 * Exécution principale
 */
async function main() {
  console.log(`${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════════════╗
║   TESTS DE CHARGE - SALES MANAGER                    ║
║   Synchronisation sous charge                        ║
╚══════════════════════════════════════════════════════╝
${colors.reset}`);

  // Authentification
  const authenticated = await authenticate();
  if (!authenticated) {
    console.error(
      `${colors.red}❌ Impossible de continuer sans authentification${colors.reset}`
    );
    process.exit(1);
  }

  try {
    // Test séquentiel
    const sequentialResults = await runSequentialLoadTest(NUM_OPERATIONS, 50);

    // Test concurrent
    const concurrentResults = await runConcurrentLoadTest(NUM_OPERATIONS, 50);

    // Test de stress
    const stressResults = await runStressTest();

    // Comparaison
    console.log(`\n${colors.bright}${colors.blue}
╔══════════════════════════════════════════════════════╗
║   COMPARAISON DES RÉSULTATS                          ║
╚══════════════════════════════════════════════════════╝
${colors.reset}`);

    console.log(`\n   Métrique          | Séquentiel | Concurrent`);
    console.log(`   ${"-".repeat(50)}`);
    console.log(
      `   Durée totale      | ` +
        `${(sequentialResults.totalDuration / 1000).toFixed(2)}s`.padEnd(11) +
        `| ${(concurrentResults.totalDuration / 1000).toFixed(2)}s`
    );
    console.log(
      `   Débit (ops/s)     | ` +
        `${sequentialResults.avgOpsPerSec.toFixed(2)}`.padEnd(11) +
        `| ${concurrentResults.avgOpsPerSec.toFixed(2)}`
    );
    console.log(
      `   Taux de succès    | ` +
        `${(
          (sequentialResults.successCount / sequentialResults.batches) *
          100
        ).toFixed(0)}%`.padEnd(11) +
        `| ${(
          (concurrentResults.successCount / concurrentResults.batches) *
          100
        ).toFixed(0)}%`
    );

    // Générer rapport
    generateReport(sequentialResults, concurrentResults, stressResults);

    console.log(
      `\n${colors.green}${colors.bright}✅ Tests de charge terminés avec succès !${colors.reset}`
    );
  } catch (error) {
    console.error(
      `${colors.red}❌ Erreur durant les tests:${colors.reset}`,
      error
    );
    process.exit(1);
  }
}

// Lancement
main().catch((error) => {
  console.error("Erreur fatale:", error);
  process.exit(1);
});
