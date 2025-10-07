/**
 * Script de benchmark pour la compression des payloads
 *
 * Mesure :
 * - Taille avant/après compression
 * - Temps de compression/décompression
 * - Ratio de compression
 * - Impact sur la bande passante
 *
 * Usage: node test-compression-benchmark.js
 */

const pako = require("pako");

/**
 * Génère des données de test réalistes
 */
function generateSyncPayload(operationCount) {
  return {
    device_id: "test-device-12345",
    user_id: "67890",
    sync_session_id: `session-${Date.now()}`,
    timestamp: new Date().toISOString(),
    operations: Array.from({ length: operationCount }, (_, i) => ({
      entity_id: `entity-${i}-${Math.random().toString(36).substring(7)}`,
      entity_type:
        i % 3 === 0 ? "PRODUCT" : i % 3 === 1 ? "SALE" : "STOCK_MOVEMENT",
      operation_type: i % 2 === 0 ? "CREATE" : "UPDATE",
      local_id: `local-${i}`,
      client_timestamp: new Date(Date.now() - i * 1000).toISOString(),
      entity_data: {
        name: `Test Entity ${i} with some description text`,
        description:
          "This is a longer description field that contains meaningful text about the product or sale",
        price: 1000 + i * 100,
        quantity: 10 + i,
        category: "Category Name",
        metadata: {
          created_by: "user-123",
          tags: ["tag1", "tag2", "tag3"],
          notes: "Additional notes field with more text content",
        },
        updated_at: new Date().toISOString(),
      },
    })),
  };
}

/**
 * Compresse des données
 */
function compress(data) {
  const jsonString = JSON.stringify(data);
  const originalSize = Buffer.byteLength(jsonString, "utf8");

  const startTime = process.hrtime.bigint();
  const compressed = pako.gzip(jsonString, { level: 6 });
  const endTime = process.hrtime.bigint();

  const compressionTime = Number(endTime - startTime) / 1_000_000; // Convert to ms
  const compressedSize = compressed.length;
  const compressionRatio = 1 - compressedSize / originalSize;

  return {
    originalSize,
    compressedSize,
    compressionRatio,
    compressionTime,
    compressed,
  };
}

/**
 * Décompresse des données
 */
function decompress(compressedData) {
  const startTime = process.hrtime.bigint();
  const decompressed = pako.ungzip(compressedData, { to: "string" });
  const endTime = process.hrtime.bigint();

  const decompressionTime = Number(endTime - startTime) / 1_000_000;
  const data = JSON.parse(decompressed);

  return {
    data,
    decompressionTime,
  };
}

/**
 * Benchmark de compression
 */
function benchmarkCompression(operationCounts) {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║   BENCHMARK COMPRESSION DE PAYLOADS                  ║");
  console.log("╚══════════════════════════════════════════════════════╝");

  const results = [];

  for (const count of operationCounts) {
    console.log(`\n📊 Test avec ${count} opérations`);
    console.log("─".repeat(54));

    // Générer payload
    const payload = generateSyncPayload(count);

    // Compresser
    const compResult = compress(payload);

    // Décompresser pour vérifier
    const decompResult = decompress(compResult.compressed);

    // Valider
    const isValid = decompResult.data.operations.length === count;

    // Afficher résultats
    console.log(
      `   Taille originale:     ${(compResult.originalSize / 1024).toFixed(
        2
      )} KB`
    );
    console.log(
      `   Taille compressée:    ${(compResult.compressedSize / 1024).toFixed(
        2
      )} KB`
    );
    console.log(
      `   Ratio compression:    ${(compResult.compressionRatio * 100).toFixed(
        1
      )}%`
    );
    console.log(
      `   Économie:             ${(
        (compResult.originalSize - compResult.compressedSize) /
        1024
      ).toFixed(2)} KB`
    );
    console.log(
      `   Temps compression:    ${compResult.compressionTime.toFixed(2)} ms`
    );
    console.log(
      `   Temps décompression:  ${decompResult.decompressionTime.toFixed(2)} ms`
    );
    console.log(`   Validation:           ${isValid ? "✅ OK" : "❌ ÉCHEC"}`);

    results.push({
      operationCount: count,
      ...compResult,
      decompressionTime: decompResult.decompressionTime,
      isValid,
    });
  }

  return results;
}

/**
 * Calcule les économies de bande passante
 */
