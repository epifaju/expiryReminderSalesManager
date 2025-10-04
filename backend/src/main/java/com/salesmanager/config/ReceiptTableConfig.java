package com.salesmanager.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;

/**
 * Configuration pour s'assurer que la table receipts est créée correctement
 */
@Configuration
@ConditionalOnProperty(name = "spring.datasource.url", havingValue = "jdbc:h2:mem:testdb")
public class ReceiptTableConfig {

    /**
     * Commande pour vérifier et créer la table receipts si nécessaire
     */
    @Bean
    @Order(1)
    public CommandLineRunner ensureReceiptTableExists(DataSource dataSource) {
        return args -> {
            try (Connection connection = dataSource.getConnection()) {
                DatabaseMetaData metaData = connection.getMetaData();
                
                // Vérifier si la table receipts existe
                ResultSet tables = metaData.getTables(null, null, "RECEIPTS", new String[]{"TABLE"});
                
                if (!tables.next()) {
                    System.out.println("🔧 Table RECEIPTS non trouvée, création en cours...");
                    createReceiptTable(connection);
                    System.out.println("✅ Table RECEIPTS créée avec succès");
                } else {
                    System.out.println("✅ Table RECEIPTS existe déjà");
                }
                
            } catch (Exception e) {
                System.err.println("❌ Erreur lors de la vérification/création de la table RECEIPTS: " + e.getMessage());
                e.printStackTrace();
            }
        };
    }

    /**
     * Crée la table receipts avec la structure correcte pour H2
     */
    private void createReceiptTable(Connection connection) throws Exception {
        String createTableSQL = """
            CREATE TABLE receipts (
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
            )
            """;

        try (var statement = connection.createStatement()) {
            statement.execute(createTableSQL);
            
            // Créer les index
            statement.execute("CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_receipts_sale_id ON receipts(sale_id)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON receipts(receipt_number)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status)");
        }
    }
}
