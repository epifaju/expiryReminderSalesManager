/**
 * Script de benchmark pour tester l'impact des index sur les performances
 *
 * Compare les performances avant et après l'ajout des index
 * Mesure le temps d'exécution des requêtes critiques
 *
 * Usage: node test-index-performance.js
 */

const { Client } = require("pg");

// Configuration PostgreSQL
const DB_CONFIG = {
  host: "localhost",
  port: 5432,
  database: "salesmanager",
  user: "postgres",
  password: "postgres",
};

/**
 * Crée une connexion à la base de données
 */
async function createConnection() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  return client;
}

/**
 * Génère des données de test
 */
async function generateTestData(client) {
  console.log("\n📦 Génération de données de test...");

  const startTime = Date.now();

  try {
    // Générer des produits
    await client.query(`
      INSERT INTO products (name, description, purchase_price, selling_price, stock_quantity, category, is_active, created_at, updated_at)
      SELECT 
        'Produit Test ' || i,
        'Description du produit ' || i,
        (random() * 10000)::numeric(10,2),
        (random() * 15000)::numeric(10,2),
        (random() * 100)::integer,
        CASE (i % 5)
          WHEN 0 THEN 'Alimentation'
          WHEN 1 THEN 'Boissons'
          WHEN 2 THEN 'Hygiène'
          WHEN 3 THEN 'Électronique'
          ELSE 'Divers'
        END,
        true,
        NOW() - (random() * interval '90 days'),
        NOW() - (random() * interval '30 days')
      FROM generate_series(1, 10000) AS i
      ON CONFLICT DO NOTHING
    `);

    // Générer des ventes
    await client.query(`
      INSERT INTO sales (sale_number, sale_date, total_amount, final_amount, payment_method, status, created_at, updated_at)
      SELECT 
        'SALE-' || i,
        NOW() - (random() * interval '180 days'),
        (random() * 50000)::numeric(10,2),
        (random() * 50000)::numeric(10,2),
        CASE (i % 3)
          WHEN 0 THEN 'CASH'
          WHEN 1 THEN 'CARD'
          ELSE 'MOBILE_MONEY'
        END,
        'COMPLETED',
        NOW() - (random() * interval '180 days'),
        NOW() - (random() * interval '90 days')
      FROM generate_series(1, 50000) AS i
      ON CONFLICT DO NOTHING
    `);

    // Générer des mouvements de stock
    await client.query(`
      INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_at, updated_at)
      SELECT 
        (random() * 10000 + 1)::integer,
        (random() * 50)::integer,
        CASE (i % 2) WHEN 0 THEN 'IN' ELSE 'OUT' END,
        'Test movement ' || i,
        NOW() - (random() * interval '60 days'),
        NOW() - (random() * interval '30 days')
      FROM generate_series(1, 20000) AS i
      ON CONFLICT DO NOTHING
    `);

    const duration = Date.now() - startTime;
    console.log(`✅ Données générées en ${duration}ms`);
    console.log("   - 10,000 produits");
    console.log("   - 50,000 ventes");
    console.log("   - 20,000 mouvements de stock");
  } catch (error) {
    console.error("❌ Erreur génération données:", error.message);
  }
}

/**
 * Benchmark d'une requête
 */
async function benchmarkQuery(client, name, query, params = []) {
  const times = [];
  const iterations = 5;

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    await client.query(query, params);
    const duration = Date.now() - startTime;
    times.push(duration);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  console.log(`   ${name}`);
  console.log(`      Avg: ${avg.toFixed(2)}ms | Min: ${min}ms | Max: ${max}ms`);

  return { name, avg, min, max, times };
}

/**
 * Analyse le plan d'exécution d'une requête
 */
async function explainQuery(client, query, params = []) {
  const result = await client.query(`EXPLAIN ANALYZE ${query}`, params);
  return result.rows;
}

/**
 * Tests de performance
 */
