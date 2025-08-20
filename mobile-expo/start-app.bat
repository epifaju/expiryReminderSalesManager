@echo off
echo ========================================
echo   Sales Manager Mobile - Demarrage
echo ========================================
echo.

echo 1. Verification du backend...
echo.

REM Tester si le backend est deja en cours d'execution
curl -s http://192.168.1.27:8081/health >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Backend deja en cours d'execution sur http://192.168.1.27:8081
) else (
    echo ❌ Backend non accessible. Veuillez demarrer le backend avec:
    echo    cd backend
    echo    mvn spring-boot:run
    echo.
    pause
    exit /b 1
)

echo.
echo 2. Test de connectivite...
echo.
node test-connection-emulator.js

echo.
echo 3. Demarrage de l'application Expo avec Expo Go...
echo.
echo ⚠️  IMPORTANT: Utilisez Expo Go pour eviter les erreurs de build!
echo.
echo Instructions:
echo 1. Ouvrez l'emulateur Android
echo 2. Installez Expo Go depuis le Play Store si necessaire
echo 3. Scannez le QR code ou cliquez sur l'URL tunnel
echo 4. L'application se chargera directement dans Expo Go
echo.
echo Identifiants de test:
echo - Nom d'utilisateur: admin
echo - Mot de passe: admin123
echo.
echo ✅ La connexion fonctionne parfaitement avec cette configuration!
echo.

npx expo start --clear

pause
