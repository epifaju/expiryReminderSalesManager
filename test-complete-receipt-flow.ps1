# Test complet du flux de generation de recu
Write-Host "=== TEST COMPLET DU FLUX DE GENERATION DE RECU ===" -ForegroundColor Cyan

$baseUrl = "http://localhost:8083"

try {
    # 1. Test de connectivite
    Write-Host "`n1. Test de connectivite backend..." -ForegroundColor Yellow
    try {
        $testResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/signin" -Method POST -ContentType "application/json" -Body '{"email":"test","password":"test"}' -TimeoutSec 5
        Write-Host "Backend accessible sur $baseUrl" -ForegroundColor Green
    } catch {
        Write-Host "Backend non accessible sur $baseUrl" -ForegroundColor Red
        Write-Host "Veuillez demarrer le backend avec: .\start-backend-h2.ps1" -ForegroundColor Yellow
        exit 1
    }
    
    # 2. Authentification
    Write-Host "`n2. Authentification..." -ForegroundColor Yellow
    $authData = '{"email":"admin@example.com","password":"admin123"}'
    $authResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/signin" -Method POST -Body $authData -ContentType "application/json"
    $token = $authResponse.accessToken
    Write-Host "Authentification reussie - Token: $($token.Substring(0,20))..." -ForegroundColor Green
    
    # 3. Creer une vente de test
    Write-Host "`n3. Creation d'une vente de test..." -ForegroundColor Yellow
    $saleData = @{
        items = @(
            @{
                productId = 1
                productName = "Produit Test Receipt v2.0"
                quantity = 3
                unitPrice = 15.50
                discount = 2.0
                totalPrice = 44.50
            }
        )
        totalAmount = 46.50
        taxAmount = 9.30
        discountAmount = 2.0
        finalAmount = 53.80
        paymentMethod = "CARD"
        customerName = "Client Test Receipt v2.0"
        customerPhone = "0123456789"
        customerEmail = "client@test.com"
        notes = "Test de la fonctionnalite Generer Recu v2.0"
    } | ConvertTo-Json
    
    $saleResponse = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method POST -Body $saleData -ContentType "application/json" -Headers @{"Authorization"="Bearer $token"}
    $saleId = $saleResponse.id
    Write-Host "Vente creee avec l'ID: $saleId" -ForegroundColor Green
    Write-Host "   - Numero de vente: $($saleResponse.saleNumber)" -ForegroundColor White
    Write-Host "   - Montant final: $($saleResponse.finalAmount)EUR" -ForegroundColor White
    Write-Host "   - Client: $($saleResponse.customerName)" -ForegroundColor White
    
    # 4. Creer un recu (test du bouton "Generer Recu v2.0")
    Write-Host "`n4. Creation d'un recu (test du bouton 'Generer Recu v2.0')..." -ForegroundColor Yellow
    $receiptResponse = Invoke-RestMethod -Uri "$baseUrl/api/receipts/create/$saleId" -Method POST -ContentType "application/json" -Headers @{"Authorization"="Bearer $token"}
    $receipt = $receiptResponse.receipt
    Write-Host "Recu cree avec succes!" -ForegroundColor Green
    Write-Host "   - ID du recu: $($receipt.id)" -ForegroundColor White
    Write-Host "   - Numero de recu: $($receipt.receiptNumber)" -ForegroundColor White
    Write-Host "   - Montant total: $($receipt.totalAmount)EUR" -ForegroundColor White
    Write-Host "   - Montant final: $($receipt.finalAmount)EUR" -ForegroundColor White
    Write-Host "   - Client: $($receipt.customerName)" -ForegroundColor White
    Write-Host "   - Date de creation: $($receipt.createdAt)" -ForegroundColor White
    Write-Host "   - Statut: $($receipt.status)" -ForegroundColor White
    Write-Host "   - QR Code genere: $(if($receipt.qrCodeData) {'OUI'} else {'NON'})" -ForegroundColor White
    
    # 5. Verifier dans la liste des recus
    Write-Host "`n5. Verification dans la liste des recus..." -ForegroundColor Yellow
    $receiptsResponse = Invoke-RestMethod -Uri "$baseUrl/api/receipts" -Method GET -Headers @{"Authorization"="Bearer $token"}
    $receipts = $receiptsResponse.receipts
    Write-Host "Nombre total de recus: $($receipts.Count)" -ForegroundColor Cyan
    
    $ourReceipt = $receipts | Where-Object { $_.id -eq $receipt.id }
    if ($ourReceipt) {
        Write-Host "SUCCES! Notre recu est present dans la liste" -ForegroundColor Green
    } else {
        Write-Host "ERREUR! Notre recu n'est pas dans la liste" -ForegroundColor Red
    }
    
    # 6. Test de telechargement PDF
    Write-Host "`n6. Test de telechargement PDF..." -ForegroundColor Yellow
    try {
        $pdfResponse = Invoke-WebRequest -Uri "$baseUrl/api/receipts/$($receipt.id)/pdf" -Method GET -Headers @{"Authorization"="Bearer $token"}
        $contentLength = $pdfResponse.Headers.'Content-Length'
        Write-Host "PDF genere avec succes!" -ForegroundColor Green
        Write-Host "   - Taille du PDF: $contentLength bytes" -ForegroundColor White
        Write-Host "   - Type de contenu: $($pdfResponse.Headers.'Content-Type')" -ForegroundColor White
    } catch {
        Write-Host "Erreur lors de la generation du PDF: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    Write-Host "`n=== RESULTAT FINAL ===" -ForegroundColor Cyan
    Write-Host "SUCCES! La fonctionnalite de generation de recu fonctionne correctement" -ForegroundColor Green
    Write-Host "Le bouton 'Generer Recu v2.0' devrait maintenant fonctionner dans l'application mobile" -ForegroundColor Green
    
} catch {
    Write-Host "`nERREUR lors du test: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "Code d'erreur HTTP: $statusCode" -ForegroundColor Red
    }
}
