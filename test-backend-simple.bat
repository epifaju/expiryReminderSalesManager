@echo off
echo Test de connexion au backend...

curl -X POST "http://localhost:8083/api/auth/signin" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@example.com\",\"password\":\"admin123\"}" ^
  -w "\nStatus: %%{http_code}\n"

if %errorlevel% equ 0 (
    echo Backend accessible sur le port 8083
) else (
    echo Backend non accessible sur le port 8083
)
