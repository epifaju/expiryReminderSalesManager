// Script de test pour l'API de reçus PDF
const axios = require('axios');

const BASE_URL = 'http://localhost:8082';

async function testReceiptAPI() {
    try {
        console.log('🧪 Test de l\'API de reçus PDF');
        console.log('================================');
        
        // 1. Connexion
        console.log('1. Connexion...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/signin`, {
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
        console.log('\n2. Récupération des ventes...');
        const salesResponse = await axios.get(`${BASE_URL}/sales`, { headers });
        const sales = salesResponse.data.content;
        console.log(`✅ ${sales.length} ventes trouvées`);
        
        if (sales.length === 0) {
            console.log('❌ Aucune vente disponible pour tester');
            return;
        }
        
        // 3. Lister les reçus existants
        console.log('\n3. Liste des reçus existants...');
        const receiptsResponse = await axios.get(`${BASE_URL}/api/receipts`, { headers });
        console.log(`✅ ${receiptsResponse.data.receipts.length} reçus existants`);
        
        // 4. Tester la création d'un reçu
        console.log('\n4. Test de création d\'un reçu...');
        const firstSale = sales[0];
        console.log(`   Vente ID: ${firstSale.id}, Numéro: ${firstSale.saleNumber}`);
        
        try {
            const createResponse = await axios.post(`${BASE_URL}/api/receipts/create/${firstSale.id}`, {}, { headers });
            console.log('✅ Reçu créé avec succès !');
            console.log(`   Numéro de reçu: ${createResponse.data.receipt.receiptNumber}`);
            
            const receiptId = createResponse.data.receipt.id;
            
            // 5. Tester le téléchargement PDF
            console.log('\n5. Test de téléchargement PDF...');
            try {
                const pdfResponse = await axios.get(`${BASE_URL}/api/receipts/${receiptId}/pdf`, {
                    headers,
                    responseType: 'arraybuffer'
                });
                console.log('✅ PDF généré avec succès !');
                console.log(`   Taille du PDF: ${pdfResponse.data.length} bytes`);
            } catch (pdfError) {
                console.log('❌ Erreur lors de la génération PDF:', pdfError.response?.data?.error || pdfError.message);
            }
            
        } catch (createError) {
            console.log('❌ Erreur lors de la création du reçu:', createError.response?.data?.error || createError.message);
            
            if (createError.response?.status === 400) {
                console.log('   💡 Suggestion: L\'utilisateur admin n\'est peut-être pas le créateur de cette vente');
            }
        }
        
        // 6. Liste finale des reçus
        console.log('\n6. Liste finale des reçus...');
        const finalReceiptsResponse = await axios.get(`${BASE_URL}/api/receipts`, { headers });
        console.log(`✅ ${finalReceiptsResponse.data.receipts.length} reçus au total`);
        
        console.log('\n🎉 Test terminé !');
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

// Exécuter le test
testReceiptAPI();
