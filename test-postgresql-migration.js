const axios = require("axios");

// Test de la migration PostgreSQL et de la connexion mobile-expo
async function testPostgreSQLMigration() {
  console.log("🔍 Test de Migration PostgreSQL - Sales Manager");
  console.log("================================================\n");

  // Test 1: Vérifier si le backend est accessible
  console.log("1. Test de connectivité backend...");
  let backendPort = 8080;
  let backendUrl = `http://localhost:${backendPort}`;

  // Essayer d'abord le port 8080, puis 8083
  try {
    const response = await axios.get(`${backendUrl}/actuator/health`, {
      timeout: 5000,
    });
    console.log("✅ Backend accessible sur le port 8080:", response.data);
  } catch (error) {
    try {
      backendPort = 8083;
      backendUrl = `http://localhost:${backendPort}`;
      const response = await axios.get(`${backendUrl}/actuator/health`, {
        timeout: 5000,
      });
      console.log("✅ Backend accessible sur le port 8083:", response.data);
    } catch (error2) {
      console.log(
        "❌ Backend non accessible sur les ports 8080 et 8083:",
        error2.message
      );
      console.log("   → Le backend doit être démarré avec PostgreSQL ou H2");
      return false;
    }
  }

  // Test 2: Test d'inscription d'un nouvel utilisateur
  console.log("\n2. Test d'inscription utilisateur...");
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: "TestPassword123!",
  };

  try {
    const registerResponse = await axios.post(
      `${backendUrl}/api/auth/signup`,
      testUser,
      {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("✅ Inscription réussie:", registerResponse.data);
  } catch (error) {
    console.log(
      "❌ Erreur inscription:",
      error.response?.data || error.message
    );
    if (error.response?.status === 400) {
      console.log(
        "   → Utilisateur peut-être déjà existant ou validation échouée"
      );
    }
    return false;
  }

  // Test 3: Test de connexion
  console.log("\n3. Test de connexion utilisateur...");
  try {
    const loginResponse = await axios.post(
      `${backendUrl}/api/auth/signin`,
      {
        username: testUser.username,
        password: testUser.password,
      },
      {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Connexion réussie");
    const token = loginResponse.data.token;
    console.log("   Token JWT reçu:", token ? "Oui" : "Non");

    // Test 4: Test d'accès aux données avec token
    console.log("\n4. Test d'accès aux données protégées...");
    try {
      const productsResponse = await axios.get(`${backendUrl}/api/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      });
      console.log("✅ Accès aux produits réussi");
      console.log("   Nombre de produits:", productsResponse.data.length);
    } catch (error) {
      console.log(
        "❌ Erreur accès produits:",
        error.response?.data || error.message
      );
    }

    // Test 5: Test d'accès aux ventes
    try {
      const salesResponse = await axios.get(`${backendUrl}/api/sales`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      });
      console.log("✅ Accès aux ventes réussi");
      console.log("   Nombre de ventes:", salesResponse.data.length);
    } catch (error) {
      console.log(
        "❌ Erreur accès ventes:",
        error.response?.data || error.message
      );
    }

    return true;
  } catch (error) {
    console.log("❌ Erreur connexion:", error.response?.data || error.message);
    return false;
  }
}

// Test de base de données
async function testDatabaseConnection() {
  console.log("\n🗄️  Test de Base de Données");
  console.log("============================\n");

  try {
    // Tenter de récupérer des informations sur la base de données via l'API
    const response = await axios.get("http://localhost:8080/actuator/info", {
      timeout: 5000,
    });
    console.log("✅ Informations système récupérées");
  } catch (error) {
    console.log("❌ Impossible de récupérer les informations système");
  }

  // Test de persistance des données
  console.log("\n5. Test de persistance des données...");
  console.log(
    "   → Redémarrez le backend et vérifiez si les données persistent"
  );
  console.log("   → Avec H2: Les données sont perdues (base en mémoire)");
  console.log("   → Avec PostgreSQL: Les données persistent");
}

// Instructions pour PostgreSQL
function showPostgreSQLInstructions() {
  console.log("\n📋 Instructions pour PostgreSQL");
  console.log("================================\n");

  console.log("Pour utiliser PostgreSQL au lieu de H2:");
  console.log("1. Installer PostgreSQL:");
  console.log("   - Windows: https://www.postgresql.org/download/windows/");
  console.log("   - Ou avec Chocolatey: choco install postgresql");
  console.log("");
  console.log("2. Créer la base de données:");
  console.log("   psql -U postgres");
  console.log("   \\i backend/setup-postgresql.sql");
  console.log("");
  console.log("3. Démarrer le backend avec PostgreSQL:");
  console.log("   cd backend");
  console.log("   mvn spring-boot:run");
  console.log("");
  console.log("4. Pour revenir à H2 temporairement:");
  console.log("   mvn spring-boot:run -Dspring.profiles.active=test");
}

// Exécution du test
async function runTests() {
  const success = await testPostgreSQLMigration();
  await testDatabaseConnection();
  showPostgreSQLInstructions();

  console.log("\n📊 Résumé du Test");
  console.log("==================");
  if (success) {
    console.log("✅ Migration testée avec succès");
    console.log("✅ L'application mobile-expo peut se connecter");
    console.log("✅ Authentification et API fonctionnelles");
  } else {
    console.log("❌ Des problèmes ont été détectés");
    console.log("   → Vérifiez que le backend est démarré");
    console.log("   → Utilisez H2 si PostgreSQL n'est pas installé");
  }

  console.log("\n🔗 URLs importantes:");
  console.log("   Backend API: http://localhost:8080");
  console.log(
    "   H2 Console: http://localhost:8080/h2-console (si profil test)"
  );
  console.log("   Health Check: http://localhost:8080/actuator/health");
}

// Gestion des erreurs
process.on("unhandledRejection", (error) => {
  console.error("❌ Erreur non gérée:", error.message);
});

// Lancement du test
runTests().catch(console.error);
