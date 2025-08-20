# Script pour corriger les problèmes de build Android dans mobile-expo

Write-Host "🔧 Correction des problèmes de build Android..." -ForegroundColor Green

# 1. Nettoyer les caches
Write-Host "1. Nettoyage des caches..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "   ✅ node_modules supprimé" -ForegroundColor Green
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "   ✅ package-lock.json supprimé" -ForegroundColor Green
}

if (Test-Path "android/build") {
    Remove-Item -Recurse -Force "android/build"
    Write-Host "   ✅ android/build supprimé" -ForegroundColor Green
}

if (Test-Path "android/app/build") {
    Remove-Item -Recurse -Force "android/app/build"
    Write-Host "   ✅ android/app/build supprimé" -ForegroundColor Green
}

# 2. Réinstaller les dépendances
Write-Host "2. Réinstallation des dépendances..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ npm install réussi" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erreur lors de npm install" -ForegroundColor Red
    exit 1
}

# 3. Nettoyer Gradle
Write-Host "3. Nettoyage Gradle..." -ForegroundColor Yellow
Set-Location "android"
./gradlew clean
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ gradlew clean réussi" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erreur lors de gradlew clean" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

# 4. Test de build
Write-Host "4. Test de build..." -ForegroundColor Yellow
./gradlew assembleDebug
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Build réussi !" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erreur lors du build" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

Set-Location ".."
Write-Host "🎉 Correction terminée avec succès !" -ForegroundColor Green
