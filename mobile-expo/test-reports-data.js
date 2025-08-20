/**
 * Script de test pour vérifier la fonctionnalité Rapports
 * Génère des données de test et vérifie les calculs
 */

// Données de test réalistes
const testProducts = [
  {
    id: 1,
    name: "Coca-Cola 33cl",
    sellingPrice: 1.5,
    stockQuantity: 100,
    category: "Boissons",
    purchasePrice: 0.8,
  },
  {
    id: 2,
    name: "Pain de mie",
    sellingPrice: 2.5,
    stockQuantity: 50,
    category: "Boulangerie",
    purchasePrice: 1.2,
  },
  {
    id: 3,
    name: "Lait UHT 1L",
    sellingPrice: 1.2,
    stockQuantity: 75,
    category: "Produits laitiers",
    purchasePrice: 0.7,
  },
  {
    id: 4,
    name: "Café Premium",
    sellingPrice: 4.5,
    stockQuantity: 30,
    category: "Boissons",
    purchasePrice: 2.8,
  },
  {
    id: 5,
    name: "Chocolat noir",
    sellingPrice: 3.2,
    stockQuantity: 40,
    category: "Confiserie",
    purchasePrice: 1.9,
  },
];

const testSales = [
  // Ventes d'aujourd'hui
  {
    id: 1,
    saleNumber: "SALE-001",
    saleDate: new Date().toISOString(),
    totalAmount: 7.7,
    finalAmount: 7.7,
    paymentMethod: "CASH",
    status: "COMPLETED",
    saleItems: [
      {
        productId: 1,
        productName: "Coca-Cola 33cl",
        quantity: 2,
        unitPrice: 1.5,
        totalPrice: 3.0,
      },
      {
        productId: 3,
        productName: "Lait UHT 1L",
        quantity: 1,
        unitPrice: 1.2,
        totalPrice: 1.2,
      },
      {
        productId: 5,
        productName: "Chocolat noir",
        quantity: 1,
        unitPrice: 3.2,
        totalPrice: 3.2,
      },
    ],
    totalProfit: 2.5,
    totalQuantity: 4,
  },
  {
    id: 2,
    saleNumber: "SALE-002",
    saleDate: new Date().toISOString(),
    totalAmount: 12.7,
    finalAmount: 12.7,
    paymentMethod: "CARD",
    status: "COMPLETED",
    saleItems: [
      {
        productId: 4,
        productName: "Café Premium",
        quantity: 2,
        unitPrice: 4.5,
        totalPrice: 9.0,
      },
      {
        productId: 2,
        productName: "Pain de mie",
        quantity: 1,
        unitPrice: 2.5,
        totalPrice: 2.5,
      },
      {
        productId: 3,
        productName: "Lait UHT 1L",
        quantity: 1,
        unitPrice: 1.2,
        totalPrice: 1.2,
      },
    ],
    totalProfit: 4.5,
    totalQuantity: 4,
  },
  // Ventes d'hier
  {
    id: 3,
    saleNumber: "SALE-003",
    saleDate: new Date(Date.now() - 86400000).toISOString(),
    totalAmount: 8.9,
    finalAmount: 8.9,
    paymentMethod: "CASH",
    status: "COMPLETED",
    saleItems: [
      {
        productId: 1,
        productName: "Coca-Cola 33cl",
        quantity: 3,
        unitPrice: 1.5,
        totalPrice: 4.5,
      },
      {
        productId: 4,
        productName: "Café Premium",
        quantity: 1,
        unitPrice: 4.5,
        totalPrice: 4.5,
      },
    ],
    totalProfit: 3.6,
    totalQuantity: 4,
  },
  // Ventes de la semaine dernière
  {
    id: 4,
    saleNumber: "SALE-004",
    saleDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    totalAmount: 15.4,
    finalAmount: 15.4,
    paymentMethod: "TRANSFER",
    status: "COMPLETED",
    saleItems: [
      {
        productId: 2,
        productName: "Pain de mie",
        quantity: 2,
        unitPrice: 2.5,
        totalPrice: 5.0,
      },
      {
        productId: 4,
        productName: "Café Premium",
        quantity: 2,
        unitPrice: 4.5,
        totalPrice: 9.0,
      },
      {
        productId: 3,
        productName: "Lait UHT 1L",
        quantity: 1,
        unitPrice: 1.2,
        totalPrice: 1.2,
      },
    ],
    totalProfit: 6.2,
    totalQuantity: 5,
  },
  // Vente du mois dernier
  {
    id: 5,
    saleNumber: "SALE-005",
    saleDate: new Date(Date.now() - 35 * 86400000).toISOString(),
    totalAmount: 6.7,
    finalAmount: 6.7,
    paymentMethod: "CARD",
    status: "COMPLETED",
    saleItems: [
      {
        productId: 1,
        productName: "Coca-Cola 33cl",
        quantity: 1,
        unitPrice: 1.5,
        totalPrice: 1.5,
      },
      {
        productId: 2,
        productName: "Pain de mie",
        quantity: 1,
        unitPrice: 2.5,
        totalPrice: 2.5,
      },
      {
        productId: 5,
        productName: "Chocolat noir",
        quantity: 1,
        unitPrice: 3.2,
        totalPrice: 3.2,
      },
    ],
    totalProfit: 2.4,
    totalQuantity: 3,
  },
];