function calculateBandwidthSavings(results) {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║        ÉCONOMIES DE BANDE PASSANTE                   ║");
  console.log("╚══════════════════════════════════════════════════════╝");

  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressed = results.reduce((sum, r) => sum + r.compressedSize, 0);
  const totalSaved = totalOriginal - totalCompressed;
  const averageRatio =
    results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length;

  console.log(`\n📊 Statistiques globales:`);
  console.log(
    `   Total non compressé:   ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`
  );
  console.log(
    `   Total compressé:       ${(totalCompressed / 1024 / 1024).toFixed(2)} MB`
  );
  console.log(
    `   Économie totale:       ${(totalSaved / 1024 / 1024).toFixed(2)} MB`
  );
  console.log(`   Ratio moyen:           ${(averageRatio * 100).toFixed(1)}%`);

  // Projections
  console.log(`\n📈 Projections mensuelles (1000 syncs/mois):`);
  const monthlyOriginal = (totalOriginal / results.length) * 1000;
  const monthlyCompressed = (totalCompressed / results.length) * 1000;
  const monthlySaved = monthlyOriginal - monthlyCompressed;

  console.log(
    `   Sans compression:      ${(monthlyOriginal / 1024 / 1024).toFixed(
      2
    )} MB/mois`
  );
  console.log(
    `   Avec compression:      ${(monthlyCompressed / 1024 / 1024).toFixed(
      2
    )} MB/mois`
  );
  console.log(
    `   Économie:              ${(monthlySaved / 1024 / 1024).toFixed(
      2
    )} MB/mois`
  );

  // Impact sur le coût
  const costPerGB = 0.1; // Exemple: $0.10 par GB
  const monthlyCostSavings = (monthlySaved / 1024 / 1024 / 1024) * costPerGB;

  console.log(`\n💰 Impact financier (à ${costPerGB}$/GB):`);
  console.log(`   Économie mensuelle:    $${monthlyCostSavings.toFixed(2)}`);
  console.log(
    `   Économie annuelle:     $${(monthlyCostSavings * 12).toFixed(2)}`
  );
}

/**
 * Test de différents niveaux de compression
 */
function testCompressionLevels() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║      TEST NIVEAUX DE COMPRESSION (0-9)               ║");
  console.log("╚══════════════════════════════════════════════════════╝");

  const payload = generateSyncPayload(50);
  const jsonString = JSON.stringify(payload);

  console.log(
    `\nTaille originale: ${(Buffer.byteLength(jsonString) / 1024).toFixed(
      2
    )} KB\n`
  );
  console.log(
    "Niveau".padEnd(10) + "Taille".padEnd(15) + "Ratio".padEnd(12) + "Temps"
  );
  console.log("─".repeat(54));

  for (let level = 0; level <= 9; level++) {
    const startTime = process.hrtime.bigint();
    const compressed = pako.gzip(jsonString, { level });
    const endTime = process.hrtime.bigint();

    const time = Number(endTime - startTime) / 1_000_000;
    const size = compressed.length;
    const ratio = (1 - size / Buffer.byteLength(jsonString)) * 100;

    const levelStr = `${level}`;
    const sizeStr = `${(size / 1024).toFixed(2)} KB`;
    const ratioStr = `${ratio.toFixed(1)}%`;
    const timeStr = `${time.toFixed(2)} ms`;

    console.log(
      levelStr.padEnd(10) + sizeStr.padEnd(15) + ratioStr.padEnd(12) + timeStr
    );
  }

  console.log(
    "\n💡 Recommandation: Niveau 6 offre le meilleur équilibre vitesse/compression"
  );
}

/**
 * Exécution principale
 */
function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║   TESTS COMPRESSION DE PAYLOADS - BENCHMARK          ║");
  console.log("║   Sales Manager - Optimisation Bande Passante       ║");
  console.log("╚══════════════════════════════════════════════════════╝");

  // Test 1 : Différentes tailles de payload
  const results = benchmarkCompression([10, 50, 100, 200, 500]);

  // Test 2 : Économies de bande passante
  calculateBandwidthSavings(results);

  // Test 3 : Niveaux de compression
  testCompressionLevels();

  // Résumé final
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║              RÉSUMÉ FINAL                            ║");
  console.log("╚══════════════════════════════════════════════════════╝");

  const avgRatio =
    results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length;
  const avgCompTime =
    results.reduce((sum, r) => sum + r.compressionTime, 0) / results.length;
  const avgDecompTime =
    results.reduce((sum, r) => sum + r.decompressionTime, 0) / results.length;

  console.log(
    `\n✅ Taux de compression moyen:      ${(avgRatio * 100).toFixed(1)}%`
  );
  console.log(
    `⚡ Temps compression moyen:        ${avgCompTime.toFixed(2)} ms`
  );
  console.log(
    `⚡ Temps décompression moyen:      ${avgDecompTime.toFixed(2)} ms`
  );
  console.log(`📦 Niveau recommandé:              6 (équilibré)`);
  console.log(`🎯 Seuil recommandé:               1024 bytes (1 KB)`);

  console.log("\n✅ Benchmark terminé !");
}

// Lancement
main();
