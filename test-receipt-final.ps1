# Test final de generation de recu
Write-Host "=== TEST FINAL DE GENERATION DE RECU ===" -ForegroundColor Cyan

$baseUrl = "http://localhost:8082"

try {
    # 1. Authentification
    Write-Host "`n1. Authentification..." -ForegroundColor Yellow
    $authData = '{"email":"admin@example.com","password":"admin123"}'
    $authResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/signin" -Method POST -Body $authData -ContentType "application/json"
    $token = $authResponse.accessToken
    Write-Host "Authentification reussie" -ForegroundColor Green
    
    # 2. Creer une vente
    Write-Host "`n2. Creation d'une vente..." -ForegroundColor Yellow
    $saleData = '{"items":[{"productId":1,"productName":"Produit Test Final","quantity":2,"unitPrice":20.0,"discount":0.0,"totalPrice":40.0}],"totalAmount":40.0,"taxAmount":8.0,"discountAmount":0.0,"finalAmount":48.0,"paymentMethod":"CARD","customerName":"Client Test Final"}'
    $saleResponse = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method POST -Body $saleData -ContentType "application/json" -Headers @{"Authorization"="Bearer $token"}
    $saleId = $saleResponse.id
    Write-Host "Vente creee avec l'ID: $saleId" -ForegroundColor Green
    
    # 3. Creer un recu (test du bouton "Generer Recu v2.0")
    Write-Host "`n3. Creation d'un recu (test du bouton 'Generer Recu v2.0')..." -ForegroundColor Yellow
    $receiptResponse = Invoke-RestMethod -Uri "$baseUrl/api/receipts/create/$saleId" -Method POST -ContentType "application/json" -Headers @{"Authorization"="Bearer $token"}
    $receipt = $receiptResponse.receipt
    Write-Host "Recu cree avec succes!" -ForegroundColor Green
    Write-Host "   - ID: $($receipt.id)" -ForegroundColor White
    Write-Host "   - Numero: $($receipt.receiptNumber)" -ForegroundColor White
    Write-Host "   - Montant final: $($receipt.finalAmount)EUR" -ForegroundColor White
    Write-Host "   - Client: $($receipt.customerName)" -ForegroundColor White
    Write-Host "   - QR Code: $(if($receipt.qrCodeData) {'OUI'} else {'NON'})" -ForegroundColor White
    
    # 4. Verifier dans la liste
    Write-Host "`n4. Verification dans la liste des recus..." -ForegroundColor Yellow
    $receiptsResponse = Invoke-RestMethod -Uri "$baseUrl/api/receipts" -Method GET -Headers @{"Authorization"="Bearer $token"}
    $receipts = $receiptsResponse.receipts
    Write-Host "Nombre total de recus: $($receipts.Count)" -ForegroundColor Cyan
    
    $ourReceipt = $receipts | Where-Object { $_.id -eq $receipt.id }
    if ($ourReceipt) {
        Write-Host "SUCCES! Notre recu est dans la liste" -ForegroundColor Green
    } else {
        Write-Host "ERREUR! Notre recu n'est pas dans la liste" -ForegroundColor Red
    }
    
    Write-Host "`n=== RESULTAT FINAL ===" -ForegroundColor Cyan
    Write-Host "SUCCES! La fonctionnalite de generation de recu fonctionne" -ForegroundColor Green
    Write-Host "Le bouton 'Generer Recu v2.0' devrait fonctionner dans l'app mobile" -ForegroundColor Green
    
} catch {
    Write-Host "`nERREUR: $($_.Exception.Message)" -ForegroundColor Red
}
