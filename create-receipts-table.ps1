# Script PowerShell pour créer la table receipts manuellement dans H2
# Ce script se connecte à la console H2 et exécute le script SQL de création

Write-Host "🔧 Création manuelle de la table receipts dans H2..." -ForegroundColor Green

# URL de la console H2
$h2ConsoleUrl = "http://192.168.1.16:8082/h2-console"

Write-Host "📡 URL de la console H2: $h2ConsoleUrl" -ForegroundColor Cyan

# Script SQL pour créer la table receipts
$createTableSQL = @"
-- Créer la table receipts pour H2
CREATE TABLE IF NOT EXISTS receipts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    sale_id BIGINT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    final_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'GENERATED',
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_email VARCHAR(255),
    company_name VARCHAR(255),
    company_address TEXT,
    company_phone VARCHAR(50),
    company_email VARCHAR(255),
    company_logo_url VARCHAR(500),
    notes TEXT,
    qr_code_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    downloaded_at TIMESTAMP,
    download_count INTEGER DEFAULT 0
);

-- Créer des index
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_sale_id ON receipts(sale_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
"@

Write-Host "📋 Script SQL à exécuter dans la console H2:" -ForegroundColor Yellow
Write-Host $createTableSQL -ForegroundColor White

Write-Host "`n📖 Instructions:" -ForegroundColor Cyan
Write-Host "1. Ouvrez votre navigateur et allez à: $h2ConsoleUrl" -ForegroundColor White
Write-Host "2. Connectez-vous avec:" -ForegroundColor White
Write-Host "   - JDBC URL: jdbc:h2:mem:testdb" -ForegroundColor Gray
Write-Host "   - User Name: sa" -ForegroundColor Gray
Write-Host "   - Password: (laisser vide)" -ForegroundColor Gray
Write-Host "3. Copiez et collez le script SQL ci-dessus" -ForegroundColor White
Write-Host "4. Exécutez le script" -ForegroundColor White
Write-Host "5. Vérifiez avec: SELECT * FROM RECEIPTS;" -ForegroundColor White

Write-Host "`n💡 Alternative: Redémarrez le backend avec des logs détaillés pour voir les erreurs Hibernate" -ForegroundColor Yellow

