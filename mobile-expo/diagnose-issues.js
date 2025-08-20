// Script de diagnostic complet pour identifier les problèmes
const axios = require("axios");
const { exec } = require("child_process");
const os = require("os");

// Configuration
const API_URLS = [
  "http://192.168.1.27:8081",
  "http://10.0.2.2:8081",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
];

const METRO_PORTS = [8081, 19000, 19001, 19002];

console.log("🔍 DIAGNOSTIC COMPLET DES PROBLÈMES");
console.log("=".repeat(50));

// 1. Vérifier les adresses IP locales
function getLocalIPs() {
  console.log("\n1. 🌐 Adresses IP locales:");
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === "IPv4" && !interface.internal) {
        console.log(`   ${name}: ${interface.address}`);
      }
    }
  }
}

// 2. Vérifier les ports Metro
async function checkMetroPorts() {
  console.log("\n2. 📱 Vérification des ports Metro:");

  for (const port of METRO_PORTS) {
    try {
      const response = await axios.get(`http://localhost:${port}/status`, {
        timeout: 3000,
        validateStatus: () => true,
      });
      console.log(`   ✅ Port ${port}: Metro actif (${response.status})`);
    } catch (error) {
      if (error.code === "ECONNREFUSED") {
        console.log(`   ❌ Port ${port}: Metro non accessible`);
      } else {
        console.log(`   ⚠️  Port ${port}: ${error.message}`);
      }
    }
  }
}

// 3. Vérifier la connectivité backend
async function checkBackendConnectivity() {
  console.log("\n3. 🔧 Test de connectivité backend:");

  for (let i = 0; i < API_URLS.length; i++) {
    const url = API_URLS[i];
    console.log(`\n   Test ${i + 1}/${API_URLS.length}: ${url}`);

    try {
      // Test de base
      const healthResponse = await axios.get(`${url}/health`, {
        timeout: 5000,
        validateStatus: () => true,
      });

      if (healthResponse.status < 500) {
        console.log(`   ✅ Serveur accessible (${healthResponse.status})`);

        // Test de login
        try {
          const loginResponse = await axios.post(
            `${url}/auth/signin`,
            { username: "admin", password: "admin123" },
            {
              timeout: 8000,
              headers: { "Content-Type": "application/json" },
            }
          );

          if (loginResponse.status === 200 && loginResponse.data.token) {
            console.log(
              `   🎉 Login réussi! Token: ${loginResponse.data.token.substring(
                0,
                20
              )}...`
            );

            // Test des endpoints API
            await testApiEndpoints(url, loginResponse.data.token);
          }
        } catch (loginError) {
          console.log(`   ❌ Login échoué: ${loginError.message}`);
        }
      } else {
        console.log(`   ❌ Serveur non accessible (${healthResponse.status})`);
      }
    } catch (error) {
      console.log(`   ❌ Connexion échouée: ${error.message}`);
    }
  }
}

// 4. Tester les endpoints API
async function testApiEndpoints(baseUrl, token) {
  const endpoints = [
    { path: "/products", name: "Produits" },
    { path: "/sales", name: "Ventes" },
  ];

  console.log(`   🧪 Test des endpoints API:`);

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${baseUrl}${endpoint.path}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
        validateStatus: () => true,
      });

      if (response.status === 200) {
        const dataLength = Array.isArray(response.data)
          ? response.data.length
          : response.data.content
          ? response.data.content.length
          : "N/A";
        console.log(`      ✅ ${endpoint.name}: ${dataLength} éléments`);
      } else {
        console.log(`      ❌ ${endpoint.name}: Status ${response.status}`);
      }
    } catch (error) {
      console.log(`      ❌ ${endpoint.name}: ${error.message}`);
    }
  }
}

// 5. Vérifier les processus en cours
function checkRunningProcesses() {
  console.log("\n4. 🔄 Processus en cours:");

  return new Promise((resolve) => {
    exec("netstat -ano | findstr :8081", (error, stdout) => {
      if (stdout) {
        console.log("   ✅ Processus sur port 8081:");
        console.log(
          stdout
            .split("\n")
            .filter((line) => line.trim())
            .map((line) => `      ${line}`)
            .join("\n")
        );
      } else {
        console.log("   ❌ Aucun processus sur port 8081");
      }
      resolve();
    });
  });
}

// 6. Recommandations
function showRecommendations() {
  console.log("\n5. 💡 RECOMMANDATIONS:");
  console.log("\n   Pour résoudre 'Cannot connect to Metro':");
  console.log("   1. Redémarrer Metro: npx expo start --clear");
  console.log("   2. Vérifier le firewall Windows");
  console.log("   3. Redémarrer l'émulateur Android");
  console.log("   4. Utiliser l'URL tunnel dans Expo Go");

  console.log("\n   Pour résoudre 'Erreur lors du chargement des données':");
  console.log("   1. Vérifier que le backend est démarré");
  console.log("   2. Vérifier la connectivité réseau");
  console.log("   3. Vérifier les logs de l'application");
  console.log("   4. Tester avec les données simulées");

  console.log("\n   Commandes utiles:");
  console.log("   - Démarrer backend: cd backend && mvn spring-boot:run");
  console.log("   - Démarrer Expo: cd mobile-expo && npx expo start --clear");
  console.log("   - Mode tunnel: npx expo start --tunnel");
  console.log("   - Mode web: npx expo start --web");
}

// Exécuter tous les diagnostics
async function runDiagnostics() {
  try {
    getLocalIPs();
    await checkMetroPorts();
    await checkBackendConnectivity();
    await checkRunningProcesses();
    showRecommendations();

    console.log("\n" + "=".repeat(50));
    console.log("🏁 Diagnostic terminé!");
  } catch (error) {
    console.error("Erreur lors du diagnostic:", error);
  }
}

runDiagnostics();
