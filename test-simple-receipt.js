// Test simple pour identifier le problème de création de reçus
const axios = require('axios');

async function testSimpleReceipt() {
    try {
        console.log('🔍 Test simple de création de reçu');
        console.log('=====================================');
        
        // 1. Connexion
        const loginResponse = await axios.post('http://localhost:8082/auth/signin', {
            username: 'admin',
            password: 'admin123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Connexion réussie');
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        // 2. Récupérer les ventes
        const salesResponse = await axios.get('http://localhost:8082/sales', { headers });
        const sales = salesResponse.data.content;
        console.log(`✅ ${sales.length} ventes trouvées`);
        
        if (sales.length === 0) {
            console.log('❌ Aucune vente disponible');
            return;
        }
        
        // 3. Afficher les détails de la première vente
        const firstSale = sales[0];
        console.log(`\n📋 Détails de la vente:`);
        console.log(`   ID: ${firstSale.id}`);
        console.log(`   Numéro: ${firstSale.saleNumber}`);
        console.log(`   Client: ${firstSale.customerName}`);
        console.log(`   Montant: ${firstSale.totalAmount}`);
        console.log(`   Créateur ID: ${firstSale.createdBy}`);
        
        // 4. Tester la création d'un reçu
        console.log(`\n🧾 Test de création d'un reçu pour la vente ${firstSale.id}...`);
        
        try {
            const createResponse = await axios.post(`http://localhost:8082/api/receipts/create/${firstSale.id}`, {}, { headers });
            console.log('✅ Reçu créé avec succès !');
            console.log(`   Reçu ID: ${createResponse.data.receipt.id}`);
            console.log(`   Numéro: ${createResponse.data.receipt.receiptNumber}`);
            console.log(`   Message: ${createResponse.data.message}`);
        } catch (createError) {
            console.log('❌ Erreur lors de la création:');
            console.log(`   Status: ${createError.response?.status}`);
            console.log(`   Message: ${createError.response?.data?.error || createError.message}`);
            
            if (createError.response?.data?.details) {
                console.log(`   Détails: ${createError.response.data.details}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

testSimpleReceipt();
