Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  🚀 Sales Manager Backend - PostgreSQL    " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que PostgreSQL est installé
Write-Host "🔍 Vérification de PostgreSQL..." -ForegroundColor Yellow
try {
    $pgVersion = psql --version
    Write-Host "✅ PostgreSQL trouvé : $pgVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ PostgreSQL n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pour installer PostgreSQL :" -ForegroundColor Yellow
    Write-Host "  1. Avec Chocolatey : choco install postgresql" -ForegroundColor White
    Write-Host "  2. Ou télécharger : https://www.postgresql.org/download/" -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}

Write-Host ""

# Vérifier que le service PostgreSQL est démarré
Write-Host "🔍 Vérification du service PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue

if ($pgService) {
    if ($pgService.Status -eq "Running") {
        Write-Host "✅ Service PostgreSQL en cours d'exécution" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Service PostgreSQL arrêté. Tentative de démarrage..." -ForegroundColor Yellow
        try {
            Start-Service $pgService.Name
            Write-Host "✅ Service PostgreSQL démarré" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Impossible de démarrer le service PostgreSQL" -ForegroundColor Red
            Write-Host "Veuillez le démarrer manuellement : Start-Service $($pgService.Name)" -ForegroundColor Yellow
        }
    }
}
else {
    Write-Host "⚠️  Service PostgreSQL non trouvé, il fonctionne peut-être déjà" -ForegroundColor Yellow
}

Write-Host ""

# Tester la connexion à la base de données
Write-Host "🔍 Test de connexion à la base de données..." -ForegroundColor Yellow
Write-Host "   Base de données : salesmanager" -ForegroundColor White
Write-Host "   Utilisateur : salesmanager" -ForegroundColor White
Write-Host ""

# Information importante
Write-Host "⚠️  IMPORTANT :" -ForegroundColor Yellow
Write-Host "   Si c'est votre première utilisation de PostgreSQL :" -ForegroundColor White
Write-Host "   1. Exécutez le script : psql -U postgres -f backend/setup-postgresql.sql" -ForegroundColor Cyan
Write-Host "   2. Ou créez manuellement la base 'salesmanager'" -ForegroundColor Cyan
Write-Host ""

# Demander confirmation
Write-Host "Continuer le démarrage ? (O/N)" -ForegroundColor Yellow
$response = Read-Host
if ($response -ne "O" -and $response -ne "o") {
    Write-Host "❌ Annulé par l'utilisateur" -ForegroundColor Red
    pause
    exit 0
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  📦 Compilation Maven                      " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

cd backend

Write-Host "Compilation en cours..." -ForegroundColor Yellow
mvn clean compile

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Erreur lors de la compilation Maven" -ForegroundColor Red
    Write-Host ""
    pause
    exit 1
}

Write-Host ""
Write-Host "✅ Compilation réussie !" -ForegroundColor Green
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  🚀 Démarrage Spring Boot avec PostgreSQL " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration :" -ForegroundColor Yellow
Write-Host "  • Profil : postgresql" -ForegroundColor White
Write-Host "  • Port : 8082" -ForegroundColor White
Write-Host "  • Base de données : jdbc:postgresql://localhost:5432/salesmanager" -ForegroundColor White
Write-Host "  • Utilisateur : salesmanager" -ForegroundColor White
Write-Host ""
Write-Host "Le backend va démarrer..." -ForegroundColor Green
Write-Host ""

# Démarrer avec le profil PostgreSQL
mvn spring-boot:run -Dspring.profiles.active=postgresql

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  🛑 Backend arrêté                         " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

pause

