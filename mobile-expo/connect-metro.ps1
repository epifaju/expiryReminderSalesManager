# A lancer pendant que Metro tourne (npx expo run:android ou npx expo start)
Write-Host "Connexion Metro <-> emulateur..." -ForegroundColor Cyan

$devices = adb devices 2>&1 | Select-Object -Skip 1 | Where-Object { $_ -match "\tdevice\s*$" }
if (-not $devices) {
    Write-Host "ERREUR: aucun appareil ADB (emulateur ou telephone USB)." -ForegroundColor Red
    Write-Host "  Emulateur: demarrer Pixel_3_API_30 puis adb devices" -ForegroundColor White
    Write-Host "  Telephone: activer Options developpeur + Depannage USB, puis adb devices" -ForegroundColor White
    exit 1
}

adb reverse tcp:8081 tcp:8081
Write-Host "adb reverse OK" -ForegroundColor Green
adb reverse --list

Write-Host ""
Write-Host "Redemarrage de l'app..." -ForegroundColor Yellow
adb shell am force-stop com.anonymous.mobileexpo
Start-Sleep -Seconds 1
adb shell am start -n com.anonymous.mobileexpo/.MainActivity

Write-Host ""
Write-Host ""
Write-Host "IMPORTANT: Metro doit tourner avec:" -ForegroundColor Yellow
Write-Host "  npm run start:dev" -ForegroundColor White
Write-Host "  (PAS 'npm start' seul = mode Expo Go)" -ForegroundColor White
Write-Host ""
Write-Host "Si ecran blanc: touche 'r' dans Metro, ou recompiler:" -ForegroundColor Cyan
Write-Host "  npx expo run:android" -ForegroundColor White
Write-Host ""
Write-Host "Verifier l'IP Metro dans MainApplication.kt (metroHost)" -ForegroundColor DarkYellow
Write-Host "  ipconfig -> IPv4 du Wi-Fi, ex: 192.168.1.16" -ForegroundColor DarkYellow
Write-Host "Pare-feu Windows (admin): autoriser TCP 8081 entrant" -ForegroundColor DarkYellow
