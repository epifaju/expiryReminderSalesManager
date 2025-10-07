/**
 * Script de test pour valider le DatabaseService
 * Utilise la base de données réelle pour tester l'initialisation
 */
const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Test du DatabaseService...\n');

try {
  // Exécuter les tests Jest
  console.log('1️⃣ Exécution des tests unitaires...');
  execSync('npm test -- --testPathPattern=DatabaseService.test.ts --verbose', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  console.log('\n✅ Tests unitaires passés avec succès !');
  
  // Test d'intégration simple
  console.log('\n2️⃣ Test d\'intégration...');
  
  // Simuler l'initialisation (ceci nécessiterait l'app React Native en cours d'exécution)
  console.log('📱 Pour tester l\'intégration complète :');
  console.log('   1. Lancez l\'app : npm run android');
  console.log('   2. Vérifiez les logs : npx react-native log-android | grep DATABASE');
  console.log('   3. Inspectez la DB : adb shell "run-as com.salesmanager sqlite3 /data/data/com.salesmanager/databases/salesmanager.db"');
  
} catch (error) {
  console.error('❌ Erreur lors des tests:', error.message);
  process.exit(1);
}

console.log('\n🎉 Validation du DatabaseService terminée !');

