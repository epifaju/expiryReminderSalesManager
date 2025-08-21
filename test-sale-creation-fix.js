const axios = require("axios");

const BASE_URL = "http://localhost:8083";

async function testSaleCreation() {
  try {
    console.log("🔐 Connexion en tant qu'admin...");

    // Login as admin
    const loginResponse = await axios.post(`${BASE_URL}/auth/signin`, {
      username: "admin",
      password: "admin123",
    });

    const token = loginResponse.data.token;
    console.log("✅ Connexion réussie !");

    // Get products to use in sale
    console.log("\n📦 Récupération des produits...");
    const productsResponse = await axios.get(`${BASE_URL}/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const products = productsResponse.data.content;
    console.log(`✅ ${products.length} produits trouvés`);

    // Create a new sale with multiple items
    console.log("\n💰 Création d'une nouvelle vente...");
    const saleData = {
      saleDate: new Date().toISOString(),
      customerName: "Test Customer Fix",
      customerPhone: "+33123456789",
      customerEmail: "test@example.com",
      paymentMethod: "CASH",
      notes: "Test de correction du finalAmount",
      saleItems: [
        {
          productId: products[0].id,
          quantity: 2,
          unitPrice: products[0].sellingPrice,
          discount: 0,
        },
        {
          productId: products[1].id,
          quantity: 1,
          unitPrice: products[1].sellingPrice,
          discount: 10.0,
        },
      ],
    };

    console.log("Données de la vente:", JSON.stringify(saleData, null, 2));

    const saleResponse = await axios.post(`${BASE_URL}/sales`, saleData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("\n✅ Vente créée avec succès !");
    console.log(
      "Détails de la vente:",
      JSON.stringify(saleResponse.data, null, 2)
    );

    // Verify the finalAmount is correctly calculated
    const sale = saleResponse.data;
    console.log("\n🔍 Vérification des calculs:");
    console.log(`Total Amount: ${sale.totalAmount}€`);
    console.log(`Final Amount: ${sale.finalAmount}€`);
    console.log(`Discount Amount: ${sale.discountAmount}€`);
    console.log(`Tax Amount: ${sale.taxAmount}€`);

    // Check each sale item
    console.log("\n📋 Articles de la vente:");
    sale.saleItems.forEach((item, index) => {
      console.log(`Article ${index + 1}:`);
      console.log(`  - Produit: ${item.productName}`);
      console.log(`  - Quantité: ${item.quantity}`);
      console.log(`  - Prix unitaire: ${item.unitPrice}€`);
      console.log(`  - Remise: ${item.discount}€`);
      console.log(`  - Sous-total: ${item.subtotal}€`);
    });

    // Calculate expected values
    const expectedTotal = sale.saleItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );
    const expectedFinal = expectedTotal - sale.discountAmount + sale.taxAmount;

    console.log("\n🧮 Calculs attendus:");
    console.log(`Total attendu: ${expectedTotal}€`);
    console.log(`Final attendu: ${expectedFinal}€`);

    if (sale.finalAmount === expectedFinal) {
      console.log("\n✅ SUCCESS: Le finalAmount est correctement calculé !");
    } else {
      console.log("\n❌ ERROR: Le finalAmount n'est pas correct !");
      console.log(`Attendu: ${expectedFinal}€, Reçu: ${sale.finalAmount}€`);
    }

    // Get all sales to check monthly revenue
    console.log("\n📊 Vérification du revenu mensuel...");
    const allSalesResponse = await axios.get(`${BASE_URL}/sales`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const allSales = allSalesResponse.data.content;
    console.log(`Total des ventes: ${allSales.length}`);

    // Calculate monthly revenue (current month)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthlySales = allSales.filter((sale) => {
      const saleDate = new Date(sale.saleDate);
      return (
        saleDate.getMonth() === currentMonth &&
        saleDate.getFullYear() === currentYear
      );
    });

    const monthlyRevenue = monthlySales.reduce(
      (sum, sale) => sum + (sale.finalAmount || sale.totalAmount || 0),
      0
    );

    console.log(`Ventes du mois: ${monthlySales.length}`);
    console.log(`Revenu mensuel calculé: ${monthlyRevenue}€`);

    console.log("\n📋 Détails des ventes du mois:");
    monthlySales.forEach((sale, index) => {
      console.log(
        `Vente ${index + 1}: ID=${sale.id}, Final=${sale.finalAmount}€, Total=${
          sale.totalAmount
        }€, Date=${sale.saleDate}`
      );
    });
  } catch (error) {
    console.error("❌ Erreur:", error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error("🔒 Erreur d'authentification - vérifiez les identifiants");
    }
  }
}

testSaleCreation();
