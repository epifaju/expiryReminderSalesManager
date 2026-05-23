/**
 * Script de comparaison des performances avant/après index
 *
 * Mesure l'impact des index sur les performances des requêtes critiques
 * Génère un rapport comparatif
 *
 * Usage: node compare-performance-before-after.js
 */

const { Client } = require("pg");

const DB_CONFIG = {
  host: "localhost",
  port: 5432,
  database: "salesmanager",
  user: "postgres",
  password: "postgres",
};

/**
 * Liste des requêtes critiques à tester
 */
const CRITICAL_QUERIES = [
  {
    name: "Sync Delta - Products (7 days)",
    query: `SELECT id, name, selling_price, updated_at 
            FROM products 
            WHERE updated_at > $1 AND is_active = true 
            ORDER BY updated_at DESC 
            LIMIT 100`,
    params: () => [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)],
    expectedImprovement: 50, // % d'amélioration attendue
  },
  {
    name: "Low Stock Products",
    query: `SELECT id, name, stock_quantity, min_stock_level 
            FROM products 
            WHERE stock_quantity <= min_stock_level AND is_active = true 
            ORDER BY stock_quantity ASC 
            LIMIT 50`,
    params: () => [],
    expectedImprovement: 70,
  },
  {
    name: "Sales by User (Last 30 days)",
    query: `SELECT id, sale_number, total_amount, sale_date 
            FROM sales 
            WHERE sale_date > $1 
            ORDER BY sale_date DESC 
            LIMIT 100`,
    params: () => [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)],
    expectedImprovement: 40,
  },
  {
    name: "Stock Movements by Product",
    query: `SELECT id, quantity, movement_type, created_at 
            FROM stock_movements 
            WHERE product_id = $1 
            ORDER BY created_at DESC 
            LIMIT 50`,
    params: () => [Math.floor(Math.random() * 1000) + 1],
    expectedImprovement: 60,
  },
  {
    name: "Sync Logs with Errors",
    query: `SELECT id, sync_type, error_count, timestamp 
            FROM sync_logs 
            WHERE error_count > 0 
            ORDER BY timestamp DESC 
            LIMIT 50`,
    params: () => [],
    expectedImprovement: 80,
  },
];

/**
 * Benchmark une requête
 */
async function benchmarkQuery(client, query, params, iterations = 10) {
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = process.hrtime.bigint();
    await client.query(query, params);
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;
    times.push(durationMs);
  }

  times.sort((a, b) => a - b);

  return {
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    min: times[0],
    max: times[times.length - 1],
    median: times[Math.floor(times.length / 2)],
    p95: times[Math.floor(times.length * 0.95)],
    p99: times[Math.floor(times.length * 0.99)],
  };
}

/**
 * Vérifie si les index existent
 */
async function checkIndexes(client) {
  const result = await client.query(`
    SELECT COUNT(*) as count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
  `);

  return parseInt(result.rows[0].count);
}

/**
 * Exécution principale
 */
async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║   COMPARAISON PERFORMANCE AVANT/APRÈS INDEX          ║");
  console.log("╚══════════════════════════════════════════════════════╝");

  let client;

  try {
    client = new Client(DB_CONFIG);
    await client.connect();
    console.log("\n✅ Connecté à PostgreSQL");

    // Vérifier les index
    const indexCount = await checkIndexes(client);
    console.log(`\n📊 ${indexCount} index personnalisés trouvés`);

    if (indexCount < 10) {
      console.log(
        "⚠️  Peu d'index détectés. Les index de la migration V4 sont-ils appliqués?"
      );
      console.log("   Exécutez: ./mvnw flyway:migrate");
    }

    // Exécuter les benchmarks
    console.log("\n🔬 Exécution des benchmarks...");
    console.log("═══════════════════════════════════════════════════");

    const results = [];

    for (const testCase of CRITICAL_QUERIES) {
      console.log(`\n📊 ${testCase.name}`);
      console.log("   Exécution de 10 itérations...");

      const params = testCase.params();
      const perf = await benchmarkQuery(client, testCase.query, params, 10);

      results.push({
        name: testCase.name,
        ...perf,
        expectedImprovement: testCase.expectedImprovement,
      });

      console.log(
        `   Avg: ${perf.avg.toFixed(2)}ms | Median: ${perf.median.toFixed(
          2
        )}ms | P95: ${perf.p95.toFixed(2)}ms`
      );
    }

    // Tableau récapitulatif
    console.log("\n╔══════════════════════════════════════════════════════╗");
    console.log("║              RÉSUMÉ DES PERFORMANCES                 ║");
    console.log("╚══════════════════════════════════════════════════════╝\n");

    console.log(
      "Requête".padEnd(40) + "Avg".padEnd(12) + "Median".padEnd(12) + "P95"
    );
    console.log("─".repeat(76));

    results.forEach((r) => {
      const avgStr = `${r.avg.toFixed(2)}ms`;
      const medianStr = `${r.median.toFixed(2)}ms`;
      const p95Str = `${r.p95.toFixed(2)}ms`;

      console.log(
        r.name.padEnd(40) + avgStr.padEnd(12) + medianStr.padEnd(12) + p95Str
      );
    });

    // Analyse
    console.log("\n📊 ANALYSE:");

    const avgTime = results.reduce((sum, r) => sum + r.avg, 0) / results.length;
    console.log(`   Temps moyen global: ${avgTime.toFixed(2)}ms`);

    const fastQueries = results.filter((r) => r.avg < 50);
    const slowQueries = results.filter((r) => r.avg > 200);

    console.log(
      `   ✅ Requêtes rapides (< 50ms): ${fastQueries.length}/${results.length}`
    );
    console.log(
      `   🐌 Requêtes lentes (> 200ms): ${slowQueries.length}/${results.length}`
    );

    if (slowQueries.length > 0) {
      console.log("\n⚠️  Recommandations pour requêtes lentes:");
      slowQueries.forEach((r) => {
        console.log(`   - ${r.name}:`);
        console.log(
          `     • Vérifier que les index sont utilisés (EXPLAIN ANALYZE)`
        );
        console.log(
          `     • Considérer VACUUM ANALYZE sur les tables concernées`
        );
        console.log(`     • Vérifier les statistiques de la table`);
      });
    }

    // Recommandations générales
    console.log("\n💡 RECOMMANDATIONS:");

    if (avgTime < 50) {
      console.log("   ✅ Excellentes performances ! Les index sont efficaces.");
    } else if (avgTime < 100) {
      console.log(
        "   ✅ Bonnes performances. Index fonctionnent correctement."
      );
    } else if (avgTime < 200) {
      console.log("   ⚠️  Performances acceptables. Monitoring recommandé.");
    } else {
      console.log("   🔴 Performances faibles. Optimisation requise.");
    }

    console.log("\n📌 Maintenance recommandée:");
    console.log("   - Exécuter VACUUM ANALYZE régulièrement");
    console.log("   - Monitorer la croissance des tables");
    console.log("   - Revoir les index si les patterns de requête changent");
  } catch (error) {
    console.error("Erreur:", error);
    process.exit(1);
  }
}

// Lancement
main();

