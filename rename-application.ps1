param(
    [Parameter(Mandatory = $true)]
    [string]$NewName,
    
    [Parameter(Mandatory = $false)]
    [string]$NewPackage = "",
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipBackup
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  🏷️  Changement de Nom d'Application       " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Validation du nom
if ([string]::IsNullOrWhiteSpace($NewName)) {
    Write-Host "❌ Le nom ne peut pas être vide !" -ForegroundColor Red
    exit 1
}

# Génération automatique du slug et package si non fournis
$slug = $NewName.ToLower() -replace '\s+', '-' -replace '[^a-z0-9-]', ''
if ([string]::IsNullOrWhiteSpace($NewPackage)) {
    $packageName = $NewName.ToLower() -replace '\s+', '' -replace '[^a-z0-9]', ''
    $NewPackage = "com.$packageName.app"
}

# Affichage des informations
Write-Host "📝 Informations du changement :" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Ancien nom : Sales Manager Mobile" -ForegroundColor White
Write-Host "   Nouveau nom : $NewName" -ForegroundColor Green
Write-Host ""
Write-Host "   Slug Expo : $slug" -ForegroundColor White
Write-Host "   Package Android : $NewPackage" -ForegroundColor White
Write-Host ""

# Demander confirmation
Write-Host "⚠️  Cette opération va modifier plusieurs fichiers." -ForegroundColor Yellow
Write-Host "Continuer ? (O/N)" -ForegroundColor Yellow
$confirmation = Read-Host

if ($confirmation -ne "O" -and $confirmation -ne "o") {
    Write-Host "❌ Opération annulée" -ForegroundColor Red
    exit 0
}

Write-Host ""

# Créer une sauvegarde
if (-not $SkipBackup) {
    Write-Host "💾 Création d'une sauvegarde..." -ForegroundColor Yellow
    
    $backupDir = "backup_rename_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    
    Copy-Item "mobile-expo/app.json" "$backupDir/app.json" -ErrorAction SilentlyContinue
    Copy-Item "mobile-expo/package.json" "$backupDir/package.json" -ErrorAction SilentlyContinue
    Copy-Item "mobile-expo/src/i18n/locales/fr.json" "$backupDir/fr.json" -ErrorAction SilentlyContinue
    Copy-Item "mobile-expo/src/i18n/locales/pt.json" "$backupDir/pt.json" -ErrorAction SilentlyContinue
    Copy-Item "mobile-expo/src/i18n/locales/cr.json" "$backupDir/cr.json" -ErrorAction SilentlyContinue
    Copy-Item "backend/pom.xml" "$backupDir/pom.xml" -ErrorAction SilentlyContinue
    
    Write-Host "   ✅ Sauvegarde créée dans : $backupDir" -ForegroundColor Green
    Write-Host ""
}

$filesModified = 0

# Modifier app.json
Write-Host "1️⃣  Modification de app.json..." -ForegroundColor Yellow

if (Test-Path "mobile-expo/app.json") {
    try {
        $appJson = Get-Content "mobile-expo/app.json" -Raw | ConvertFrom-Json
        
        $appJson.expo.name = $NewName
        $appJson.expo.slug = $slug
        $appJson.expo.android.package = $NewPackage
        
        $appJson | ConvertTo-Json -Depth 10 | Set-Content "mobile-expo/app.json" -Encoding UTF8
        
        Write-Host "   ✅ app.json modifié" -ForegroundColor Green
        $filesModified++
    }
    catch {
        Write-Host "   ❌ Erreur lors de la modification de app.json : $_" -ForegroundColor Red
    }
}
else {
    Write-Host "   ⚠️  app.json non trouvé" -ForegroundColor Yellow
}

Write-Host ""

# Modifier package.json
Write-Host "2️⃣  Modification de package.json..." -ForegroundColor Yellow

if (Test-Path "mobile-expo/package.json") {
    try {
        $content = Get-Content "mobile-expo/package.json" -Raw
        $content = $content -replace '"name":\s*"sales-manager-mobile"', "`"name`": `"$slug-mobile`""
        $content | Set-Content "mobile-expo/package.json" -Encoding UTF8
        
        Write-Host "   ✅ package.json modifié" -ForegroundColor Green
        $filesModified++
    }
    catch {
        Write-Host "   ❌ Erreur lors de la modification de package.json : $_" -ForegroundColor Red
    }
}
else {
    Write-Host "   ⚠️  package.json non trouvé" -ForegroundColor Yellow
}

Write-Host ""

# Modifier les fichiers de traduction
Write-Host "3️⃣  Modification des fichiers de traduction..." -ForegroundColor Yellow

$i18nFiles = @(
    "mobile-expo/src/i18n/locales/fr.json",
    "mobile-expo/src/i18n/locales/pt.json",
    "mobile-expo/src/i18n/locales/cr.json"
)

foreach ($file in $i18nFiles) {
    if (Test-Path $file) {
        try {
            $content = Get-Content $file -Raw
            $content = $content -replace '"name":\s*"Sales Manager Mobile"', "`"name`": `"$NewName`""
            $content | Set-Content $file -Encoding UTF8
            
            $fileName = Split-Path $file -Leaf
            Write-Host "   ✅ $fileName modifié" -ForegroundColor Green
            $filesModified++
        }
        catch {
            Write-Host "   ❌ Erreur lors de la modification de $file : $_" -ForegroundColor Red
        }
    }
}

Write-Host ""

# Modifier pom.xml (optionnel - seulement name et description)
Write-Host "4️⃣  Modification de pom.xml..." -ForegroundColor Yellow

if (Test-Path "backend/pom.xml") {
    try {
        $content = Get-Content "backend/pom.xml" -Raw
        $content = $content -replace '<name>sales-manager-api</name>', "<name>$slug-api</name>"
        $content = $content -replace 'API pour l''application de gestion de ventes et stock', "API pour $NewName - Gestion de ventes et stock"
        $content | Set-Content "backend/pom.xml" -Encoding UTF8
        
        Write-Host "   ✅ pom.xml modifié (name et description)" -ForegroundColor Green
        $filesModified++
    }
    catch {
        Write-Host "   ❌ Erreur lors de la modification de pom.xml : $_" -ForegroundColor Red
    }
}
else {
    Write-Host "   ⚠️  pom.xml non trouvé" -ForegroundColor Yellow
}

Write-Host ""

# Résumé
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  ✅ Changement Terminé !                   " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 Résumé :" -ForegroundColor Yellow
Write-Host "   Fichiers modifiés : $filesModified" -ForegroundColor White
Write-Host ""

Write-Host "🎯 Nouveau nom : $NewName" -ForegroundColor Green
Write-Host "   Slug : $slug" -ForegroundColor White
Write-Host "   Package : $NewPackage" -ForegroundColor White
Write-Host ""

if (-not $SkipBackup) {
    Write-Host "💾 Sauvegarde disponible dans : $backupDir" -ForegroundColor Cyan
    Write-Host ""
}

# Prochaines étapes
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  📋 Prochaines Étapes                      " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  Tester l'application mobile :" -ForegroundColor Yellow
Write-Host "   cd mobile-expo" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White
Write-Host ""

Write-Host "2️⃣  Vérifier que le nouveau nom s'affiche :" -ForegroundColor Yellow
Write-Host "   - Écran de login" -ForegroundColor White
Write-Host "   - Paramètres → À propos" -ForegroundColor White
Write-Host ""

Write-Host "3️⃣  Builder un APK de test :" -ForegroundColor Yellow
Write-Host "   eas build --platform android --profile preview" -ForegroundColor White
Write-Host ""

Write-Host "4️⃣  Si tout fonctionne, déployer :" -ForegroundColor Yellow
Write-Host "   Suivre DEPLOIEMENT_RAPIDE.md" -ForegroundColor White
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✨ Votre application s'appelle maintenant : $NewName ! 🎉" -ForegroundColor Green
Write-Host ""

pause

