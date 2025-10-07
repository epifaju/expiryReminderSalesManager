Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  📦 Préparation pour Production           " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$allChecks = @()

# Check 1 : Vérifier que le backend compile
Write-Host "1️⃣  Compilation du backend..." -ForegroundColor Yellow

cd backend

Write-Host "   Compilation Maven en cours..." -ForegroundColor White
mvn clean package -DskipTests 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Backend compilé avec succès" -ForegroundColor Green
    
    # Vérifier que le JAR existe
    if (Test-Path "target/sales-manager-api-1.0.0.jar") {
        $jarSize = (Get-Item "target/sales-manager-api-1.0.0.jar").Length / 1MB
        Write-Host "   ✅ JAR créé : $([math]::Round($jarSize, 2)) MB" -ForegroundColor Green
        $allChecks += $true
    }
    else {
        Write-Host "   ❌ JAR non trouvé" -ForegroundColor Red
        $allChecks += $false
    }
}
else {
    Write-Host "   ❌ Erreur de compilation" -ForegroundColor Red
    $allChecks += $false
}

Write-Host ""

# Check 2 : Vérifier la configuration PostgreSQL
Write-Host "2️⃣  Vérification de la configuration PostgreSQL..." -ForegroundColor Yellow

if (Test-Path "src/main/resources/application-postgresql.yml") {
    Write-Host "   ✅ application-postgresql.yml présent" -ForegroundColor Green
    $allChecks += $true
}
else {
    Write-Host "   ❌ application-postgresql.yml manquant" -ForegroundColor Red
    $allChecks += $false
}

Write-Host ""

# Check 3 : Vérifier les dépendances
Write-Host "3️⃣  Vérification des dépendances..." -ForegroundColor Yellow

$pomContent = Get-Content "pom.xml" -Raw

if ($pomContent -match "postgresql") {
    Write-Host "   ✅ Driver PostgreSQL présent" -ForegroundColor Green
    $allChecks += $true
}
else {
    Write-Host "   ❌ Driver PostgreSQL manquant" -ForegroundColor Red
    $allChecks += $false
}

if ($pomContent -match "jjwt") {
    Write-Host "   ✅ JWT présent" -ForegroundColor Green
    $allChecks += $true
}
else {
    Write-Host "   ❌ JWT manquant" -ForegroundColor Red
    $allChecks += $false
}

if ($pomContent -match "itextpdf") {
    Write-Host "   ✅ PDF Generation présent" -ForegroundColor Green
    $allChecks += $true
}
else {
    Write-Host "   ⚠️  PDF Generation manquant" -ForegroundColor Yellow
    $allChecks += $true
}

Write-Host ""

# Check 4 : Vérifier l'app mobile
Write-Host "4️⃣  Vérification de l'application mobile..." -ForegroundColor Yellow

cd ../mobile-expo

if (Test-Path "app.json") {
    Write-Host "   ✅ app.json présent" -ForegroundColor Green
    
    $appJson = Get-Content "app.json" -Raw | ConvertFrom-Json
    Write-Host "   📱 Nom : $($appJson.expo.name)" -ForegroundColor White
    Write-Host "   📌 Version : $($appJson.expo.version)" -ForegroundColor White
    
    if ($appJson.expo.android.package) {
        Write-Host "   ✅ Package Android configuré : $($appJson.expo.android.package)" -ForegroundColor Green
        $allChecks += $true
    }
    else {
        Write-Host "   ⚠️  Package Android non configuré" -ForegroundColor Yellow
        $allChecks += $true
    }
}
else {
    Write-Host "   ❌ app.json manquant" -ForegroundColor Red
    $allChecks += $false
}

Write-Host ""

# Check 5 : Vérifier package.json
Write-Host "5️⃣  Vérification des dépendances mobile..." -ForegroundColor Yellow

if (Test-Path "package.json") {
    Write-Host "   ✅ package.json présent" -ForegroundColor Green
    
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    
    if ($packageJson.dependencies."@react-native-async-storage/async-storage") {
        Write-Host "   ✅ AsyncStorage installé" -ForegroundColor Green
    }
    
    if ($packageJson.dependencies."react-native") {
        Write-Host "   ✅ React Native installé" -ForegroundColor Green
    }
    
    $allChecks += $true
}
else {
    Write-Host "   ❌ package.json manquant" -ForegroundColor Red
    $allChecks += $false
}

Write-Host ""

# Retour à la racine
cd ..

# Résumé
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  📊 Résumé de la préparation              " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$successCount = ($allChecks | Where-Object { $_ -eq $true }).Count
$totalChecks = $allChecks.Count

Write-Host "Checks réussis : $successCount / $totalChecks" -ForegroundColor White
Write-Host ""

if ($successCount -eq $totalChecks) {
    Write-Host "✅ PRÊT POUR LA PRODUCTION !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes :" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📱 Pour l'application mobile :" -ForegroundColor Cyan
    Write-Host "   1. Modifier l'URL de l'API dans mobile-expo/src/services/authService.ts" -ForegroundColor White
    Write-Host "   2. cd mobile-expo" -ForegroundColor White
    Write-Host "   3. eas build --platform android" -ForegroundColor White
    Write-Host ""
    Write-Host "☁️  Pour le backend :" -ForegroundColor Cyan
    Write-Host "   1. Créer compte sur https://railway.app" -ForegroundColor White
    Write-Host "   2. Deploy from GitHub" -ForegroundColor White
    Write-Host "   3. Ajouter PostgreSQL database" -ForegroundColor White
    Write-Host "   4. Configurer JWT_SECRET dans Variables" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 Guide détaillé :" -ForegroundColor Cyan
    Write-Host "   - DEPLOIEMENT_RAPIDE.md (30 minutes)" -ForegroundColor White
    Write-Host "   - GUIDE_DEPLOIEMENT_PRODUCTION.md (complet)" -ForegroundColor White
    
}
else {
    Write-Host "⚠️  QUELQUES AJUSTEMENTS NÉCESSAIRES" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Veuillez corriger les erreurs ci-dessus avant de continuer." -ForegroundColor White
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

pause

