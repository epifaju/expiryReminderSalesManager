/**
 * Script de test pour vérifier la correction de génération de reçus
 *
 * Ce script teste :
 * 1. La création d'un reçu via l'API backend
 * 2. La récupération des reçus
 * 3. Que les reçus créés apparaissent dans la liste
 */

const API_BASE_URL = "http://localhost:8080";

async function testReceiptCreation() {
  console.log("🧪 Test de création de reçu");

  try {
    // 1. Se connecter d'abord (optionnel si pas besoin d'auth)
    const authResponse = await fetch(`${API_BASE_URL}/api/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com", // Utilisateur de test
        password: "password123",
      }),
    });

    let token = null;
    if (authResponse.ok) {
      const authData = await authResponse.json();
      token = authData.accessToken;
      console.log("✅ Authentification réussie");
    } else {
      console.log(
        "⚠️ Pas d'authentification, continuation du test sans token..."
      );
    }

    // 2. Créer une vente de test d'abord
    console.log("🛒 Création d'une vente de test...");

    const saleData = {
      items: [
        {
          productId: 1,
          productName: "Produit de test",
          quantity: 2,
          unitPrice: 10.0,
          discount: 0,
          totalPrice: 20.0,
        },
      ],
      totalAmount: 20.0,
      taxAmount: 0.0,
      discountAmount: 0.0,
      finalAmount: 20.0,
      paymentMethod: "CASH",
      customerName: "Client Test",
      notes: "Vente de test pour reçu",
    };

    const saleHeaders = {
      "Content-Type": "application/json",
    };

    if (token) {
      saleHeaders["Authorization"] = `Bearer ${token}`;
    }

    const saleResponse = await fetch(`${API_BASE_URL}/api/sales`, {
      method: "POST",
      headers: saleHeaders,
      body: JSON.stringify(saleData),
    });

    if (!saleResponse.ok) {
      throw new Error(
        `Erreur création vente: ${saleResponse.status} ${saleResponse.statusText}`
      );
    }

    const saleResult = await saleResponse.json();
    const saleId = saleResult.id;
    console.log(`✅ Vente créée avec l'ID: ${saleId}`);

    // 3. Créer un reçu pour cette vente
    console.log(`🧾 Création d'un reçu pour la vente ${saleId}...`);

    const receiptHeaders = {
      "Content-Type": "application/json",
    };

    if (token) {
      receiptHeaders["Authorization"] = `Bearer ${token}`;
    }

    const receiptResponse = await fetch(
      `${API_BASE_URL}/api/receipts/create/${saleId}`,
      {
        method: "POST",
        headers: receiptHeaders,
      }
    );

    if (!receiptResponse.ok) {
      throw new Error(
        `Erreur création reçu: ${receiptResponse.status} ${receiptResponse.statusText}`
      );
    }

    const receiptResult = await receiptResponse.json();
    console.log("✅ Reçu créé avec succès:", receiptResult);

    // 4. Récupérer tous les reçus pour vérifier qu'il apparaît
    console.log("📋 Récupération de tous les reçus...");

    const receiptsResponse = await fetch(`${API_BASE_URL}/api/receipts`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!receiptsResponse.ok) {
      throw new Error(
        `Erreur récupération reçus: ${receiptsResponse.status} ${receiptsResponse.statusText}`
      );
    }

    const receiptsData = await receiptsResponse.json();
    console.log(`✅ ${receiptsData.receipts?.length || 0} reçu(s) trouvé(s)`);

    if (receiptsData.receipts && receiptsData.receipts.length > 0) {
      console.log("📄 Liste des reçus:");
      receiptsData.receipts.forEach((receipt, index) => {
        console.log(
          `  ${index + 1}. Reçu ${receipt.receiptNumber} - Montant: ${
            receipt.finalAmount
          }€`
        );
      });

      // Chercher le reçu créé
      const createdReceipt = receiptsData.receipts.find(
        (r) => r.id === receiptResult.receipt.id
      );
      if (createdReceipt) {
        console.log("✅ Le reçu créé apparaît bien dans la liste !");
        console.log(`   - Numéro: ${createdReceipt.receiptNumber}`);
        console.log(`   - Montant total: ${createdReceipt.finalAmount}€`);
        console.log(`   - Date: ${createdReceipt.createdAt}`);
        console.log(`   - Statut: ${createdReceipt.status}`);
      } else {
        console.log("❌ Le reçu créé n'apparaît pas dans la liste !");
      }
    } else {
      console.log("❌ Aucun reçu trouvé dans la liste");
    }

    console.log("\n🎉 Test terminé avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  }
}

// Exécuter le test
if (typeof window !== "undefined") {
  // Dans un navigateur
  window.testReceiptCreation = testReceiptCreation;
  console.log(
    "🚀 Script chargé. Exécutez testReceiptCreation() dans la console pour lancer le test."
  );
} else {
  // Dans Node.js
  testReceiptCreation();
}
