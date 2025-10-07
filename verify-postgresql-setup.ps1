Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  🔍 Vérification PostgreSQL Setup        " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$allChecks = @()

# Check 1 : PostgreSQL installé
Write-Host "1️⃣  Vérification de l'installation PostgreSQL..." -ForegroundColor Yellow
try {
    $pgVersion = psql --version 2>&1
    if ($pgVersion -match "psql") {
        Write-Host "   ✅ PostgreSQL installé : $pgVersion" -ForegroundColor Green
        $allChecks += $true
    } else {
        Write-Host "   ❌ PostgreSQL non trouvé" -ForegroundColor Red
        $allChecks += $false
    }
} catch {
    Write-Host "   ❌ PostgreSQL n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    Write-Host "      Solution : choco install postgresql" -ForegroundColor Yellow
    $allChecks += $false
}

Write-Host ""

# Check 2 : Service PostgreSQL
Write-Host "2️⃣  Vérification du service PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue

if ($pgService) {
    if ($pgService.Status -eq "Running") {
        Write-Host "   ✅ Service '$($pgService.Name)' en cours d'exécution" -ForegroundColor Green
        $allChecks += $true
    } else {
        Write-Host "   ⚠️  Service '$($pgService.Name)' arrêté" -ForegroundColor Yellow
        Write-Host "      Solution : Start-Service $($pgService.Name)" -ForegroundColor Yellow
        $allChecks += $false
    }
} else {
    Write-Host "   ⚠️  Service PostgreSQL non trouvé (peut-être normal)" -ForegroundColor Yellow
    $allChecks += $true
}

Write-Host ""

# Check 3 : Connexion à PostgreSQL
Write-Host "3️⃣  Test de connexion à PostgreSQL..." -ForegroundColor Yellow
Write-Host "   Tentative de connexion en tant que 'postgres'..." -ForegroundColor White

$testConnection = "SELECT version();" | psql -U postgres -t 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Connexion PostgreSQL réussie" -ForegroundColor Green
    $allChecks += $true
} else {
    Write-Host "   ⚠️  Impossible de se connecter" -ForegroundColor Yellow
    Write-Host "      Cela peut être normal si vous n'avez pas configuré le mot de passe" -ForegroundColor White
    $allChecks += $true
}

Write-Host ""

# Check 4 : Base de données 'salesmanager'
Write-Host "4️⃣  Vérification de la base de données 'salesmanager'..." -ForegroundColor Yellow

$checkDB = "SELECT 1 FROM pg_database WHERE datname = 'salesmanager';" | psql -U postgres -t 2>&1

if ($LASTEXITCODE -eq 0 -and $checkDB -match "1") {
    Write-Host "   ✅ Base de données 'salesmanager' existe" -ForegroundColor Green
    $allChecks += $true
} else {
    Write-Host "   ❌ Base de données 'salesmanager' n'existe pas" -ForegroundColor Red
    Write-Host "      Solution : psql -U postgres -f backend/setup-postgresql.sql" -ForegroundColor Yellow
    $allChecks += $false
}

Write-Host ""

# Check 5 : Utilisateur 'salesmanager'
Write-Host "5️⃣  Vérification de l'utilisateur 'salesmanager'..." -ForegroundColor Yellow

$checkUser = "SELECT 1 FROM pg_user WHERE usename = 'salesmanager';" | psql -U postgres -t 2>&1

if ($LASTEXITCODE -eq 0 -and $checkUser -match "1") {
    Write-Host "   ✅ Utilisateur 'salesmanager' existe" -ForegroundColor Green
    $allChecks += $true
} else {
    Write-Host "   ❌ Utilisateur 'salesmanager' n'existe pas" -ForegroundColor Red
    Write-Host "      Solution : psql -U postgres -f backend/setup-postgresql.sql" -ForegroundColor Yellow
    $allChecks += $false
}

Write-Host ""

# Check 6 : Fichiers de configuration
Write-Host "6️⃣  Vérification des fichiers de configuration..." -ForegroundColor Yellow

if (Test-Path "backend/src/main/resources/application-postgresql.yml") {
    Write-Host "   ✅ application-postgresql.yml trouvé" -ForegroundColor Green
    $allChecks += $true
} else {
    Write-Host "   ❌ application-postgresql.yml manquant" -ForegroundColor Red
    $allChecks += $false
}

if (Test-Path "backend/setup-postgresql.sql") {
    Write-Host "   ✅ setup-postgresql.sql trouvé" -ForegroundColor Green
    $allChecks += $true
} else {
    Write-Host "   ❌ setup-postgresql.sql manquant" -ForegroundColor Red
    $allChecks += $false
}

Write-Host ""

# Check 7 : Driver PostgreSQL dans pom.xml
Write-Host "7️⃣  Vérification du driver PostgreSQL..." -ForegroundColor Yellow

if (Test-Path "backend/pom.xml") {
    $pomContent = Get-Content "backend/pom.xml" -Raw
    if ($pomContent -match "postgresql") {
        Write-Host "   ✅ Driver PostgreSQL présent dans pom.xml" -ForegroundColor Green
        $allChecks += $true
    } else {
        Write-Host "   ❌ Driver PostgreSQL manquant dans pom.xml" -ForegroundColor Red
        $allChecks += $false
    }
} else {
    Write-Host "   ❌ pom.xml non trouvé" -ForegroundColor Red
    $allChecks += $false
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  📊 Résumé de la vérification             " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$successCount = ($allChecks | Where-Object { $_ -eq $true }).Count
$totalChecks = $allChecks.Count

Write-Host "Checks réussis : $successCount / $totalChecks" -ForegroundColor White
Write-Host ""

if ($successCount -eq $totalChecks) {
    Write-Host "✅ TOUT EST PRÊT ! Vous pouvez démarrer avec PostgreSQL !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pour démarrer :" -ForegroundColor Yellow
    Write-Host "   .\start-backend-postgresql.ps1" -ForegroundColor Cyan
} elseif ($successCount -ge $totalChecks - 2) {
    Write-Host "⚠️  PRESQUE PRÊT ! Quelques ajustements nécessaires" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Action requise :" -ForegroundColor Yellow
    Write-Host "   1. Créer la base de données avec :" -ForegroundColor White
    Write-Host "      psql -U postgres -f backend/setup-postgresql.sql" -ForegroundColor Cyan
} else {
    Write-Host "❌ CONFIGURATION INCOMPLÈTE" -ForegroundColor Red
    Write-Host ""
    Write-Host "Actions requises :" -ForegroundColor Yellow
    Write-Host "   1. Installer PostgreSQL : choco install postgresql" -ForegroundColor White
    Write-Host "   2. Créer la base : psql -U postgres -f backend/setup-postgresql.sql" -ForegroundColor White
    Write-Host "   3. Relancer ce script pour vérifier" -ForegroundColor White
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

pause

