# Script PowerShell pour démarrer le backend avec diagnostic des reçus
# Ce script démarre le backend et affiche les logs pour diagnostiquer le problème

Write-Host "🚀 Démarrage du backend avec diagnostic des reçus..." -ForegroundColor Green

# Aller dans le dossier backend
Set-Location backend

# Vérifier si Maven est disponible
if (Get-Command mvn -ErrorAction SilentlyContinue) {
    Write-Host "✅ Maven trouvé" -ForegroundColor Green
} else {
    Write-Host "❌ Maven non trouvé. Utilisation de ./mvnw" -ForegroundColor Yellow
}

# Démarrer le backend avec logs détaillés
Write-Host "📡 Démarrage du backend sur le port 8082..." -ForegroundColor Cyan
Write-Host "🔍 Logs détaillés activés pour diagnostiquer les reçus" -ForegroundColor Cyan

# Démarrer avec le profil par défaut (H2 en mémoire)
./mvnw spring-boot:run -Dspring-boot.run.profiles=default -Dspring-boot.run.jvmArguments="-Dlogging.level.com.salesmanager=DEBUG -Dlogging.level.org.hibernate.SQL=DEBUG"

Write-Host "✅ Backend démarré. Vérifiez les logs ci-dessus pour les erreurs." -ForegroundColor Green
Write-Host "💡 Si vous voyez des erreurs liées à la table 'receipts', c'est le problème !" -ForegroundColor Yellow
