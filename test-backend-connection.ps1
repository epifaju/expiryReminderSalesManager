# Test de connexion au backend Sales Manager
Write-Host "🔍 Test de Connexion Backend - Sales Manager" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Test de l'API d'inscription
Write-Host "`n1. Test d'inscription utilisateur..." -ForegroundColor Yellow

$testUser = @{
    username = "testuser_$(Get-Date -Format 'yyyyMMddHHmmss')"
    email = "test_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8083/api/auth/signup" -Method Post -Body $testUser -ContentType "application/json" -TimeoutSec 10
    Write-Host "✅ Inscription réussie!" -ForegroundColor Green
    Write-Host "   Réponse: $($response | ConvertTo-Json)" -ForegroundColor Gray
    
    # Test de connexion
    Write-Host "`n2. Test de connexion..." -ForegroundColor Yellow
    $loginData = @{
        username = ($testUser | ConvertFrom-Json).username
        password = ($testUser | ConvertFrom-Json).password
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8083/api/auth/signin" -Method Post -Body $loginData -ContentType "application/json" -TimeoutSec 10
    Write-Host "✅ Connexion réussie!" -ForegroundColor Green
    Write-Host "   Token JWT reçu: $($loginResponse.token -ne $null)" -ForegroundColor Gray
    
    # Test d'accès aux données protégées
    Write-Host "`n3. Test d'accès aux produits..." -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "Bearer $($loginResponse.token)"
        "Content-Type" = "application/json"
    }
    
    $productsResponse = Invoke-RestMethod -Uri "http://localhost:8083/api/products" -Method Get -Headers $headers -TimeoutSec 10
    Write-Host "✅ Accès aux produits réussi!" -ForegroundColor Green
    Write-Host "   Nombre de produits: $($productsResponse.Count)" -ForegroundColor Gray
    
    # Test d'accès aux ventes
    Write-Host "`n4. Test d'accès aux ventes..." -ForegroundColor Yellow
    $salesResponse = Invoke-RestMethod -Uri "http://localhost:8083/api/sales" -Method Get -Headers $headers -TimeoutSec 10
    Write-Host "✅ Accès aux ventes réussi!" -ForegroundColor Green
    Write-Host "   Nombre de ventes: $($salesResponse.Count)" -ForegroundColor Gray
    
    Write-Host "`n🎉 RÉSULTAT FINAL" -ForegroundColor Green
    Write-Host "=================" -ForegroundColor Green
    Write-Host "✅ Backend H2 fonctionnel" -ForegroundColor Green
    Write-Host "✅ API d'authentification opérationnelle" -ForegroundColor Green
    Write-Host "✅ Accès aux données protégées validé" -ForegroundColor Green
    Write-Host "✅ L'application mobile-expo peut se connecter" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Erreur lors du test: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Détails: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    
    Write-Host "`n🔧 Vérifications:" -ForegroundColor Yellow
    Write-Host "   → Le backend est-il démarré sur le port 8083 ?" -ForegroundColor Gray
    Write-Host "   → Utilisez: .\start-backend-h2.ps1" -ForegroundColor Gray
}

Write-Host "`n🔗 URLs importantes:" -ForegroundColor Cyan
Write-Host "   Backend API: http://localhost:8083" -ForegroundColor Gray
Write-Host "   H2 Console: http://localhost:8083/h2-console" -ForegroundColor Gray
