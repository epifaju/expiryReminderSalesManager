// Script de test pour vérifier la connectivité au backend Spring Boot
const axios = require("axios");

const BACKEND_URL = "http://localhost:8083";

async function testSpringBackend() {
  console.log("🔍 Test de connectivité au backend Spring Boot...\n");

  try {
    // Test 1: Login
    console.log("📡 Test 1: Login");
    const loginResponse = await axios.post(
      `${BACKEND_URL}/auth/signin`,
      {
        username: "admin",
        password: "admin123",
      },
      {
        timeout: 5000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ Login réussi! Status: ${loginResponse.status}`);
    const token = loginResponse.data.token;
    console.log(`🎫 Token reçu: ${token ? "Oui" : "Non"}`);

    if (!token) {
      console.log("❌ Pas de token reçu, arrêt du test");
      return;
    }

    // Test 2: Récupérer les ventes
    console.log("\n📡 Test 2: Récupération des ventes");
    const salesResponse = await axios.get(`${BACKEND_URL}/sales`, {
      timeout: 5000,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`✅ Ventes récupérées! Status: ${salesResponse.status}`);
    const salesPage = salesResponse.data;
    const sales = salesPage.content || salesPage; // Handle paginated response
    console.log(`📊 Nombre de ventes: ${sales.length}`);
    console.log(
      `📄 Page info: ${
        salesPage.totalElements
          ? `${salesPage.totalElements} total, page ${salesPage.number + 1}/${
              salesPage.totalPages
            }`
          : "Non paginé"
      }`
    );

    // Analyser les ventes pour vérifier finalAmount
    console.log("\n🔍 Analyse des ventes:");
    let totalRevenue = 0;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    sales.forEach((sale, index) => {
      console.log(`\n📋 Vente ${index + 1}:`);
      console.log(`   ID: ${sale.id}`);
      console.log(`   Date: ${sale.saleDate}`);
      console.log(`   Total Amount: ${sale.totalAmount}€`);
      console.log(`   Final Amount: ${sale.finalAmount}€`);
      console.log(`   Status: ${sale.status}`);

      // Vérifier si la vente est du mois courant
      if (sale.saleDate) {
        const saleDate = new Date(sale.saleDate);
        if (
          saleDate.getMonth() === currentMonth &&
          saleDate.getFullYear() === currentYear
        ) {
          const amount = sale.finalAmount || sale.totalAmount || 0;
          totalRevenue += amount;
          console.log(
            `   ✅ Vente du mois courant - Montant ajouté: ${amount}€`
          );
        } else {
          console.log(`   ⏰ Vente d'un autre mois`);
        }
      }
    });

    console.log(`\n💰 Revenu total du mois: ${totalRevenue.toFixed(2)}€`);

    if (totalRevenue > 0) {
      console.log(
        "✅ Le calcul du revenu mensuel devrait maintenant fonctionner!"
      );
    } else {
      console.log("❌ Aucun revenu calculé - il pourrait y avoir un problème");
    }
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
    if (error.response) {
      console.log(`📄 Status: ${error.response.status}`);
      console.log(
        `📄 Réponse d'erreur: ${JSON.stringify(error.response.data, null, 2)}`
      );
    }
  }

  console.log("\n🏁 Test terminé!");
}

// Exécuter le test
testSpringBackend().catch(console.error);
