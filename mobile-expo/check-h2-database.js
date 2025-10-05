/**
 * Script pour vérifier la base de données H2 directement
 *
 * Ce script se connecte à la console H2 pour vérifier :
 * 1. L'existence de la table receipts
 * 2. Les données dans la table
 * 3. La structure de la table
 */

const H2_CONSOLE_URL = "http://192.168.1.16:8082/h2-console";

async function checkH2Database() {
  console.log("🔍 Vérification de la base de données H2");
  console.log(`📍 URL de la console H2: ${H2_CONSOLE_URL}`);

  try {
    // Essayer d'accéder à la console H2
    const response = await fetch(H2_CONSOLE_URL);

    if (response.ok) {
      console.log("✅ Console H2 accessible");
      console.log(
        "💡 Ouvrez cette URL dans votre navigateur pour vérifier la base de données:"
      );
      console.log(`   ${H2_CONSOLE_URL}`);
      console.log("\n📋 Paramètres de connexion H2:");
      console.log("   - JDBC URL: jdbc:h2:mem:testdb");
      console.log("   - User Name: sa");
      console.log("   - Password: (laisser vide)");
      console.log("\n🔍 Requêtes SQL à exécuter dans la console H2:");
      console.log("   1. SHOW TABLES;");
      console.log("   2. SELECT * FROM RECEIPTS;");
      console.log("   3. DESCRIBE RECEIPTS;");
    } else {
      console.log("❌ Console H2 non accessible:", response.status);
    }
  } catch (error) {
    console.log("❌ Erreur lors de l'accès à la console H2:", error.message);
  }
}

// Instructions pour vérifier manuellement
function printManualCheckInstructions() {
  console.log("\n📖 Instructions pour vérification manuelle:");
  console.log("1. Assurez-vous que le backend est démarré");
  console.log(
    "2. Ouvrez votre navigateur et allez à: http://192.168.1.16:8082/h2-console"
  );
  console.log("3. Connectez-vous avec:");
  console.log("   - JDBC URL: jdbc:h2:mem:testdb");
  console.log("   - User Name: sa");
  console.log("   - Password: (laisser vide)");
  console.log("4. Exécutez ces requêtes:");
  console.log("   SHOW TABLES;");
  console.log("   SELECT * FROM RECEIPTS;");
  console.log("   SELECT COUNT(*) FROM RECEIPTS;");
  console.log("\n5. Si la table RECEIPTS n'existe pas, c'est le problème !");
  console.log(
    "   Dans ce cas, le backend n'a pas créé la table automatiquement."
  );
}

// Exécuter les vérifications
if (typeof window !== "undefined") {
  window.checkH2Database = checkH2Database;
  window.printManualCheckInstructions = printManualCheckInstructions;
  console.log("🚀 Script de vérification H2 chargé.");
  console.log(
    "Exécutez checkH2Database() pour vérifier l'accès à la console H2"
  );
  console.log(
    "Exécutez printManualCheckInstructions() pour les instructions manuelles"
  );
} else {
  checkH2Database();
  printManualCheckInstructions();
}

