# Script PowerShell pour démarrer l'application complète (Backend + Mobile)
# Usage: .\start-application-complete.ps1 [--backend h2|postgresql] [--mobile]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("h2", "postgresql")]
    [string]$Backend = "h2",
    
    [Parameter(Mandatory=$false)]
    [switch]$Mobile = $true
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  🚀 Démarrage Application Sales Manager     " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour vérifier les prérequis
function Check-Prerequisites {
    Write-Host "🔍 Vérification des prérequis..." -ForegroundColor Yellow
    Write-Host ""
    
    $allOk = $true
    
    # Vérifier Java
    try {
        $javaVersion = java -version 2>&1 | Select-Object -First 1
        if ($javaVersion -match "version ""17" -or $javaVersion -match "version ""1[89]" -or $javaVersion -match "version ""2[0-9]") {
            Write-Host "   ✅ Java : OK" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Java : Version trouvée mais 17+ recommandé" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ❌ Java : Non trouvé" -ForegroundColor Red
        $allOk = $false
    }
    
    # Vérifier Maven
    try {
        $mvnVersion = mvn -version 2>&1 | Select-Object -First 1
        Write-Host "   ✅ Maven : OK" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Maven : Non trouvé" -ForegroundColor Red
        $allOk = $false
    }
    
    # Vérifier Node.js
    try {
        $nodeVersion = node -v
        Write-Host "   ✅ Node.js : OK ($nodeVersion)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Node.js : Non trouvé" -ForegroundColor Red
        $allOk = $false
    }
    
    # Vérifier npm
    try {
        $npmVersion = npm -v
        Write-Host "   ✅ npm : OK ($npmVersion)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ npm : Non trouvé" -ForegroundColor Red
        $allOk = $false
    }
    
    Write-Host ""
    
    if (-not $allOk) {
        Write-Host "❌ Certains prérequis manquent !" -ForegroundColor Red
        Write-Host "Veuillez installer les outils manquants avant de continuer." -ForegroundColor Yellow
        Write-Host ""
        pause
        exit 1
    }
    
    Write-Host "✅ Tous les prérequis sont OK !" -ForegroundColor Green
    Write-Host ""
}

# Fonction pour démarrer le backend
function Start-Backend {
    param([string]$Type)
    
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "  🔧 Démarrage du Backend                   " -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    
    if ($Type -eq "h2") {
        Write-Host "📦 Configuration : H2 (base en mémoire)" -ForegroundColor Yellow
        Write-Host "   Port : 8083" -ForegroundColor White
        Write-Host "   URL : http://localhost:8083" -ForegroundColor White
        Write-Host ""
        
        if (Test-Path ".\start-backend-h2.ps1") {
            Write-Host "🚀 Démarrage du backend avec H2..." -ForegroundColor Green
            Write-Host ""
            Write-Host "⚠️  Le backend va démarrer dans cette fenêtre." -ForegroundColor Yellow
            Write-Host "   Laissez cette fenêtre ouverte !" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Appuyez sur Ctrl+C pour arrêter le backend" -ForegroundColor Gray
            Write-Host ""
            
            # Démarrer dans la même fenêtre
            & ".\start-backend-h2.ps1"
        } else {
            Write-Host "❌ Script start-backend-h2.ps1 non trouvé" -ForegroundColor Red
            Write-Host "Démarrage manuel..." -ForegroundColor Yellow
            Set-Location backend
            mvn spring-boot:run
        }
    } elseif ($Type -eq "postgresql") {
        Write-Host "🐘 Configuration : PostgreSQL" -ForegroundColor Yellow
        Write-Host "   Port : 8082" -ForegroundColor White
        Write-Host "   URL : http://localhost:8082" -ForegroundColor White
        Write-Host ""
        
        if (Test-Path ".\start-backend-postgresql.ps1") {
            Write-Host "🚀 Démarrage du backend avec PostgreSQL..." -ForegroundColor Green
            Write-Host ""
            Write-Host "⚠️  Le backend va démarrer dans cette fenêtre." -ForegroundColor Yellow
            Write-Host "   Laissez cette fenêtre ouverte !" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Appuyez sur Ctrl+C pour arrêter le backend" -ForegroundColor Gray
            Write-Host ""
            
            & ".\start-backend-postgresql.ps1"
        } else {
            Write-Host "❌ Script start-backend-postgresql.ps1 non trouvé" -ForegroundColor Red
            Write-Host "Démarrage manuel..." -ForegroundColor Yellow
            Set-Location backend
            mvn spring-boot:run "-Dspring.profiles.active=postgresql"
        }
    }
}

# Fonction pour démarrer l'app mobile
function Start-Mobile {
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "  📱 Démarrage de l'Application Mobile     " -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not (Test-Path "mobile-expo")) {
        Write-Host "❌ Dossier mobile-expo non trouvé !" -ForegroundColor Red
        return
    }
    
    Set-Location mobile-expo
    
    # Vérifier si node_modules existe
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installation des dépendances npm..." -ForegroundColor Yellow
        Write-Host ""
        npm install
        Write-Host ""
    }
    
    Write-Host "🚀 Démarrage de Expo..." -ForegroundColor Green
    Write-Host ""
    Write-Host "Instructions :" -ForegroundColor Yellow
    Write-Host "   1. Un QR code va apparaître" -ForegroundColor White
    Write-Host "   2. Scannez-le avec Expo Go sur votre téléphone" -ForegroundColor White
    Write-Host "   3. Ou appuyez sur 'a' pour l'émulateur Android" -ForegroundColor White
    Write-Host "   4. Ou appuyez sur 'i' pour le simulateur iOS" -ForegroundColor White
    Write-Host ""
    Write-Host "Identifiants de connexion :" -ForegroundColor Yellow
    Write-Host "   Username : admin" -ForegroundColor White
    Write-Host "   Password : admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "Appuyez sur Ctrl+C pour arrêter" -ForegroundColor Gray
    Write-Host ""
    
    # Démarrer Expo
    npm start
}

