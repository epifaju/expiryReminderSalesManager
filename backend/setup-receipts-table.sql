-- Script SQL pour créer la table receipts
-- À exécuter après la migration des autres tables

-- Créer la table receipts
CREATE TABLE IF NOT EXISTS receipts (
    id BIGSERIAL PRIMARY KEY,
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
    download_count INTEGER DEFAULT 0,
    
    -- Contraintes de clés étrangères
    CONSTRAINT fk_receipts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_receipts_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_sale_id ON receipts(sale_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);

-- Créer une fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_receipts_updated_at ON receipts;
CREATE TRIGGER trigger_update_receipts_updated_at
    BEFORE UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_receipts_updated_at();

-- Insérer des données de test (optionnel)
-- INSERT INTO receipts (
--     receipt_number, user_id, sale_id, total_amount, tax_amount, 
--     final_amount, payment_method, customer_name, company_name,
--     company_address, company_phone, company_email
-- ) VALUES (
--     'REC-20241201-001', 1, 1, 150.00, 30.00, 180.00, 'CARD',
--     'Jean Dupont', 'Mon Entreprise', '123 Rue de la Paix, 75001 Paris',
--     '01 23 45 67 89', 'contact@monentreprise.fr'
-- );

-- Commentaires sur la table
COMMENT ON TABLE receipts IS 'Table des reçus PDF générés pour les ventes';
COMMENT ON COLUMN receipts.receipt_number IS 'Numéro unique du reçu (format: REC-YYYYMMDD-XXX)';
COMMENT ON COLUMN receipts.user_id IS 'ID de l\'utilisateur qui a créé le reçu';
COMMENT ON COLUMN receipts.sale_id IS 'ID de la vente associée au reçu';
COMMENT ON COLUMN receipts.total_amount IS 'Montant total HT';
COMMENT ON COLUMN receipts.tax_amount IS 'Montant de la TVA';
COMMENT ON COLUMN receipts.discount_amount IS 'Montant de la remise';
COMMENT ON COLUMN receipts.final_amount IS 'Montant final TTC';
COMMENT ON COLUMN receipts.payment_method IS 'Méthode de paiement utilisée';
COMMENT ON COLUMN receipts.status IS 'Statut du reçu (GENERATED, SENT, DELIVERED, FAILED)';
COMMENT ON COLUMN receipts.company_name IS 'Nom de l\'entreprise';
COMMENT ON COLUMN receipts.company_address IS 'Adresse de l\'entreprise';
COMMENT ON COLUMN receipts.company_phone IS 'Téléphone de l\'entreprise';
COMMENT ON COLUMN receipts.company_email IS 'Email de l\'entreprise';
COMMENT ON COLUMN receipts.company_logo_url IS 'URL du logo de l\'entreprise';
COMMENT ON COLUMN receipts.notes IS 'Notes additionnelles sur le reçu';
COMMENT ON COLUMN receipts.qr_code_data IS 'Données du QR code pour vérification';
COMMENT ON COLUMN receipts.download_count IS 'Nombre de téléchargements du PDF';
COMMENT ON COLUMN receipts.downloaded_at IS 'Date du dernier téléchargement';