async function runPerformanceTests(client) {
  console.log("\n🔬 TESTS DE PERFORMANCE");
  console.log("═══════════════════════════════════════════════════");

  const results = [];

  // Test 1 : Requête de synchronisation delta sur products
  console.log("\n📊 Test 1: Sync delta - Products (updated_at)");
  const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 jours
  results.push(
    await benchmarkQuery(
      client,
      "SELECT products updated last 7 days",
      `SELECT id, name, selling_price, stock_quantity, updated_at 
     FROM products 
     WHERE updated_at > $1 AND is_active = true 
     ORDER BY updated_at DESC 
     LIMIT 100`,
      [cutoffDate]
    )
  );

  // Test 2 : Requête de synchronisation sur sales
  console.log("\n📊 Test 2: Sync delta - Sales (user + date)");
  results.push(
    await benchmarkQuery(
      client,
      "SELECT sales by user and date",
      `SELECT id, sale_number, total_amount, sale_date, updated_at 
     FROM sales 
     WHERE updated_at > $1 
     ORDER BY updated_at DESC 
     LIMIT 100`,
      [cutoffDate]
    )
  );

  // Test 3 : Recherche de produits en stock faible
  console.log("\n📊 Test 3: Low stock products");
  results.push(
    await benchmarkQuery(
      client,
      "SELECT low stock products",
      `SELECT id, name, stock_quantity, min_stock_level 
     FROM products 
     WHERE stock_quantity <= min_stock_level AND is_active = true 
     ORDER BY stock_quantity ASC 
     LIMIT 50`
    )
  );

  // Test 4 : Recherche par catégorie
  console.log("\n📊 Test 4: Products by category");
  results.push(
    await benchmarkQuery(
      client,
      "SELECT products by category",
      `SELECT id, name, category, selling_price 
     FROM products 
     WHERE category = $1 AND is_active = true 
     ORDER BY name 
     LIMIT 100`,
      ["Alimentation"]
    )
  );

  // Test 5 : Ventes par période
  console.log("\n📊 Test 5: Sales by date range");
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = new Date();
  results.push(
    await benchmarkQuery(
      client,
      "SELECT sales last 30 days",
      `SELECT id, sale_number, total_amount, sale_date 
     FROM sales 
     WHERE sale_date BETWEEN $1 AND $2 
     ORDER BY sale_date DESC 
     LIMIT 100`,
      [startDate, endDate]
    )
  );

  // Test 6 : Rapport des ventes par méthode de paiement
  console.log("\n📊 Test 6: Sales by payment method");
  results.push(
    await benchmarkQuery(
      client,
      "GROUP BY payment method",
      `SELECT payment_method, COUNT(*), SUM(final_amount) 
     FROM sales 
     WHERE sale_date > $1 
     GROUP BY payment_method 
     ORDER BY COUNT(*) DESC`,
      [startDate]
    )
  );

  // Test 7 : Mouvements de stock par produit
  console.log("\n📊 Test 7: Stock movements by product");
  results.push(
    await benchmarkQuery(
      client,
      "SELECT movements for product",
      `SELECT id, quantity, movement_type, created_at 
     FROM stock_movements 
     WHERE product_id = $1 
     ORDER BY created_at DESC 
     LIMIT 50`,
      [Math.floor(Math.random() * 10000) + 1]
    )
  );

  // Test 8 : Logs de sync récents
  console.log("\n📊 Test 8: Recent sync logs");
  results.push(
    await benchmarkQuery(
      client,
      "SELECT recent sync logs",
      `SELECT id, sync_type, device_id, operations_count, timestamp 
     FROM sync_logs 
     ORDER BY timestamp DESC 
     LIMIT 100`
    )
  );

  return results;
}

/**
 * Affiche le plan d'exécution des requêtes clés
 */
async function showExecutionPlans(client) {
  console.log("\n📋 PLANS D'EXÉCUTION DES REQUÊTES CLÉS");
  console.log("═══════════════════════════════════════════════════");

  const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Plan 1 : Sync delta products
  console.log("\n1️⃣  Sync delta - Products");
  console.log("─────────────────────────────────────────");
  const plan1 = await explainQuery(
    client,
    `SELECT id, name, updated_at 
     FROM products 
     WHERE updated_at > $1 AND is_active = true 
     ORDER BY updated_at DESC 
     LIMIT 100`,
    [cutoffDate]
  );

  plan1.forEach((row) => console.log("   " + row["QUERY PLAN"]));

  // Plan 2 : Low stock products
  console.log("\n2️⃣  Low stock products");
  console.log("─────────────────────────────────────────");
  const plan2 = await explainQuery(
    client,
    `SELECT id, name, stock_quantity 
     FROM products 
     WHERE stock_quantity <= min_stock_level AND is_active = true 
     LIMIT 50`
  );

  plan2.forEach((row) => console.log("   " + row["QUERY PLAN"]));
}

/**
 * Vérifie les index créés
 */
