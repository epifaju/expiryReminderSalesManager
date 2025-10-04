// Test de l'endpoint d'authentification correct
const http = require("http");

const baseUrl = "http://localhost:8082";

async function testAuth() {
  console.log("=== TEST DE L'ENDPOINT D'AUTHENTIFICATION ===\n");

  try {
    // Test 1: Endpoint /auth/test
    console.log("1. Test de l'endpoint /auth/test...");
    const testResponse = await makeRequest("/auth/test", "GET");
    console.log("✅ Endpoint /auth/test accessible");
    console.log("Réponse:", testResponse);

    // Test 2: Endpoint /auth/signin
    console.log("\n2. Test de l'endpoint /auth/signin...");
    const authData = JSON.stringify({
      username: "admin@example.com",
      password: "admin123",
    });

    const authResponse = await makeRequest("/auth/signin", "POST", authData);
    const authResult = JSON.parse(authResponse);
    console.log("✅ Authentification réussie");
    console.log("Token:", authResult.accessToken.substring(0, 20) + "...");

    // Test 3: Création de reçu
    console.log("\n3. Test de création de reçu...");

    // Créer une vente d'abord
    const saleData = JSON.stringify({
      items: [
        {
          productId: 1,
          productName: "Produit Test",
          quantity: 1,
          unitPrice: 10.0,
          discount: 0.0,
          totalPrice: 10.0,
        },
      ],
      totalAmount: 10.0,
      taxAmount: 2.0,
      discountAmount: 0.0,
      finalAmount: 12.0,
      paymentMethod: "CARD",
      customerName: "Client Test",
    });

    const saleResponse = await makeRequest(
      "/api/sales",
      "POST",
      saleData,
      authResult.accessToken
    );
    const saleResult = JSON.parse(saleResponse);
    const saleId = saleResult.id;
    console.log("✅ Vente créée avec l'ID:", saleId);

    // Créer un reçu
    const receiptResponse = await makeRequest(
      `/api/receipts/create/${saleId}`,
      "POST",
      "",
      authResult.accessToken
    );
    const receiptResult = JSON.parse(receiptResponse);
    const receipt = receiptResult.receipt;

    console.log("✅ Reçu créé avec succès!");
    console.log("   - ID:", receipt.id);
    console.log("   - Numéro:", receipt.receiptNumber);
    console.log("   - Montant final:", receipt.finalAmount + "EUR");

    console.log("\n=== SUCCÈS ===");
    console.log("✅ La génération de reçu fonctionne correctement!");
    console.log(
      '✅ Le bouton "Générer Reçu v2.0" devrait fonctionner dans l\'app mobile'
    );
  } catch (error) {
    console.error("\n❌ ERREUR:", error.message);
  }
}

function makeRequest(path, method, data, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    if (data) {
      options.headers["Content-Length"] = Buffer.byteLength(data);
    }

    const req = http.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseData);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

testAuth();
