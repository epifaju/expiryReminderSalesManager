# Script PowerShell pour démarrer le backend avec H2
Write-Host "🚀 Démarrage du backend Sales Manager avec H2" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Aller dans le dossier backend
Set-Location backend

# Définir les variables d'environnement pour forcer H2
$env:SPRING_PROFILES_ACTIVE = "test"
$env:SPRING_DATASOURCE_URL = "jdbc:h2:mem:testdb"
$env:SPRING_DATASOURCE_DRIVER_CLASS_NAME = "org.h2.Driver"
$env:SPRING_DATASOURCE_USERNAME = "sa"
$env:SPRING_DATASOURCE_PASSWORD = "password"
$env:SPRING_JPA_DATABASE_PLATFORM = "org.hibernate.dialect.H2Dialect"
$env:SERVER_PORT = "8083"

Write-Host "✅ Variables d'environnement configurées pour H2" -ForegroundColor Yellow
Write-Host "   - Profile: test" -ForegroundColor Gray
Write-Host "   - Database: H2 (en mémoire)" -ForegroundColor Gray
Write-Host "   - URL: jdbc:h2:mem:testdb" -ForegroundColor Gray

Write-Host "`n🔄 Démarrage de Maven..." -ForegroundColor Blue

# Démarrer Maven avec les bonnes options
try {
    mvn spring-boot:run
} catch {
    Write-Host "❌ Erreur lors du démarrage" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Revenir au dossier parent
Set-Location ..
