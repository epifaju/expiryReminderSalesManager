# Demarrage Android emulateur + Metro (corrige connexion 10.0.2.2 sous Windows)

function Get-AdbOnlineDevices {
    $output = adb devices 2>&1
    $devices = @()
    foreach ($line in $output) {
        if ($line -match "^\s*([^\s]+)\s+device\s*$") {
            $devices += $Matches[1]
        }
    }
    return $devices
}

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Sales Manager - Android Emulator + Metro" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Connexion ADB (ne pas kill-server si un appareil est deja en ligne)
Write-Host "[1/3] Connexion ADB a l'emulateur..." -ForegroundColor Yellow

$online = Get-AdbOnlineDevices
if ($online.Count -eq 0) {
    Write-Host "  Aucun appareil en ligne. Redemarrage du daemon ADB..." -ForegroundColor DarkYellow
    adb kill-server 2>$null
    Start-Sleep -Seconds 2
    adb start-server | Out-Null
}

$maxWait = 120
$elapsed = 0
$deviceReady = $false

while ($elapsed -lt $maxWait) {
    $online = Get-AdbOnlineDevices
    if ($online.Count -gt 0) {
        $deviceReady = $true
        Write-Host "  Emulateur detecte: $($online[0])" -ForegroundColor Green
        break
    }

    $raw = adb devices 2>&1 | Select-Object -Skip 1 | Where-Object { $_ -match "\S" }
    $offline = $raw | Where-Object { $_ -match "offline|unauthorized" }
    if ($offline) {
        Write-Host "  Etat ADB: $($offline[0].Trim()) - attente ($elapsed s)..." -ForegroundColor DarkYellow
        if ($elapsed -eq 10) {
            Write-Host "  Astuce: Cold Boot de l'AVD dans Android Studio si bloque en offline" -ForegroundColor DarkYellow
        }
    }
    else {
        Write-Host "  Aucun appareil - demarrez Pixel_3_API_30 dans Android Studio ($elapsed s)..." -ForegroundColor DarkYellow
        Write-Host "    Puis verifiez: adb devices  (doit afficher 'device')" -ForegroundColor DarkGray
    }

    Start-Sleep -Seconds 5
    $elapsed += 5
}

if (-not $deviceReady) {
    Write-Host ""
    Write-Host "ERREUR: emulateur non pret apres ${maxWait}s." -ForegroundColor Red
    Write-Host "  1. Android Studio > Device Manager > Play sur Pixel_3_API_30" -ForegroundColor White
    Write-Host "  2. Attendre l'ecran d'accueil Android (pas seulement la fenetre)" -ForegroundColor White
    Write-Host "  3. Dans un autre terminal: adb devices" -ForegroundColor White
    Write-Host "     -> doit afficher: emulator-5554   device" -ForegroundColor White
    Write-Host "  4. Relancer: .\start-android-emulator.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "  Alternative sans ce script:" -ForegroundColor Yellow
    Write-Host "    adb reverse tcp:8081 tcp:8081" -ForegroundColor White
    Write-Host "    `$env:REACT_NATIVE_PACKAGER_HOSTNAME='localhost'" -ForegroundColor White
    Write-Host "    npx expo run:android" -ForegroundColor White
    exit 1
}

Write-Host "  Configuration adb reverse (port 8081)..." -ForegroundColor Yellow
adb reverse tcp:8081 tcp:8081
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: adb reverse a echoue." -ForegroundColor Red
    exit 1
}
adb reverse --list
Write-Host "OK adb reverse configure" -ForegroundColor Green
Write-Host ""
Write-Host "  Si premiere fois apres mise a jour MainApplication.kt:" -ForegroundColor DarkYellow
Write-Host "  -> npx expo run:android va recompiler l'APK (obligatoire une fois)" -ForegroundColor DarkYellow
Write-Host ""

# 2. Metro sur localhost
Write-Host "[2/3] Variables Metro (localhost)..." -ForegroundColor Yellow
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "localhost"
$env:EXPO_USE_LOCALHOST = "1"
Write-Host "  REACT_NATIVE_PACKAGER_HOSTNAME = localhost" -ForegroundColor White
Write-Host ""

# 3. Build + lancer
Write-Host "[3/3] Lancement expo run:android..." -ForegroundColor Yellow
Write-Host "  Backend requis: http://localhost:8083 (H2) ou :8082 (PostgreSQL)" -ForegroundColor White
Write-Host "  Emulateur -> API: http://10.0.2.2:8083 ou :8082" -ForegroundColor White
Write-Host ""
npx expo run:android
