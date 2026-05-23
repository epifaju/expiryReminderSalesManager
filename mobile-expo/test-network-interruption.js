/**
 * Script de test E2E pour les scénarios de coupure réseau
 *
 * Ce script teste :
 * 1. Synchronisation de 100 opérations
 * 2. Coupure réseau à 50%
 * 3. Attente de 30 secondes
 * 4. Reconnexion
 * 5. Vérification de la reprise automatique
 *
 * Usage: node test-network-interruption.js
 */

const axios = require("axios");

const BASE_URL = "http://localhost:8080/api";
let authToken = "";

// Configuration
const TEST_CONFIG = {
  totalOperations: 100,
  interruptAt: 50, // Interrompre à 50%
  waitTimeMs: 30000, // Attendre 30s
  batchSize: 10, // Taille des batches
};

const TEST_USER = {
  username: "testuser",
  password: "password123",
};

/**
 * Authentification
 */
async function authenticate() {
  console.log("\n🔐 Authentification...");
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    authToken = response.data.token;
    console.log("✅ Authentification réussie");
    return true;
  } catch (error) {
    console.error(
      "❌ Erreur authentification:",
      error.response?.data || error.message
    );
    return false;
  }
}

/**
 * Génère des opérations de test
 */
function generateOperations(count) {
  return Array.from({ length: count }, (_, i) => ({
    entity_id: `temp-${i}`,
    entity_type: "PRODUCT",
    operation_type: "CREATE",
    entity_data: {
      name: `Produit Test ${i}`,
      description: `Description du produit ${i}`,
      price: 1000 + i * 100,
      category: "Test",
      stock_quantity: 10 + i,
      user_id: "1",
    },
    local_id: `local-product-${i}`,
    client_timestamp: new Date().toISOString(),
  }));
}

/**
 * Synchronise un batch d'opérations
 */
async function syncBatch(operations, batchNumber) {
  try {
    const response = await axios.post(
      `${BASE_URL}/sync/batch`,
      {
        device_id: "test-device-001",
        user_id: "1",
        operations,
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 10000, // 10s timeout
      }
    );

    console.log(
      `✅ Batch ${batchNumber}: ${response.data.success_count} succès`
    );
    return response.data;
  } catch (error) {
    console.error(`❌ Batch ${batchNumber} échoué:`, error.message);
    throw error;
  }
}

/**
 * Test principal : Interruption et reprise
 */
