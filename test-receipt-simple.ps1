# Test simple de generation de recu
Write-Host "Test de generation de recu" -ForegroundColor Cyan

$baseUrl = "http://localhost:8083"

try {
    # 1. Authentification
    Write-Host "1. Authentification..." -ForegroundColor Yellow
    $authData = '{"email":"admin@example.com","password":"admin123"}'
    $authResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/signin" -Method POST -Body $authData -ContentType "application/json"
    $token = $authResponse.accessToken
    Write-Host "Authentification reussie" -ForegroundColor Green
    
    # 2. Creer une vente
    Write-Host "2. Creation d'une vente..." -ForegroundColor Yellow
    $saleData = '{"items":[{"productId":1,"productName":"Produit Test","quantity":1,"unitPrice":10.0,"discount":0.0,"totalPrice":10.0}],"totalAmount":10.0,"taxAmount":2.0,"discountAmount":0.0,"finalAmount":12.0,"paymentMethod":"CARD","customerName":"Client Test"}'
    $saleResponse = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method POST -Body $saleData -ContentType "application/json" -Headers @{"Authorization"="Bearer $token"}
    $saleId = $saleResponse.id
    Write-Host "Vente creee avec l'ID: $saleId" -ForegroundColor Green
    
    # 3. Creer un recu
    Write-Host "3. Creation d'un recu..." -ForegroundColor Yellow
    $receiptResponse = Invoke-RestMethod -Uri "$baseUrl/api/receipts/create/$saleId" -Method POST -ContentType "application/json" -Headers @{"Authorization"="Bearer $token"}
    $receipt = $receiptResponse.receipt
    Write-Host "Recu cree avec succes:" -ForegroundColor Green
    Write-Host "   - ID: $($receipt.id)" -ForegroundColor White
    Write-Host "   - Numero: $($receipt.receiptNumber)" -ForegroundColor White
    Write-Host "   - Montant final: $($receipt.finalAmount)EUR" -ForegroundColor White
    
    Write-Host "Test termine avec succes!" -ForegroundColor Green
    
} catch {
    Write-Host "Erreur lors du test: $($_.Exception.Message)" -ForegroundColor Red
}
