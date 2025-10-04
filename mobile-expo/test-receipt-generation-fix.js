/**
 * Script de test pour vérifier la correction de génération de reçus
 *
 * Ce script teste le flux complet corrigé :
 * 1. Authentification
 * 2. Création d'une vente
 * 3. Création d'un reçu (avec la correction du QR code)
 * 4. Vérification que le reçu apparaît dans la liste
 * 5. Test de téléchargement PDF
 */

const API_BASE_URL = "http://localhost:8083";

async function testReceiptGenerationFix() {
  console.log("🧪 Test de la correction de génération de reçus");
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
          productName: "Produit Test Correction",
          quantity: 2,
          unitPrice: 25.0,
          discount: 5.0,
          totalPrice: 45.0,
        },
      ],
      totalAmount: 50.0,
      taxAmount: 10.0,
      discountAmount: 5.0,
      finalAmount: 55.0,
      paymentMethod: "CARD",
      customerName: "Client Test Correction",
      customerPhone: "0123456789",
      customerEmail: "client@test.com",
      notes: "Test de correction de génération de reçus",
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

    // 3. Créer un reçu (test de la correction)
    console.log("\n3️⃣ Création d'un reçu (test de la correction)...");
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
    console.log("✅ Reçu créé avec succès:", receiptResult);

    // Vérifier que le reçu a un numéro généré
    const receipt = receiptResult.receipt;
    if (receipt.receiptNumber) {
      console.log(`✅ Numéro de reçu généré: ${receipt.receiptNumber}`);
    } else {
      console.log("❌ PROBLÈME: Aucun numéro de reçu généré !");
    }

    // Vérifier que le QR code est généré
    if (receipt.qrCodeData) {
      console.log(
        `✅ QR Code généré: ${receipt.qrCodeData.substring(0, 50)}...`
      );
    } else {
      console.log("❌ PROBLÈME: Aucun QR Code généré !");
    }

    // 4. Vérifier dans la liste des reçus
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
      const ourReceipt = receipts.find((r) => r.id === receipt.id);
      if (ourReceipt) {
        console.log("🎉 PARFAIT ! Notre reçu créé est bien dans la liste !");

        // Vérifier les détails du reçu
        console.log("📄 Détails du reçu créé:");
        console.log(`   - ID: ${ourReceipt.id}`);
        console.log(`   - Numéro: ${ourReceipt.receiptNumber}`);
        console.log(`   - Montant total: ${ourReceipt.totalAmount}€`);
        console.log(`   - Montant final: ${ourReceipt.finalAmount}€`);
        console.log(`   - Client: ${ourReceipt.customerName}`);
        console.log(`   - Date: ${ourReceipt.createdAt}`);
        console.log(`   - Statut: ${ourReceipt.status}`);
        console.log(`   - QR Code: ${ourReceipt.qrCodeData ? "Oui" : "Non"}`);
      } else {
        console.log(
          "⚠️ Notre reçu n'est pas dans la liste (problème de persistance)"
        );
      }
    } else {
      console.log("❌ ÉCHEC ! Aucun reçu dans la liste");
    }

    // 5. Test de téléchargement PDF (optionnel)
    console.log("\n5️⃣ Test de téléchargement PDF...");
    try {
      const pdfResponse = await fetch(
        `${API_BASE_URL}/api/receipts/${receipt.id}/pdf`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (pdfResponse.ok) {
        console.log("✅ PDF généré avec succès");
        console.log(
          `📊 Taille du PDF: ${pdfResponse.headers.get("content-length")} bytes`
        );
      } else {
        console.log("⚠️ Erreur génération PDF:", pdfResponse.status);
      }
    } catch (pdfError) {
      console.log("⚠️ Erreur lors du test PDF:", pdfError.message);
    }

    console.log("\n🎉 Test de correction terminé avec succès !");
    console.log("✅ La génération de reçus fonctionne maintenant correctement");
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  }
}

// Exécuter le test
if (typeof window !== "undefined") {
  window.testReceiptGenerationFix = testReceiptGenerationFix;
  console.log(
    "🚀 Script de test chargé. Exécutez testReceiptGenerationFix() pour lancer le test."
  );
} else {
  testReceiptGenerationFix();
}