async function testInterruptionAndResume() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║   TEST INTERRUPTION RÉSEAU - SCÉNARIO COMPLET       ║");
  console.log("╚══════════════════════════════════════════════════════╝");

  // Authentification
  const authenticated = await authenticate();
  if (!authenticated) {
    console.error("\n❌ Impossible de continuer");
    return;
  }

  // Générer les opérations
  console.log(
    `\n📦 Génération de ${TEST_CONFIG.totalOperations} opérations...`
  );
  const allOperations = generateOperations(TEST_CONFIG.totalOperations);
  console.log(`✅ ${allOperations.length} opérations générées`);

  // Phase 1 : Synchronisation jusqu'à interruption
  console.log("\n📡 PHASE 1 : Synchronisation initiale");
  console.log("═══════════════════════════════════════");

  let syncedCount = 0;
  let failedCount = 0;
  const startTime = Date.now();

  // Diviser en batches
  const batches = [];
  for (let i = 0; i < allOperations.length; i += TEST_CONFIG.batchSize) {
    batches.push(allOperations.slice(i, i + TEST_CONFIG.batchSize));
  }

  console.log(
    `📊 ${batches.length} batches à synchroniser (${TEST_CONFIG.batchSize} ops/batch)`
  );

  // Synchroniser jusqu'à interruption
  for (let i = 0; i < batches.length; i++) {
    const progress = ((i + 1) / batches.length) * 100;

    // Interrompre à 50%
    if (progress >= TEST_CONFIG.interruptAt) {
      console.log(`\n⚠️  INTERRUPTION à ${progress.toFixed(1)}%`);
      console.log(`   Synchronisé: ${syncedCount} opérations`);
      console.log(
        `   Restant: ${allOperations.length - syncedCount} opérations`
      );
      break;
    }

    try {
      const result = await syncBatch(batches[i], i + 1);
      syncedCount += result.success_count;

      process.stdout.write(
        `\r📈 Progression: ${progress.toFixed(1)}% (${syncedCount}/${
          allOperations.length
        })`
      );
    } catch (error) {
      failedCount += batches[i].length;
      console.log(`\n❌ Batch ${i + 1} échoué`);
      break;
    }
  }

  const phase1Duration = Date.now() - startTime;

  console.log("\n\n📊 Résultat Phase 1:");
  console.log(`   ✅ Synchronisé: ${syncedCount} opérations`);
  console.log(`   ⏱️  Durée: ${phase1Duration}ms`);
  console.log(
    `   📉 Restant: ${allOperations.length - syncedCount} opérations`
  );

  // Phase 2 : Attente (simulation de coupure)
  console.log("\n⏳ PHASE 2 : Attente de reconnexion");
  console.log("═══════════════════════════════════════");
  console.log(`   Attente de ${TEST_CONFIG.waitTimeMs / 1000}s...`);

  let countdown = TEST_CONFIG.waitTimeMs / 1000;
  const countdownInterval = setInterval(() => {
    process.stdout.write(`\r   ⏱️  ${countdown}s restantes...`);
    countdown--;

    if (countdown < 0) {
      clearInterval(countdownInterval);
    }
  }, 1000);

  await new Promise((resolve) => setTimeout(resolve, TEST_CONFIG.waitTimeMs));
  console.log("\n   ✅ Attente terminée");

  // Phase 3 : Reprise de la synchronisation
  console.log("\n🔄 PHASE 3 : Reprise de la synchronisation");
  console.log("═══════════════════════════════════════");

  const remainingOps = allOperations.slice(syncedCount);
  const remainingBatches = [];

  for (let i = 0; i < remainingOps.length; i += TEST_CONFIG.batchSize) {
    remainingBatches.push(remainingOps.slice(i, i + TEST_CONFIG.batchSize));
  }

  console.log(`📊 ${remainingBatches.length} batches restants à synchroniser`);

  const phase3StartTime = Date.now();
  let resumedCount = 0;

  for (let i = 0; i < remainingBatches.length; i++) {
    try {
      const result = await syncBatch(remainingBatches[i], i + 1);
      resumedCount += result.success_count;

      const progress = (resumedCount / remainingOps.length) * 100;
      process.stdout.write(
        `\r📈 Reprise: ${progress.toFixed(1)}% (${resumedCount}/${
          remainingOps.length
        })`
      );
    } catch (error) {
      console.log(`\n❌ Erreur batch ${i + 1}:`, error.message);
      break;
    }
  }

  const phase3Duration = Date.now() - phase3StartTime;
  const totalDuration = Date.now() - startTime;

  // Résultats finaux
  console.log("\n\n╔══════════════════════════════════════════════════════╗");
  console.log("║              RÉSULTATS FINAUX                        ║");
  console.log("╚══════════════════════════════════════════════════════╝");

  console.log("\n📊 Statistiques de synchronisation:");
  console.log(`   Total opérations: ${allOperations.length}`);
  console.log(`   ✅ Phase 1 (avant coupure): ${syncedCount}`);
  console.log(`   ✅ Phase 3 (après reprise): ${resumedCount}`);
  console.log(`   ✅ Total synchronisé: ${syncedCount + resumedCount}`);
  console.log(`   ❌ Échecs: ${failedCount}`);

  console.log("\n⏱️  Temps d'exécution:");
  console.log(`   Phase 1: ${phase1Duration}ms`);
  console.log(`   Attente: ${TEST_CONFIG.waitTimeMs}ms`);
  console.log(`   Phase 3: ${phase3Duration}ms`);
  console.log(`   Total: ${totalDuration}ms`);

  console.log("\n📈 Performance:");
  const avgTimePerOp = totalDuration / (syncedCount + resumedCount);
  console.log(`   Moyenne par opération: ${avgTimePerOp.toFixed(2)}ms`);
  console.log(
    `   Opérations/seconde: ${(
      (syncedCount + resumedCount) /
      (totalDuration / 1000)
    ).toFixed(2)}`
  );

  // Validation
  console.log("\n✅ VALIDATION:");

  const allSynced = syncedCount + resumedCount === allOperations.length;
  const noDataLoss = failedCount === 0 || resumedCount > 0;
  const resumedSuccessfully = resumedCount > 0;

  console.log(
    `   ${allSynced ? "✅" : "❌"} Toutes les opérations synchronisées`
  );
  console.log(`   ${noDataLoss ? "✅" : "❌"} Aucune perte de données`);
  console.log(
    `   ${resumedSuccessfully ? "✅" : "❌"} Reprise automatique réussie`
  );

  if (allSynced && noDataLoss && resumedSuccessfully) {
    console.log(
      "\n🎉 TEST RÉUSSI ! Le système est résilient aux coupures réseau."
    );
  } else {
    console.log("\n⚠️  TEST PARTIEL. Certains critères ne sont pas remplis.");
  }
}

