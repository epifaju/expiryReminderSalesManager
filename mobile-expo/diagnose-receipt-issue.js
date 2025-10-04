/**
 * Script de diagnostic pour identifier le problème avec les reçus
 *
 * Ce script vérifie :
 * 1. La configuration du backend (port, base de données)
 * 2. L'existence de la table receipts
 * 3. La création et récupération de reçus
 * 4. Les logs détaillés
 */

const API_BASE_URL = "http://192.168.1.16:8082"; // Utilisez votre IP et port

async function diagnoseReceiptIssue() {
  console.log("🔍 Diagnostic du problème de reçus");
  console.log(`📍 URL du backend: ${API_BASE_URL}`);

  try {
    // 1. Vérifier la santé du backend
    console.log("\n1️⃣ Vérification de la santé du backend...");

    try {
      const healthResponse = await fetch(`${API_BASE_URL}/actuator/health`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log("✅ Backend accessible:", healthData);
      } else {
        console.log("⚠️ Backend accessible mais pas de health endpoint");
      }
    } catch (error) {
      console.log("❌ Backend non accessible:", error.message);
      console.log("💡 Vérifiez que le backend est démarré et accessible");
      return;
    }

    // 2. Se connecter pour obtenir un token
    console.log("\n2️⃣ Authentification...");

    const authResponse = await fetch(`${API_BASE_URL}/api/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@example.com", // Essayez différents utilisateurs
        password: "admin123",
      }),
    });

    let token = null;
    if (authResponse.ok) {
      const authData = await authResponse.json();
      token = authData.accessToken;
      console.log("✅ Authentification réussie");
    } else {
      console.log("⚠️ Échec de l'authentification, essayons sans token...");
      console.log("📊 Détails:", await authResponse.text());
    }

    // 3. Vérifier les ventes existantes
    console.log("\n3️⃣ Vérification des ventes existantes...");

    const salesHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    const salesResponse = await fetch(`${API_BASE_URL}/api/sales`, {
      method: "GET",
      headers: salesHeaders,
    });

    if (salesResponse.ok) {
      const salesData = await salesResponse.json();
      console.log(
        `✅ ${
          salesData.content?.length || salesData.length || 0
        } vente(s) trouvée(s)`
      );

      if (salesData.content && salesData.content.length > 0) {
        console.log("📋 Première vente:", salesData.content[0]);
        return salesData.content[0].id; // Retourner l'ID de la première vente
      } else if (Array.isArray(salesData) && salesData.length > 0) {
        console.log("📋 Première vente:", salesData[0]);
        return salesData[0].id;
      } else {
        console.log("❌ Aucune vente trouvée");
        return null;
      }
    } else {
      console.log(
        "❌ Erreur lors de la récupération des ventes:",
        salesResponse.status
      );
      console.log("📊 Détails:", await salesResponse.text());
      return null;
    }
  } catch (error) {
    console.error("❌ Erreur lors du diagnostic:", error);
    return null;
  }
}

async function testReceiptCreationWithSale(saleId) {
  console.log(`\n4️⃣ Test de création de reçu pour la vente ${saleId}...`);

  try {
    // Se reconnecter pour obtenir un token
    const authResponse = await fetch(`${API_BASE_URL}/api/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@example.com",
        password: "admin123",
      }),
    });

    let token = null;
    if (authResponse.ok) {
      const authData = await authResponse.json();
      token = authData.accessToken;
    }

    // Créer un reçu
    const receiptHeaders = {
      "Content-Type": "application/json",
    };

    if (token) {
      receiptHeaders["Authorization"] = `Bearer ${token}`;
    }

    console.log("📤 Envoi de la requête de création de reçu...");
    const receiptResponse = await fetch(
      `${API_BASE_URL}/api/receipts/create/${saleId}`,
      {
        method: "POST",
        headers: receiptHeaders,
      }
    );

    console.log(`📊 Status de la réponse: ${receiptResponse.status}`);
    console.log(
      `📊 Headers de la réponse:`,
      Object.fromEntries(receiptResponse.headers.entries())
    );

    if (receiptResponse.ok) {
      const receiptResult = await receiptResponse.json();
      console.log("✅ Reçu créé avec succès:", receiptResult);

      // Vérifier immédiatement dans la liste
      console.log("\n5️⃣ Vérification dans la liste des reçus...");

      const receiptsResponse = await fetch(`${API_BASE_URL}/api/receipts`, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (receiptsResponse.ok) {
        const receiptsData = await receiptsResponse.json();
        console.log(
          `📋 ${receiptsData.receipts?.length || 0} reçu(s) dans la liste`
        );

        if (receiptsData.receipts && receiptsData.receipts.length > 0) {
          console.log("✅ Reçus trouvés dans la liste:");
          receiptsData.receipts.forEach((receipt, index) => {
            console.log(
              `  ${index + 1}. ID: ${receipt.id}, Numéro: ${
                receipt.receiptNumber
              }, Montant: ${receipt.finalAmount}€`
            );
          });
        } else {
          console.log(
            "❌ Aucun reçu dans la liste - Problème de persistance !"
          );
        }
      } else {
        console.log(
          "❌ Erreur lors de la récupération des reçus:",
          receiptsResponse.status
        );
        console.log("📊 Détails:", await receiptsResponse.text());
      }
    } else {
      const errorText = await receiptResponse.text();
      console.log(
        "❌ Erreur lors de la création du reçu:",
        receiptResponse.status
      );
      console.log("📊 Détails:", errorText);
    }
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  }
}

