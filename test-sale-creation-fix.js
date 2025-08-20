const axios = require("axios");

// Configuration
const BASE_URL = "http://localhost:8080";
const TEST_USER = {
  username: "admin",
  password: "admin123",
};

const TEST_SALE = {
  customerName: "Client Test Fix",
  customerPhone: "+33123456789",
  customerEmail: "test@example.com",
  paymentMethod: "CASH",
  saleDate: new Date().toISOString(), // Format ISO avec timezone
  discountAmount: 0,
  taxAmount: 0,
  notes: "Test de correction de l'erreur de création de vente",
  saleItems: [
    {
      productId: 1,
      quantity: 2,
      unitPrice: 15.5,
      discount: 0,
    },
    {
      productId: 2,
      quantity: 1,
      unitPrice: 25.0,
      discount: 0,
    },
  ],
};

async function testSaleCreation() {
  try {
    console.log("🔄 Test de création de vente après correction...");
    console.log("📅 Date envoyée:", TEST_SALE.saleDate);

    // 1. Connexion pour obtenir le token
    console.log("\n1. Connexion...");
    const loginResponse = await axios.post(
      `${BASE_URL}/auth/signin`,
      TEST_USER
    );
    const token = loginResponse.data.accessToken;
    console.log("✅ Connexion réussie");

    // 2. Vérification des produits disponibles
    console.log("\n2. Vérification des produits...");
    const productsResponse = await axios.get(`${BASE_URL}/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const products = Array.isArray(productsResponse.data)
      ? productsResponse.data
      : productsResponse.data.content || [];

    console.log(`📦 ${products.length} produit(s) disponible(s)`);

    if (products.length > 0) {
      // Utiliser les vrais IDs des produits
      TEST_SALE.saleItems = [
        {
          productId: products[0].id,
          quantity: 1,
          unitPrice: products[0].sellingPrice || products[0].price || 10.0,
          discount: 0,
        },
      ];

      if (products.length > 1) {
        TEST_SALE.saleItems.push({
          productId: products[1].id,
          quantity: 1,
          unitPrice: products[1].sellingPrice || products[1].price || 15.0,
          discount: 0,
        });
      }
    }

    // 3. Création de la vente
    console.log("\n3. Création de la vente...");
    console.log("📋 Données envoyées:", JSON.stringify(TEST_SALE, null, 2));

    const saleResponse = await axios.post(`${BASE_URL}/sales`, TEST_SALE, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Vente créée avec succès !");
    console.log("📊 Réponse:", JSON.stringify(saleResponse.data, null, 2));

    return true;
  } catch (error) {
    console.error("❌ Erreur lors du test:", error.message);

    if (error.response) {
      console.error("📄 Status:", error.response.status);
      console.error("📄 Data:", JSON.stringify(error.response.data, null, 2));
      console.error("📄 Headers:", error.response.headers);
    } else if (error.request) {
      console.error("📡 Pas de réponse du serveur");
    } else {
      console.error("⚙️ Erreur de configuration:", error.message);
    }

    return false;
  }
}

// Exécution du test
testSaleCreation().then((success) => {
  if (success) {
    console.log("\n🎉 Test réussi ! La correction fonctionne.");
  } else {
    console.log("\n💥 Test échoué. Vérifiez les logs ci-dessus.");
  }
  process.exit(success ? 0 : 1);
});
