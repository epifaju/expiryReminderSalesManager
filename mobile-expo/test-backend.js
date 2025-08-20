// Script de test pour vérifier la connectivité au backend
const axios = require("axios");

const API_URLS = [
  "http://192.168.1.27:8081",
  "http://10.0.2.2:8081",
  "http://localhost:8081",
];

async function testBackendConnectivity() {
  console.log("🔍 Test de connectivité au backend...\n");

  for (let i = 0; i < API_URLS.length; i++) {
    const url = API_URLS[i];
    console.log(`📡 Test ${i + 1}/${API_URLS.length}: ${url}`);

    try {
      // Test de base - endpoint de santé ou auth
      const response = await axios.get(`${url}/auth/test`, {
        timeout: 5000,
        validateStatus: () => true, // Accept any status code
      });

      console.log(`✅ Connexion réussie! Status: ${response.status}`);
      console.log(`📄 Réponse: ${JSON.stringify(response.data, null, 2)}\n`);

      // Test de login avec des identifiants par défaut
      try {
        const loginResponse = await axios.post(
          `${url}/auth/signin`,
          {
            username: "admin",
            password: "admin123",
          },
          {
            timeout: 5000,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log(`🔐 Login test réussi! Status: ${loginResponse.status}`);
        console.log(
          `🎫 Token reçu: ${loginResponse.data.token ? "Oui" : "Non"}\n`
        );
      } catch (loginError) {
        console.log(`❌ Login test échoué: ${loginError.message}`);
        if (loginError.response) {
          console.log(
            `📄 Réponse d'erreur: ${JSON.stringify(
              loginError.response.data,
              null,
              2
            )}\n`
          );
        }
      }
    } catch (error) {
      console.log(`❌ Connexion échouée: ${error.message}`);
      if (error.code === "ECONNREFUSED") {
        console.log(`🚫 Le serveur n'est pas accessible sur ${url}`);
      } else if (error.code === "ETIMEDOUT") {
        console.log(`⏰ Timeout - le serveur met trop de temps à répondre`);
      }
      console.log("");
    }
  }

  console.log("🏁 Test terminé!");
}

// Exécuter le test
testBackendConnectivity().catch(console.error);
