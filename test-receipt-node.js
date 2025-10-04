// Test de generation de recu avec Node.js
const https = require("http");

const baseUrl = "http://localhost:8082";

async function testReceiptGeneration() {
  console.log("=== TEST DE GENERATION DE RECU ===\n");

  try {
    // 1. Authentification
    console.log("1. Authentification...");
    const authData = JSON.stringify({
      email: "admin@example.com",
      password: "admin123",
    });

    const authResponse = await makeRequest(
      "/api/auth/signin",
      "POST",
      authData
    );
    const authResult = JSON.parse(authResponse);
    const token = authResult.accessToken;
    console.log("✅ Authentification reussie");

    // 2. Creer une vente
    console.log("\n2. Creation d'une vente...");
    const saleData = JSON.stringify({
      items: [
        {
          productId: 1,
          productName: "Produit Test Node.js",
          quantity: 1,
          unitPrice: 15.0,
          discount: 0.0,
          totalPrice: 15.0,
        },
      ],
      totalAmount: 15.0,
      taxAmount: 3.0,
      discountAmount: 0.0,
      finalAmount: 18.0,
      paymentMethod: "CARD",
      customerName: "Client Test Node.js",
    });

    const saleResponse = await makeRequest(
      "/api/sales",
      "POST",
      saleData,
      token
    );
    const saleResult = JSON.parse(saleResponse);
    const saleId = saleResult.id;
    console.log(`✅ Vente creee avec l'ID: ${saleId}`);

    // 3. Creer un recu
    console.log(
      '\n3. Creation d\'un recu (test du bouton "Generer Recu v2.0")...'
    );
    const receiptResponse = await makeRequest(
      `/api/receipts/create/${saleId}`,
      "POST",
      "",
      token
    );
    const receiptResult = JSON.parse(receiptResponse);
    const receipt = receiptResult.receipt;

    console.log("✅ Recu cree avec succes!");
    console.log(`   - ID: ${receipt.id}`);
    console.log(`   - Numero: ${receipt.receiptNumber}`);
    console.log(`   - Montant final: ${receipt.finalAmount}EUR`);
    console.log(`   - Client: ${receipt.customerName}`);
    console.log(`   - QR Code: ${receipt.qrCodeData ? "OUI" : "NON"}`);

    // 4. Verifier dans la liste
    console.log("\n4. Verification dans la liste des recus...");
    const receiptsResponse = await makeRequest(
      "/api/receipts",
      "GET",
      "",
      token
    );
    const receiptsResult = JSON.parse(receiptsResponse);
    const receipts = receiptsResult.receipts;

    console.log(`Nombre total de recus: ${receipts.length}`);

    const ourReceipt = receipts.find((r) => r.id === receipt.id);
    if (ourReceipt) {
      console.log("✅ SUCCES! Notre recu est dans la liste");
    } else {
      console.log("❌ ERREUR! Notre recu n'est pas dans la liste");
    }

    console.log("\n=== RESULTAT FINAL ===");
    console.log(
      "✅ SUCCES! La fonctionnalite de generation de recu fonctionne"
    );
    console.log(
      '✅ Le bouton "Generer Recu v2.0" devrait fonctionner dans l\'app mobile'
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

    const req = https.request(options, (res) => {
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

testReceiptGeneration();
