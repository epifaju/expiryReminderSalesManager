/**
 * Script de test simple pour vérifier la création de reçus
 *
 * Ce script teste le flux complet :
 * 1. Authentification
 * 2. Création d'une vente
 * 3. Création d'un reçu
 * 4. Vérification dans la liste
 */

const API_BASE_URL = "http://192.168.1.16:8082";

async function testReceiptFlow() {
  console.log("🧪 Test du flux complet de création de reçus");
  console.log(`📍 Backend: ${API_BASE_URL}`);

  try {
    // 1. Authentification
    console.log("\n1️⃣ Authentification...");
    const authResponse = await fetch(`${API_BASE_URL}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@example.com",
        password: "admin123",
      }),
    });

    let token = null;
    if (authResponse.ok) {
      const authData = await authResponse.json();
      token = authData.accessToken;
      console.log("✅ Authentification réussie");
    } else {
      console.log("❌ Échec de l'authentification");
      return;
    }

    // 2. Créer une vente
    console.log("\n2️⃣ Création d'une vente...");
    const saleData = {
      items: [
        {
          productId: 1,
          productName: "Produit Test",
          quantity: 1,
          unitPrice: 15.0,
          discount: 0,
          totalPrice: 15.0,
        },
      ],
      totalAmount: 15.0,
      taxAmount: 0.0,
      discountAmount: 0.0,
      finalAmount: 15.0,
      paymentMethod: "CASH",
      customerName: "Client Test",
      notes: "Test de création de reçu",
    };

    const saleResponse = await fetch(`${API_BASE_URL}/api/sales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(saleData),
    });

    if (!saleResponse.ok) {
      console.log("❌ Erreur création vente:", saleResponse.status);
      return;
    }

    const saleResult = await saleResponse.json();
    const saleId = saleResult.id;
    console.log(`✅ Vente créée avec l'ID: ${saleId}`);

    // 3. Créer un reçu
    console.log("\n3️⃣ Création d'un reçu...");
    const receiptResponse = await fetch(
      `${API_BASE_URL}/api/receipts/create/${saleId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!receiptResponse.ok) {
      const errorText = await receiptResponse.text();
      console.log("❌ Erreur création reçu:", receiptResponse.status);
      console.log("📊 Détails:", errorText);
      return;
    }

    const receiptResult = await receiptResponse.json();
    console.log("✅ Reçu créé:", receiptResult);

    // 4. Vérifier dans la liste
    console.log("\n4️⃣ Vérification dans la liste des reçus...");
    const receiptsResponse = await fetch(`${API_BASE_URL}/api/receipts`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!receiptsResponse.ok) {
      console.log("❌ Erreur récupération reçus:", receiptsResponse.status);
      return;
    }

    const receiptsData = await receiptsResponse.json();
    const receipts = receiptsData.receipts || [];

    console.log(`📋 ${receipts.length} reçu(s) trouvé(s)`);

    if (receipts.length > 0) {
      console.log("✅ SUCCÈS ! Les reçus apparaissent dans la liste:");
      receipts.forEach((receipt, index) => {
        console.log(
          `  ${index + 1}. ID: ${receipt.id}, Numéro: ${
            receipt.receiptNumber
          }, Montant: ${receipt.finalAmount}€`
        );
      });

      // Vérifier que notre reçu est dans la liste
      const ourReceipt = receipts.find(
        (r) => r.id === receiptResult.receipt.id
      );
      if (ourReceipt) {
        console.log("🎉 PARFAIT ! Notre reçu créé est bien dans la liste !");
      } else {
        console.log(
          "⚠️ Notre reçu n'est pas dans la liste (problème de persistance)"
        );
      }
    } else {
      console.log("❌ ÉCHEC ! Aucun reçu dans la liste");
    }
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  }
}

// Exécuter le test
if (typeof window !== "undefined") {
  window.testReceiptFlow = testReceiptFlow;
  console.log(
    "🚀 Script de test chargé. Exécutez testReceiptFlow() pour lancer le test."
  );
} else {
  testReceiptFlow();
}