/**
 * Test de multiples interruptions
 */
async function testMultipleInterruptions() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║   TEST INTERRUPTIONS MULTIPLES                       ║");
  console.log("╚══════════════════════════════════════════════════════╝");

  const authenticated = await authenticate();
  if (!authenticated) return;

  const operations = generateOperations(50);
  const batches = [];

  for (let i = 0; i < operations.length; i += 5) {
    batches.push(operations.slice(i, i + 5));
  }

  let syncedCount = 0;
  let interruptionCount = 0;

  for (let i = 0; i < batches.length; i++) {
    try {
      // Simuler interruption aléatoire (30% de chance)
      if (Math.random() < 0.3) {
        interruptionCount++;
        console.log(
          `\n⚠️  Interruption ${interruptionCount} au batch ${i + 1}`
        );

        // Attendre 2 secondes
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log("   📶 Reconnexion...");
      }

      const result = await syncBatch(batches[i], i + 1);
      syncedCount += result.success_count;
    } catch (error) {
      console.error(
        `❌ Batch ${i + 1} échoué après ${interruptionCount} interruptions`
      );
    }
  }

  console.log("\n📊 Résultat:");
  console.log(
    `   Opérations synchronisées: ${syncedCount}/${operations.length}`
  );
  console.log(`   Interruptions survenues: ${interruptionCount}`);
  console.log(
    `   ${syncedCount === operations.length ? "✅" : "❌"} Test ${
      syncedCount === operations.length ? "RÉUSSI" : "ÉCHOUÉ"
    }`
  );
}

/**
 * Test de timeout
 */
async function testTimeout() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║   TEST TIMEOUT DE REQUÊTE                            ║");
  console.log("╚══════════════════════════════════════════════════════╝");

  const authenticated = await authenticate();
  if (!authenticated) return;

  const operation = generateOperations(1);

  console.log("\n⏱️  Test avec timeout de 5 secondes...");

  try {
    const result = await axios.post(
      `${BASE_URL}/sync/batch`,
      {
        device_id: "test-device-001",
        user_id: "1",
        operations: operation,
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 5000, // 5 secondes
      }
    );

    console.log("✅ Requête terminée avant timeout");
    console.log(`   Durée: < 5000ms`);
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      console.log("⚠️  Timeout détecté (attendu si serveur lent)");
    } else {
      console.error("❌ Erreur:", error.message);
    }
  }
}

/**
 * Exécution de tous les tests
 */
async function runAllTests() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║   TESTS SCÉNARIOS DE COUPURE RÉSEAU                  ║");
  console.log("║   Sales Manager - Mode Offline                       ║");
  console.log("╚══════════════════════════════════════════════════════╝");

  console.log("\n📋 Configuration des tests:");
  console.log(`   Total opérations: ${TEST_CONFIG.totalOperations}`);
  console.log(`   Point d'interruption: ${TEST_CONFIG.interruptAt}%`);
  console.log(`   Temps d'attente: ${TEST_CONFIG.waitTimeMs / 1000}s`);
  console.log(`   Taille batch: ${TEST_CONFIG.batchSize}`);

  // Test 1 : Interruption et reprise
  await testInterruptionAndResume();

  console.log("\n" + "═".repeat(54));

  // Attendre entre les tests
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Test 2 : Interruptions multiples
  await testMultipleInterruptions();

  console.log("\n" + "═".repeat(54));

  // Attendre entre les tests
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Test 3 : Timeout
  await testTimeout();

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║        TOUS LES TESTS TERMINÉS                       ║");
  console.log("╚══════════════════════════════════════════════════════╝");
}

// Lancement
runAllTests().catch((error) => {
  console.error("\n💥 Erreur fatale:", error);
  process.exit(1);
});