async function verifyIndexes(client) {
  console.log("\n🔍 VÉRIFICATION DES INDEX");
  console.log("═══════════════════════════════════════════════════");

  const result = await client.query(`
    SELECT 
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND (
        indexname LIKE 'idx_products_%' OR
        indexname LIKE 'idx_sales_%' OR
        indexname LIKE 'idx_stock_movements_%' OR
        indexname LIKE 'idx_sync_%'
      )
    ORDER BY tablename, indexname
  `);

  console.log(`\n✅ ${result.rows.length} index trouvés:\n`);

  let currentTable = "";
  result.rows.forEach((row) => {
    if (row.tablename !== currentTable) {
      currentTable = row.tablename;
      console.log(`\n📊 Table: ${row.tablename}`);
    }
    console.log(`   - ${row.indexname}`);
  });
}

/**
 * Statistiques des tables
 */
async function showTableStats(client) {
  console.log("\n📊 STATISTIQUES DES TABLES");
  console.log("═══════════════════════════════════════════════════");

  const result = await client.query(`
    SELECT 
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
      pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  `);

  console.log("\n");
  console.log(
    "Table".padEnd(25) + "Total".padEnd(12) + "Table".padEnd(12) + "Index"
  );
  console.log("─".repeat(60));

  result.rows.forEach((row) => {
    console.log(
      row.tablename.padEnd(25) +
        row.total_size.padEnd(12) +
        row.table_size.padEnd(12) +
        row.indexes_size
    );
  });
}

/**
 * Test principal
 */
async function runBenchmark() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║   BENCHMARK PERFORMANCE - INDEX SQL                  ║");
  console.log("║   Sales Manager - Optimisation Base de Données      ║");
  console.log("╚══════════════════════════════════════════════════════╝");

  let client;

  try {
    // Connexion
    console.log("\n🔌 Connexion à PostgreSQL...");
    client = await createConnection();
    console.log("✅ Connecté à la base de données");

    // Générer des données de test (si nécessaire)
    const countResult = await client.query("SELECT COUNT(*) FROM products");
    const productCount = parseInt(countResult.rows[0].count);

    if (productCount < 1000) {
      console.log("\n⚠️  Peu de données détectées, génération recommandée...");
      const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      // Demander confirmation (skip dans CI)
      if (process.env.CI !== "true") {
        await new Promise((resolve) => {
          readline.question("Générer des données de test? (y/n) ", (answer) => {
            if (answer.toLowerCase() === "y") {
              resolve(true);
            }
            readline.close();
            resolve(false);
          });
        });
      }

      await generateTestData(client);
    } else {
      console.log(`\n✅ ${productCount.toLocaleString()} produits existants`);
    }

    // Vérifier les index
    await verifyIndexes(client);

    // Statistiques des tables
    await showTableStats(client);

    // Exécuter les tests de performance
    const perfResults = await runPerformanceTests(client);

    // Afficher les plans d'exécution
    await showExecutionPlans(client);

    // Résumé
    console.log("\n╔══════════════════════════════════════════════════════╗");
    console.log("║              RÉSUMÉ DES PERFORMANCES                 ║");
    console.log("╚══════════════════════════════════════════════════════╝");

    const avgPerf =
      perfResults.reduce((sum, r) => sum + r.avg, 0) / perfResults.length;
    console.log(`\n📈 Performance moyenne: ${avgPerf.toFixed(2)}ms`);

    const fast = perfResults.filter((r) => r.avg < 50);
    const medium = perfResults.filter((r) => r.avg >= 50 && r.avg < 200);
    const slow = perfResults.filter((r) => r.avg >= 200);

    console.log(`   ✅ Rapides (< 50ms): ${fast.length}`);
    console.log(`   ⚠️  Moyennes (50-200ms): ${medium.length}`);
    console.log(`   🐌 Lentes (> 200ms): ${slow.length}`);

    if (slow.length > 0) {
      console.log("\n⚠️  Requêtes lentes à optimiser:");
      slow.forEach((r) => console.log(`   - ${r.name}: ${r.avg.toFixed(2)}ms`));
    }

    console.log("\n✅ Benchmark terminé !");
  } catch (error) {
    console.error("\n❌ Erreur:", error.message);
    throw error;
  } finally {
    if (client) {
      await client.end();
      console.log("\n🔌 Connexion fermée");
    }
  }
}

// Lancement
runBenchmark().catch((error) => {
  console.error("\n💥 Erreur fatale:", error);
  process.exit(1);
});