# Fonction pour vérifier que le backend est prêt
function Wait-ForBackend {
    param([string]$Url, [int]$MaxRetries = 30)
    
    Write-Host "⏳ Attente du backend..." -ForegroundColor Yellow
    
    $retries = 0
    while ($retries -lt $MaxRetries) {
        try {
            $response = Invoke-WebRequest -Uri "$Url/actuator/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Backend prêt !" -ForegroundColor Green
                Write-Host ""
                return $true
            }
        } catch {
            # Backend pas encore prêt
        }
        
        $retries++
        Start-Sleep -Seconds 2
        Write-Host "   Tentative $retries/$MaxRetries..." -ForegroundColor Gray
    }
    
    Write-Host "⚠️  Backend non accessible après $MaxRetries tentatives" -ForegroundColor Yellow
    Write-Host "   Continuez quand même - le backend démarre peut-être encore..." -ForegroundColor Yellow
    Write-Host ""
    return $false
}

# ============================================
# DÉBUT DU SCRIPT
# ============================================

# Vérifier les prérequis
Check-Prerequisites

# Afficher le menu
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  🎯 Mode de Démarrage                      " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend : $Backend" -ForegroundColor White
if ($Backend -eq "h2") {
    Write-Host "   • Base de données : H2 (en mémoire)" -ForegroundColor Gray
    Write-Host "   • Port : 8083" -ForegroundColor Gray
} else {
    Write-Host "   • Base de données : PostgreSQL" -ForegroundColor Gray
    Write-Host "   • Port : 8082" -ForegroundColor Gray
}
Write-Host ""
Write-Host "Mobile : $(if ($Mobile) { "Oui" } else { "Non" })" -ForegroundColor White
Write-Host ""

# Démarrer le backend
if ($Backend) {
    # Démarrer dans une nouvelle fenêtre PowerShell
    $backendPort = if ($Backend -eq "h2") { "8083" } else { "8082" }
    $backendUrl = "http://localhost:$backendPort"
    
    Write-Host "💡 Astuce : Le backend va démarrer dans cette fenêtre." -ForegroundColor Cyan
    Write-Host "   Pour démarrer le mobile aussi, ouvrez une NOUVELLE fenêtre PowerShell" -ForegroundColor Cyan
    Write-Host "   et exécutez : cd mobile-expo && npm start" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ou appuyez sur une touche pour démarrer uniquement le backend ici..." -ForegroundColor Yellow
    pause
    
    Start-Backend -Type $Backend
} else {
    Write-Host "Aucun composant à démarrer." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Usage :" -ForegroundColor Cyan
    Write-Host "   .\start-application-complete.ps1 --backend h2" -ForegroundColor White
    Write-Host "   .\start-application-complete.ps1 --backend postgresql" -ForegroundColor White
    Write-Host ""
    Write-Host "Pour démarrer aussi le mobile :" -ForegroundColor Cyan
    Write-Host "   Ouvrez une nouvelle fenêtre PowerShell et :" -ForegroundColor White
    Write-Host "   cd mobile-expo" -ForegroundColor White
    Write-Host "   npm start" -ForegroundColor White
    Write-Host ""
    pause
}

