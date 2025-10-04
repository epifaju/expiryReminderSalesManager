# Script de test pour vérifier la connexion au backend
Write-Host "🧪 Test de connexion au backend Spring Boot" -ForegroundColor Cyan

# Test 1: Vérifier que le backend répond
Write-Host "`n1️⃣ Test de connectivité..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8082/api/auth/signin" -Method POST -ContentType "application/json" -Body '{"email":"admin@example.com","password":"admin123"}' -ErrorAction Stop
    Write-Host "✅ Backend accessible sur le port 8082" -ForegroundColor Green
    
    if ($response.StatusCode -eq 200) {
        $authData = $response.Content | ConvertFrom-Json
        Write-Host "✅ Authentification réussie - Token: $($authData.accessToken.Substring(0,20))..." -ForegroundColor Green
        
        # Test 2: Créer une vente
        Write-Host "`n2️⃣ Test de création de vente..." -ForegroundColor Yellow
        $saleData = @{
            items = @(
                @{
                    productId = 1
                    productName = "Produit Test"
                    quantity = 1
                    unitPrice = 10.0
                    discount = 0.0
                    totalPrice = 10.0
                }
            )
            totalAmount = 10.0
            taxAmount = 2.0
            discountAmount = 0.0
            finalAmount = 12.0
            paymentMethod = "CARD"
            customerName = "Client Test"
        } | ConvertTo-Json
        
        $saleResponse = Invoke-WebRequest -Uri "http://localhost:8082/api/sales" -Method POST -ContentType "application/json" -Body $saleData -Headers @{Authorization="Bearer $($authData.accessToken)"} -ErrorAction Stop
        $saleResult = $saleResponse.Content | ConvertFrom-Json
        Write-Host "✅ Vente créée avec l'ID: $($saleResult.id)" -ForegroundColor Green
        
        # Test 3: Créer un reçu
        Write-Host "`n3️⃣ Test de création de reçu..." -ForegroundColor Yellow
        $receiptResponse = Invoke-WebRequest -Uri "http://localhost:8082/api/receipts/create/$($saleResult.id)" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $($authData.accessToken)"} -ErrorAction Stop
        $receiptResult = $receiptResponse.Content | ConvertFrom-Json
        Write-Host "✅ Reçu créé avec succès:" -ForegroundColor Green
        Write-Host "   - ID: $($receiptResult.receipt.id)" -ForegroundColor White
        Write-Host "   - Numéro: $($receiptResult.receipt.receiptNumber)" -ForegroundColor White
        Write-Host "   - Montant: $($receiptResult.receipt.finalAmount)€" -ForegroundColor White
        
        Write-Host "`n🎉 Tous les tests sont passés avec succès !" -ForegroundColor Green
        Write-Host "✅ La fonctionnalité de génération de reçu fonctionne correctement" -ForegroundColor Green
        
    } else {
        Write-Host "❌ Erreur d'authentification - Code: $($response.StatusCode)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Erreur de connexion au backend: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Vérifiez que le backend Spring Boot est démarré sur le port 8082" -ForegroundColor Yellow
}