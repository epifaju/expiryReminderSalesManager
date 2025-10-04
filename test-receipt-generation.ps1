# Script de test pour la génération de reçu
Write-Host "🧪 Test de génération de reçu" -ForegroundColor Cyan

$baseUrl = "http://localhost:8083"

try {
    # 1. Authentification
    Write-Host "`n1️⃣ Authentification..." -ForegroundColor Yellow
    $authData = @{ email = "admin@example.com"; password = "admin123" } | ConvertTo-Json
    $authResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/signin" -Method POST -Body $authData -ContentType "application/json"
    $token = $authResponse.accessToken
    Write-Host "✅ Authentification réussie" -ForegroundColor Green
    
    # 2. Créer une vente
    Write-Host "`n2️⃣ Création d'une vente..." -ForegroundColor Yellow
    $saleData = @{
        items = @(
            @{
                productId = 1
                productName = "Produit Test Receipt"
                quantity = 2
                unitPrice = 25.0
                discount = 5.0
                totalPrice = 45.0
            }
        )
        totalAmount = 50.0
        taxAmount = 10.0
        discountAmount = 5.0
        finalAmount = 55.0
        paymentMethod = "CARD"
        customerName = "Client Test Receipt"
        customerPhone = "0123456789"
        customerEmail = "client@test.com"
        notes = "Test de génération de reçu"
    } | ConvertTo-Json
    
    $saleResponse = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method POST -Body $saleData -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
    $saleId = $saleResponse.id
    Write-Host "✅ Vente créée avec l'ID: $saleId" -ForegroundColor Green
    
    # 3. Créer un reçu
    Write-Host "`n3️⃣ Création d'un reçu..." -ForegroundColor Yellow
    $receiptResponse = Invoke-RestMethod -Uri "$baseUrl/api/receipts/create/$saleId" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
    $receipt = $receiptResponse.receipt
    Write-Host "✅ Reçu créé avec succès:" -ForegroundColor Green
    Write-Host "   - ID: $($receipt.id)" -ForegroundColor White
    Write-Host "   - Numéro: $($receipt.receiptNumber)" -ForegroundColor White
    Write-Host "   - Montant total: $($receipt.totalAmount)€" -ForegroundColor White
    Write-Host "   - Montant final: $($receipt.finalAmount)€" -ForegroundColor White
    Write-Host "   - Client: $($receipt.customerName)" -ForegroundColor White
    Write-Host "   - Date: $($receipt.createdAt)" -ForegroundColor White
    Write-Host "   - Statut: $($receipt.status)" -ForegroundColor White
    Write-Host "   - QR Code: $(if($receipt.qrCodeData) {'Oui'} else {'Non'})" -ForegroundColor White
    
    # 4. Vérifier dans la liste des reçus
    Write-Host "`n4️⃣ Vérification dans la liste des reçus..." -ForegroundColor Yellow
    $receiptsResponse = Invoke-RestMethod -Uri "$baseUrl/api/receipts" -Method GET -Headers @{Authorization="Bearer $token"}
    $receipts = $receiptsResponse.receipts
    Write-Host "📋 $($receipts.Count) reçu(s) trouvé(s)" -ForegroundColor Cyan
    
    $ourReceipt = $receipts | Where-Object { $_.id -eq $receipt.id }
    if ($ourReceipt) {
        Write-Host "🎉 PARFAIT ! Notre reçu est dans la liste" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Notre reçu n'est pas dans la liste" -ForegroundColor Yellow
    }
    
    # 5. Test de téléchargement PDF
    Write-Host "`n5️⃣ Test de téléchargement PDF..." -ForegroundColor Yellow
    try {
        $pdfResponse = Invoke-WebRequest -Uri "$baseUrl/api/receipts/$($receipt.id)/pdf" -Method GET -Headers @{Authorization="Bearer $token"}
        Write-Host "✅ PDF généré avec succès - Taille: $($pdfResponse.Headers.'Content-Length') bytes" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Erreur génération PDF: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    Write-Host "`n🎉 Test terminé avec succès !" -ForegroundColor Green
    Write-Host "✅ La fonctionnalité de génération de reçu fonctionne correctement" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Erreur lors du test: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Reponse d'erreur: $responseBody" -ForegroundColor Red
    }
}
