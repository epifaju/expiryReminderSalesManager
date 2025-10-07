/**
 * Script de test pour la détection de conflits côté backend
 *
 * Ce script teste les scénarios suivants :
 * 1. Conflit VERSION_MISMATCH : Modification simultanée client/serveur
 * 2. Conflit DELETE_UPDATE : Suppression côté client alors que le serveur a modifié
 * 3. Résolution de conflit avec stratégie SERVER_WINS
 *
 * Usage: node test-conflict-detection.js
 */

const axios = require("axios");

const BASE_URL = "http://localhost:8080/api";
let authToken = "";
let productId = "";

// Configuration
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
    console.log("Token:", authToken.substring(0, 20) + "...");
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
 * Crée un produit de test
 */
async function createTestProduct() {
  console.log("\n📦 Création produit de test...");
  try {
    const response = await axios.post(
      `${BASE_URL}/products`,
      {
        name: "Produit Test Conflit",
        description: "Pour tester la détection de conflits",
        price: 10000,
        category: "Test",
        stock_quantity: 50,
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    productId = response.data.id;
    console.log("✅ Produit créé avec ID:", productId);
    console.log("Updated At:", response.data.updated_at);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Erreur création produit:",
      error.response?.data || error.message
    );
    return null;
  }
}

/**
 * Modifie le produit directement via l'API (simule modification serveur)
 */
async function modifyProductOnServer(productId) {
  console.log("\n🖥️  Modification côté serveur...");
  try {
    const response = await axios.put(
      `${BASE_URL}/products/${productId}`,
      {
        name: "Produit Modifié Serveur",
        price: 15000,
        stock_quantity: 60,
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    console.log("✅ Produit modifié côté serveur");
    console.log("Nouveau prix:", response.data.price);
    console.log("Nouveau updated_at:", response.data.updated_at);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Erreur modification serveur:",
      error.response?.data || error.message
    );
    return null;
  }
}

/**
 * Test 1: Conflit VERSION_MISMATCH
 * Tente de synchroniser une modification client avec un timestamp obsolète
 */
async function testVersionMismatchConflict(product) {
  console.log("\n🧪 TEST 1: Conflit VERSION_MISMATCH");
  console.log("===============================================");

  // Le client a une version ancienne du produit
  const oldTimestamp = product.updated_at;

  // Le serveur modifie le produit (simule une autre modification)
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Attendre 1s
  const serverProduct = await modifyProductOnServer(productId);

  if (!serverProduct) {
    console.error("❌ Impossible de modifier le produit sur le serveur");
    return;
  }

  // Le client tente de synchroniser sa modification (avec ancien timestamp)
  console.log(
    "\n📱 Tentative de synchronisation client (timestamp obsolète)..."
  );

  const syncRequest = {
    device_id: "test-device-001",
    user_id: "1",
    operations: [
      {
        entity_id: productId.toString(),
        entity_type: "PRODUCT",
        operation_type: "UPDATE",
        entity_data: {
          name: "Produit Modifié Client",
          price: 12000,
          stock_quantity: 55,
          updated_at: oldTimestamp, // Timestamp ancien !
          user_id: "1",
        },
        local_id: "local-product-001",
        client_timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const response = await axios.post(`${BASE_URL}/sync/batch`, syncRequest, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    console.log("\n📊 Résultat de synchronisation:");
    console.log("Success count:", response.data.success_count);
    console.log("Conflict count:", response.data.conflict_count);
    console.log("Error count:", response.data.error_count);

    if (response.data.conflicts && response.data.conflicts.length > 0) {
      console.log("\n⚠️  CONFLIT DÉTECTÉ:");
      const conflict = response.data.conflicts[0];
      console.log("Type:", conflict.conflict_type);
      console.log("Entity ID:", conflict.entity_id);
      console.log("Message:", conflict.message);
      console.log(
        "\nDonnées locales:",
        JSON.stringify(conflict.local_data, null, 2)
      );
      console.log(
        "\nDonnées serveur:",
        JSON.stringify(conflict.server_data, null, 2)
      );
      console.log("\n✅ Test VERSION_MISMATCH RÉUSSI");
      return conflict.conflict_id;
    } else {
      console.error(
        "❌ Aucun conflit détecté alors qu'il devrait y en avoir un"
      );
    }
  } catch (error) {
    console.error(
      "❌ Erreur synchronisation:",
      error.response?.data || error.message
    );
  }
}

/**
 * Test 2: Conflit DELETE_UPDATE
 * Le client tente de supprimer un produit qui a été modifié sur le serveur
 */
async function testDeleteUpdateConflict() {
  console.log("\n🧪 TEST 2: Conflit DELETE_UPDATE");
  console.log("===============================================");

  // Créer un nouveau produit
  const newProduct = await createTestProduct();
  if (!newProduct) return;

  const oldTimestamp = newProduct.updated_at;

  // Modifier le produit côté serveur
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await modifyProductOnServer(newProduct.id);

  // Le client tente de supprimer (avec ancien timestamp)
  console.log("\n📱 Tentative de suppression client...");

  const syncRequest = {
    device_id: "test-device-001",
    user_id: "1",
    operations: [
      {
        entity_id: newProduct.id.toString(),
        entity_type: "PRODUCT",
        operation_type: "DELETE",
        entity_data: {
          updated_at: oldTimestamp,
          user_id: "1",
        },
        local_id: "local-product-002",
        client_timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const response = await axios.post(`${BASE_URL}/sync/batch`, syncRequest, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    console.log("\n📊 Résultat de synchronisation:");
    console.log("Conflict count:", response.data.conflict_count);

    if (response.data.conflicts && response.data.conflicts.length > 0) {
      console.log("\n⚠️  CONFLIT DÉTECTÉ:");
      const conflict = response.data.conflicts[0];
      console.log("Type:", conflict.conflict_type);
      console.log("Message:", conflict.message);
      console.log("\n✅ Test DELETE_UPDATE RÉUSSI");
    } else {
      console.error("❌ Aucun conflit détecté");
    }
  } catch (error) {
    console.error("❌ Erreur:", error.response?.data || error.message);
  }
}

/**
 * Test 3: Récupération des conflits non résolus
 */
async function testGetPendingConflicts() {
  console.log("\n🧪 TEST 3: Récupération conflits non résolus");
  console.log("===============================================");

  try {
    const response = await axios.get(`${BASE_URL}/sync/status`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    console.log("Statut serveur:", response.data.status);
    console.log("Timestamp serveur:", response.data.server_time);

    // TODO: Ajouter endpoint GET /api/sync/conflicts
    console.log("\n💡 Note: Endpoint GET /api/sync/conflicts à implémenter");
  } catch (error) {
    console.error("❌ Erreur:", error.response?.data || error.message);
  }
}

/**
 * Exécution de tous les tests
 */
async function runAllTests() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   TEST DÉTECTION DE CONFLITS - BACKEND      ║");
  console.log("╚══════════════════════════════════════════════╝");

  // Authentification
  const authenticated = await authenticate();
  if (!authenticated) {
    console.error("\n❌ Impossible de continuer sans authentification");
    return;
  }

  // Créer produit de test
  const product = await createTestProduct();
  if (!product) {
    console.error("\n❌ Impossible de continuer sans produit de test");
    return;
  }

  // Test 1: VERSION_MISMATCH
  await testVersionMismatchConflict(product);

  // Attendre un peu entre les tests
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 2: DELETE_UPDATE
  await testDeleteUpdateConflict();

  // Test 3: Récupération conflits
  await testGetPendingConflicts();

  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║        TESTS TERMINÉS                        ║");
  console.log("╚══════════════════════════════════════════════╝");
}

// Lancement des tests
runAllTests().catch((error) => {
  console.error("\n💥 Erreur fatale:", error);
  process.exit(1);
});
