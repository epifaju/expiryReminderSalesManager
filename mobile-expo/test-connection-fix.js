const axios = require("axios");

// Configuration des URLs à tester
const API_URLS = [
  "http://192.168.1.27:8080", // IP locale
  "http://10.0.2.2:8080", // Android emulator
  "http://localhost:8080", // Localhost
  "http://127.0.0.1:8080", // Loopback
];

// Test de connexion pour une URL
const testConnection = async (url) => {
  try {
    console.log(`🔍 Test de connexion à: ${url}`);
    const response = await axios.get(`${url}/auth/test`, {
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log(`✅ Connexion réussie à: ${url}`);
    console.log(`📊 Réponse:`, response.data);
    return { url, success: true, data: response.data };
  } catch (error) {
    console.log(`❌ Connexion échouée à: ${url}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data:`, error.response.data);
    } else if (error.request) {
      console.log(`   Pas de réponse du serveur`);
    } else {
      console.log(`   Erreur: ${error.message}`);
    }
    return { url, success: false, error: error.message };
  }
};

// Test de toutes les URLs
const testAllConnections = async () => {
  console.log("🚀 Test de connexion au backend Spring Boot...\n");

  const results = [];
  for (const url of API_URLS) {
    const result = await testConnection(url);
    results.push(result);
    console.log(""); // Ligne vide pour la lisibilité
  }

  // Résumé
  console.log("📋 RÉSUMÉ DES TESTS:");
  console.log("=".repeat(50));

  const workingUrls = results.filter((r) => r.success);
  const failedUrls = results.filter((r) => !r.success);

  if (workingUrls.length > 0) {
    console.log("✅ URLs fonctionnelles:");
    workingUrls.forEach((r) => {
      console.log(`   - ${r.url}`);
    });
  }

  if (failedUrls.length > 0) {
    console.log("❌ URLs non fonctionnelles:");
    failedUrls.forEach((r) => {
      console.log(`   - ${r.url} (${r.error})`);
    });
  }

  if (workingUrls.length === 0) {
    console.log("\n🚨 AUCUNE CONNEXION RÉUSSIE!");
    console.log("Vérifiez que:");
    console.log("1. Le backend Spring Boot est démarré");
    console.log("2. Il fonctionne sur le port 8080");
    console.log("3. Votre firewall n'bloque pas les connexions");
    console.log("4. L'adresse IP 192.168.1.27 est correcte pour votre réseau");
  } else {
    console.log(`\n🎉 ${workingUrls.length} connexion(s) réussie(s)!`);
    console.log("L'application mobile devrait pouvoir se connecter.");
  }

  return results;
};

// Test de connexion avec authentification
const testAuthConnection = async (workingUrl) => {
  if (!workingUrl) return;

  console.log(
    `\n🔐 Test de connexion avec authentification sur: ${workingUrl}`
  );

  try {
    const loginData = {
      username: "admin",
      password: "admin123",
    };

    const response = await axios.post(`${workingUrl}/auth/signin`, loginData, {
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    console.log("✅ Authentification réussie!");
    console.log("🎫 Token reçu:", response.data.accessToken ? "Oui" : "Non");
    return true;
  } catch (error) {
    console.log("❌ Erreur d'authentification:");
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message:`, error.response.data);
    } else {
      console.log(`   Erreur: ${error.message}`);
    }
    return false;
  }
};

// Exécution des tests
const runTests = async () => {
  const results = await testAllConnections();
  const workingUrl = results.find((r) => r.success)?.url;

  if (workingUrl) {
    await testAuthConnection(workingUrl);
  }

  console.log("\n" + "=".repeat(50));
  console.log("🏁 Tests terminés!");
};

runTests().catch((error) => {
  console.error("💥 Erreur lors des tests:", error);
  process.exit(1);
});
