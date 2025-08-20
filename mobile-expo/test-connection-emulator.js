// Script de test spécialement conçu pour l'émulateur Android
const axios = require("axios");

// URLs spécifiques pour l'émulateur Android
const EMULATOR_API_URLS = [
  "http://10.0.2.2:8081", // Standard Android emulator localhost mapping
  "http://192.168.1.27:8081", // Your actual IP address
  "http://localhost:8081", // Sometimes works
  "http://127.0.0.1:8081", // Local loopback
];

async function testEmulatorConnectivity() {
  console.log("🤖 Test de connectivité spécifique pour émulateur Android...\n");
  console.log("📱 URLs testées pour l'émulateur:");
  EMULATOR_API_URLS.forEach((url, index) => {
    console.log(`   ${index + 1}. ${url}`);
  });
  console.log("");

  let successfulUrl = null;

  for (let i = 0; i < EMULATOR_API_URLS.length; i++) {
    const url = EMULATOR_API_URLS[i];
    console.log(`🔍 Test ${i + 1}/${EMULATOR_API_URLS.length}: ${url}`);

    try {
      // Test de connectivité de base
      console.log("   📡 Test de connectivité...");
      const healthResponse = await axios.get(`${url}/health`, {
        timeout: 8000,
        validateStatus: () => true,
      });

      if (healthResponse.status < 500) {
        console.log(
          `   ✅ Serveur accessible! Status: ${healthResponse.status}`
        );

        // Test de login
        console.log("   🔐 Test de login...");
        try {
          const loginResponse = await axios.post(
            `${url}/auth/signin`,
            {
              username: "admin",
              password: "admin123",
            },
            {
              timeout: 10000,
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            }
          );

          if (loginResponse.status === 200 && loginResponse.data.token) {
            console.log(`   🎉 LOGIN RÉUSSI!`);
            console.log(
              `   🎫 Token reçu: ${loginResponse.data.token.substring(
                0,
                20
              )}...`
            );
            console.log(`   👤 Utilisateur: ${loginResponse.data.username}`);
            successfulUrl = url;
            break;
          } else {
            console.log(`   ❌ Login échoué - Status: ${loginResponse.status}`);
          }
        } catch (loginError) {
          console.log(`   ❌ Erreur de login: ${loginError.message}`);
          if (loginError.response) {
            console.log(
              `   📄 Détails: ${JSON.stringify(
                loginError.response.data,
                null,
                2
              )}`
            );
          }
        }
      } else {
        console.log(
          `   ❌ Serveur non accessible - Status: ${healthResponse.status}`
        );
      }
    } catch (error) {
      console.log(`   ❌ Connexion échouée: ${error.message}`);
      if (error.code === "ECONNREFUSED") {
        console.log(`   🚫 Serveur non accessible sur ${url}`);
      } else if (error.code === "ETIMEDOUT") {
        console.log(`   ⏰ Timeout - serveur trop lent à répondre`);
      } else if (error.code === "ENOTFOUND") {
        console.log(`   🔍 Adresse non trouvée`);
      }
    }
    console.log("");
  }

  console.log("=".repeat(60));
  if (successfulUrl) {
    console.log(`🎉 SUCCÈS! URL fonctionnelle trouvée: ${successfulUrl}`);
    console.log("");
    console.log("📝 Configuration recommandée pour votre app mobile:");
    console.log(
      `   Utilisez cette URL comme première option: ${successfulUrl}`
    );
    console.log("");
    console.log("🔧 Pour corriger dans authService.ts:");
    console.log(
      `   Placez '${successfulUrl}' en premier dans le tableau API_URLS`
    );
  } else {
    console.log("❌ ÉCHEC! Aucune URL ne fonctionne.");
    console.log("");
    console.log("🔧 Solutions à essayer:");
    console.log(
      "   1. Vérifiez que le backend est démarré (mvn spring-boot:run)"
    );
    console.log("   2. Vérifiez le firewall Windows");
    console.log("   3. Essayez de redémarrer l'émulateur");
    console.log("   4. Vérifiez la configuration réseau de l'émulateur");
  }
  console.log("=".repeat(60));
}

// Fonction pour obtenir l'IP locale
async function getLocalIP() {
  const os = require("os");
  const interfaces = os.networkInterfaces();

  console.log("🌐 Adresses IP locales détectées:");
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === "IPv4" && !interface.internal) {
        console.log(`   ${name}: ${interface.address}`);
      }
    }
  }
  console.log("");
}

// Exécuter les tests
async function runAllTests() {
  console.log(
    "🚀 Démarrage des tests de connectivité pour émulateur Android\n"
  );

  await getLocalIP();
  await testEmulatorConnectivity();

  console.log("🏁 Tests terminés!");
}

runAllTests().catch(console.error);