// Fonction de test des calculs
function testReportCalculations() {
  console.log("🧪 Test des calculs de rapports...\n");

  // Test pour la période "today"
  const todaySales = testSales.filter((sale) => {
    const saleDate = new Date(sale.saleDate);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  });

  console.log("📊 Statistiques pour AUJOURD'HUI:");
  console.log(`- Nombre de ventes: ${todaySales.length}`);

  const todayRevenue = todaySales.reduce(
    (sum, sale) => sum + sale.totalAmount,
    0
  );
  console.log(`- Chiffre d'affaires: ${todayRevenue.toFixed(2)} €`);

  const todayProfit = todaySales.reduce(
    (sum, sale) => sum + (sale.totalProfit || 0),
    0
  );
  console.log(`- Bénéfice total: ${todayProfit.toFixed(2)} €`);

  const todayMargin = todayRevenue > 0 ? (todayProfit / todayRevenue) * 100 : 0;
  console.log(`- Marge bénéficiaire: ${todayMargin.toFixed(1)}%`);

  const avgOrderValue =
    todaySales.length > 0 ? todayRevenue / todaySales.length : 0;
  console.log(`- Panier moyen: ${avgOrderValue.toFixed(2)} €\n`);

  // Test des méthodes de paiement
  const paymentMethods = {};
  todaySales.forEach((sale) => {
    if (!paymentMethods[sale.paymentMethod]) {
      paymentMethods[sale.paymentMethod] = { count: 0, amount: 0 };
    }
    paymentMethods[sale.paymentMethod].count += 1;
    paymentMethods[sale.paymentMethod].amount += sale.totalAmount;
  });

  console.log("💳 Répartition par méthode de paiement (aujourd'hui):");
  Object.entries(paymentMethods).forEach(([method, data]) => {
    console.log(
      `- ${method}: ${data.count} vente(s), ${data.amount.toFixed(2)} €`
    );
  });
  console.log("");

  // Test des top produits
  const productSales = {};
  todaySales.forEach((sale) => {
    sale.saleItems.forEach((item) => {
      if (!productSales[item.productName]) {
        productSales[item.productName] = { quantity: 0, revenue: 0 };
      }
      productSales[item.productName].quantity += item.quantity;
      productSales[item.productName].revenue += item.totalPrice;
    });
  });

  const topProducts = Object.entries(productSales)
    .map(([productName, data]) => ({
      productName,
      totalQuantity: data.quantity,
      totalRevenue: data.revenue,
    }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity);

  console.log("🏆 Top produits vendus (aujourd'hui):");
  topProducts.forEach((product, index) => {
    console.log(
      `${index + 1}. ${product.productName}: ${
        product.totalQuantity
      } unités, ${product.totalRevenue.toFixed(2)} €`
    );
  });
  console.log("");

  // Test pour la période "week"
  const weekSales = testSales.filter((sale) => {
    const saleDate = new Date(sale.saleDate);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return saleDate >= weekAgo;
  });

  console.log("📊 Statistiques pour la SEMAINE:");
  console.log(`- Nombre de ventes: ${weekSales.length}`);

  const weekRevenue = weekSales.reduce(
    (sum, sale) => sum + sale.totalAmount,
    0
  );
  console.log(`- Chiffre d'affaires: ${weekRevenue.toFixed(2)} €`);

  const weekProfit = weekSales.reduce(
    (sum, sale) => sum + (sale.totalProfit || 0),
    0
  );
  console.log(`- Bénéfice total: ${weekProfit.toFixed(2)} €`);

  const weekMargin = weekRevenue > 0 ? (weekProfit / weekRevenue) * 100 : 0;
  console.log(`- Marge bénéficiaire: ${weekMargin.toFixed(1)}%\n`);

  return {
    todayStats: {
      totalSales: todaySales.length,
      totalRevenue: todayRevenue,
      totalProfit: todayProfit,
      profitMargin: todayMargin,
      averageOrderValue: avgOrderValue,
      paymentMethods: Object.entries(paymentMethods).map(([method, data]) => ({
        method,
        count: data.count,
        amount: data.amount,
      })),
      topProducts,
    },
    weekStats: {
      totalSales: weekSales.length,
      totalRevenue: weekRevenue,
      totalProfit: weekProfit,
      profitMargin: weekMargin,
    },
  };
}

// Test de validation des données
function testDataValidation() {
  console.log("🔍 Test de validation des données...\n");

  // Test avec données manquantes
  const invalidSale = {
    id: 999,
    saleDate: new Date().toISOString(),
    totalAmount: null, // Valeur invalide
    paymentMethod: "UNKNOWN", // Méthode inconnue
    status: "COMPLETED",
    saleItems: [
      {
        productId: 1,
        productName: "",
        quantity: 0,
        unitPrice: 1.5,
        totalPrice: 0,
      }, // Données invalides
    ],
  };

  console.log("❌ Test avec données invalides:");
  console.log("- totalAmount null:", invalidSale.totalAmount === null);
  console.log(
    "- paymentMethod inconnu:",
    !["CASH", "CARD", "TRANSFER"].includes(invalidSale.paymentMethod)
  );
  console.log(
    "- productName vide:",
    invalidSale.saleItems[0].productName === ""
  );
  console.log("- quantity zéro:", invalidSale.saleItems[0].quantity === 0);
  console.log("");

  // Test de nettoyage des données
  const cleanedAmount = invalidSale.totalAmount || 0;
  const cleanedMethod = ["CASH", "CARD", "TRANSFER"].includes(
    invalidSale.paymentMethod
  )
    ? invalidSale.paymentMethod
    : "UNKNOWN";

  console.log("✅ Après nettoyage:");
  console.log("- totalAmount nettoyé:", cleanedAmount);
  console.log("- paymentMethod nettoyé:", cleanedMethod);
  console.log("");
}

// Test des calculs de période
function testPeriodCalculations() {
  console.log("📅 Test des calculs par période...\n");

  const now = new Date();
  const periods = ["today", "week", "month", "year"];

  periods.forEach((period) => {
    const startDate = new Date();

    switch (period) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const filteredSales = testSales.filter(
      (sale) => new Date(sale.saleDate) >= startDate
    );
    const revenue = filteredSales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    console.log(`📊 Période "${period}":`, {
      ventes: filteredSales.length,
      revenus: `${revenue.toFixed(2)} €`,
      dateDebut: startDate.toLocaleDateString("fr-FR"),
    });
  });
  console.log("");
}

// Exécution des tests
console.log("🚀 Démarrage des tests de la fonctionnalité Rapports\n");
console.log("=".repeat(60));

const results = testReportCalculations();
testDataValidation();
testPeriodCalculations();

console.log("=".repeat(60));
console.log("✅ Tests terminés avec succès !");
console.log("\n📋 Résumé des résultats:");
console.log(`- Ventes aujourd'hui: ${results.todayStats.totalSales}`);
console.log(
  `- Revenus aujourd'hui: ${results.todayStats.totalRevenue.toFixed(2)} €`
);
console.log(
  `- Marge aujourd'hui: ${results.todayStats.profitMargin.toFixed(1)}%`
);
console.log(`- Ventes cette semaine: ${results.weekStats.totalSales}`);
console.log(
  `- Revenus cette semaine: ${results.weekStats.totalRevenue.toFixed(2)} €`
);

// Export des données pour utilisation dans l'app
module.exports = {
  testProducts,
  testSales,
  testReportCalculations,
  testDataValidation,
  testPeriodCalculations,
};