async function runFullDiagnostic() {
  console.log("🚀 Lancement du diagnostic complet...");

  const saleId = await diagnoseReceiptIssue();

  if (saleId) {
    await testReceiptCreationWithSale(saleId);
  } else {
    console.log("\n💡 Créons d'abord une vente de test...");

    try {
      const authResponse = await fetch(`${API_BASE_URL}/api/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "admin@example.com",
          password: "admin123",
        }),
      });

      let token = null;
      if (authResponse.ok) {
        const authData = await authResponse.json();
        token = authData.accessToken;
      }

      // Créer une vente de test
      const saleData = {
        items: [
          {
            productId: 1,
            productName: "Produit de test",
            quantity: 1,
            unitPrice: 10.0,
            discount: 0,
            totalPrice: 10.0,
          },
        ],
        totalAmount: 10.0,
        taxAmount: 0.0,
        discountAmount: 0.0,
        finalAmount: 10.0,
        paymentMethod: "CASH",
        customerName: "Client Test",
        notes: "Vente de test pour diagnostic",
      };

      const saleHeaders = {
        "Content-Type": "application/json",
      };

      if (token) {
        saleHeaders["Authorization"] = `Bearer ${token}`;
      }

      console.log("📤 Création d'une vente de test...");
      const saleResponse = await fetch(`${API_BASE_URL}/api/sales`, {
        method: "POST",
        headers: saleHeaders,
        body: JSON.stringify(saleData),
      });

      if (saleResponse.ok) {
        const saleResult = await saleResponse.json();
        console.log(`✅ Vente créée avec l'ID: ${saleResult.id}`);
        await testReceiptCreationWithSale(saleResult.id);
      } else {
        console.log(
          "❌ Erreur lors de la création de la vente:",
          saleResponse.status
        );
        console.log("📊 Détails:", await saleResponse.text());
      }
    } catch (error) {
      console.error("❌ Erreur lors de la création de vente:", error);
    }
  }
}

// Exécuter le diagnostic
if (typeof window !== "undefined") {
  window.runFullDiagnostic = runFullDiagnostic;
  window.diagnoseReceiptIssue = diagnoseReceiptIssue;
  console.log(
    "🚀 Script de diagnostic chargé. Exécutez runFullDiagnostic() pour lancer le diagnostic complet."
  );
} else {
  runFullDiagnostic();
}
