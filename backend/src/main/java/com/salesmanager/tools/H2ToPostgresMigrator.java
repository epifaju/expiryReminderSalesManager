package com.salesmanager.tools;

import java.math.BigDecimal;
import java.sql.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Migration one-shot H2 -> PostgreSQL.
 *
 * Usage (PowerShell):
 *   $env:H2_URL="jdbc:h2:file:./data/h2/salesmanager"
 *   $env:H2_USER="sa"
 *   $env:H2_PASSWORD=""
 *   $env:PG_URL="jdbc:postgresql://localhost:5432/salesmanager"
 *   $env:PG_USER="salesmanager"
 *   $env:PG_PASSWORD="password"
 *   mvn -q -DskipTests exec:java -Dexec.mainClass="com.salesmanager.tools.H2ToPostgresMigrator"
 */
public final class H2ToPostgresMigrator {

    public static void main(String[] args) throws Exception {
        String h2Url = env("H2_URL");
        String h2User = envDefault("H2_USER", "sa");
        String h2Password = envDefault("H2_PASSWORD", "");

        String pgUrl = env("PG_URL");
        String pgUser = envDefault("PG_USER", "salesmanager");
        String pgPassword = envDefault("PG_PASSWORD", "password");

        try (Connection h2 = DriverManager.getConnection(h2Url, h2User, h2Password);
             Connection pg = DriverManager.getConnection(pgUrl, pgUser, pgPassword)) {

            pg.setAutoCommit(false);
            try {
                disableConstraints(pg);

                migrateUsers(h2, pg);
                migrateUserRoles(h2, pg);
                migrateProducts(h2, pg);
                migrateSales(h2, pg);
                migrateSaleItems(h2, pg);
                migrateReceipts(h2, pg);
                migrateStockMovements(h2, pg);
                migrateSyncLogs(h2, pg);
                migrateSyncConflicts(h2, pg);

                fixSequences(pg);
                enableConstraints(pg);
                pg.commit();
                System.out.println("✅ Migration H2 -> PostgreSQL terminée.");
            } catch (Exception e) {
                pg.rollback();
                throw e;
            }
        }
    }

    private static void migrateUsers(Connection h2, Connection pg) throws SQLException {
        copy(
                h2,
                pg,
                "SELECT id, username, email, password, first_name, last_name, preferred_language, preferred_currency, created_at, updated_at, enabled FROM users",
                "INSERT INTO users(id, username, email, password, first_name, last_name, preferred_language, preferred_currency, created_at, updated_at, enabled) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                ps -> {
                }
        );
    }

    private static void migrateUserRoles(Connection h2, Connection pg) throws SQLException {
        copy(
                h2,
                pg,
                "SELECT user_id, roles FROM user_roles",
                "INSERT INTO user_roles(user_id, roles) VALUES (?,?)",
                ps -> {
                }
        );
    }

    private static void migrateProducts(Connection h2, Connection pg) throws SQLException {
        copy(
                h2,
                pg,
                "SELECT id, name, description, barcode, purchase_price, selling_price, stock_quantity, min_stock_level, expiry_date, manufacturing_date, category, unit, image_url, is_active, created_at, updated_at, created_by FROM products",
                "INSERT INTO products(id, name, description, barcode, purchase_price, selling_price, stock_quantity, min_stock_level, expiry_date, manufacturing_date, category, unit, image_url, is_active, created_at, updated_at, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                ps -> {
                }
        );
    }

    private static void migrateSales(Connection h2, Connection pg) throws SQLException {
        copy(
                h2,
                pg,
                "SELECT id, sale_number, sale_date, total_amount, discount_amount, tax_amount, final_amount, payment_method, customer_name, customer_phone, customer_email, notes, status, created_at, updated_at, created_by FROM sales",
                "INSERT INTO sales(id, sale_number, sale_date, total_amount, discount_amount, tax_amount, final_amount, payment_method, customer_name, customer_phone, customer_email, notes, status, created_at, updated_at, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                ps -> {
                }
        );
    }

    private static void migrateSaleItems(Connection h2, Connection pg) throws SQLException {
        copy(
                h2,
                pg,
                "SELECT id, sale_id, product_id, quantity, unit_price, discount, subtotal, product_name, product_barcode, product_purchase_price FROM sale_items",
                "INSERT INTO sale_items(id, sale_id, product_id, quantity, unit_price, discount, subtotal, product_name, product_barcode, product_purchase_price) VALUES (?,?,?,?,?,?,?,?,?,?)",
                ps -> {
                }
        );
    }

    private static void migrateReceipts(Connection h2, Connection pg) throws SQLException {
        copy(
                h2,
                pg,
                "SELECT id, receipt_number, user_id, sale_id, total_amount, tax_amount, discount_amount, final_amount, payment_method, status, customer_name, customer_phone, customer_email, company_name, company_address, company_phone, company_email, company_logo_url, notes, qr_code_data, created_at, updated_at, downloaded_at, download_count FROM receipts",
                "INSERT INTO receipts(id, receipt_number, user_id, sale_id, total_amount, tax_amount, discount_amount, final_amount, payment_method, status, customer_name, customer_phone, customer_email, company_name, company_address, company_phone, company_email, company_logo_url, notes, qr_code_data, created_at, updated_at, downloaded_at, download_count) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                ps -> {
                }
        );
    }

    private static void migrateStockMovements(Connection h2, Connection pg) throws SQLException {
        copy(
                h2,
                pg,
                "SELECT id, product_id, quantity, movement_type, reason, created_at, updated_at FROM stock_movements",
                "INSERT INTO stock_movements(id, product_id, quantity, movement_type, reason, created_at, updated_at) VALUES (?,?,?,?,?,?,?)",
                ps -> {
                }
        );
    }

    private static void migrateSyncLogs(Connection h2, Connection pg) throws SQLException {
        copy(
                h2,
                pg,
                "SELECT id, sync_type, device_id, operations_count, success_count, error_count, conflict_count, processing_time_ms, timestamp, app_version, sync_session_id FROM sync_logs",
                "INSERT INTO sync_logs(id, sync_type, device_id, operations_count, success_count, error_count, conflict_count, processing_time_ms, timestamp, app_version, sync_session_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                ps -> {
                }
        );
    }

    private static void migrateSyncConflicts(Connection h2, Connection pg) throws SQLException {
        // Table may not exist in H2 depending on app usage
        if (!tableExists(h2, "SYNC_CONFLICTS")) {
            return;
        }

        copy(
                h2,
                pg,
                "SELECT id, user_id, entity_type, entity_id, local_data, server_data, conflict_type, resolution_strategy, resolved_at, resolved_by, created_at, local_version, server_version, conflict_details FROM sync_conflicts",
                "INSERT INTO sync_conflicts(id, user_id, entity_type, entity_id, local_data, server_data, conflict_type, resolution_strategy, resolved_at, resolved_by, created_at, local_version, server_version, conflict_details) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                ps -> {
                }
        );
    }

    private static void copy(
            Connection from,
            Connection to,
            String selectSql,
            String insertSql,
            ThrowingConsumer<PreparedStatement> binderHook
    ) throws SQLException {
        try (PreparedStatement select = from.prepareStatement(selectSql);
             ResultSet rs = select.executeQuery();
             PreparedStatement insert = to.prepareStatement(insertSql)) {

            ResultSetMetaData md = rs.getMetaData();
            int cols = md.getColumnCount();

            int batch = 0;
            while (rs.next()) {
                for (int i = 1; i <= cols; i++) {
                    Object value = rs.getObject(i);
                    if (value instanceof BigDecimal) {
                        insert.setBigDecimal(i, (BigDecimal) value);
                    } else if (value instanceof Timestamp) {
                        insert.setTimestamp(i, (Timestamp) value);
                    } else if (value instanceof Date) {
                        insert.setDate(i, (Date) value);
                    } else {
                        insert.setObject(i, value);
                    }
                }
                binderHook.accept(insert);
                insert.addBatch();
                batch++;

                if (batch >= 500) {
                    insert.executeBatch();
                    batch = 0;
                }
            }

            if (batch > 0) {
                insert.executeBatch();
            }
        }
    }

    private static void disableConstraints(Connection pg) throws SQLException {
        // speed up + allow inserts order flexibility
        try (Statement st = pg.createStatement()) {
            st.execute("SET session_replication_role = 'replica'");
        }
    }

    private static void enableConstraints(Connection pg) throws SQLException {
        try (Statement st = pg.createStatement()) {
            st.execute("SET session_replication_role = 'origin'");
        }
    }

    private static void fixSequences(Connection pg) throws SQLException {
        // Ensure sequences are after max(id) for BIGSERIAL tables
        List<String> tables = List.of(
                "users",
                "products",
                "sales",
                "sale_items",
                "receipts",
                "stock_movements",
                "sync_logs",
                "sync_conflicts"
        );

        try (Statement st = pg.createStatement()) {
            for (String table : tables) {
                try (ResultSet rs = st.executeQuery("SELECT COALESCE(MAX(id), 0) FROM " + table)) {
                    rs.next();
                    long maxId = rs.getLong(1);
                    // sequence name default: <table>_id_seq
                    st.execute("SELECT setval('" + table + "_id_seq', " + Math.max(maxId, 1) + ", true)");
                } catch (SQLException ignored) {
                    // table/sequence may not exist depending on modules
                }
            }
        }
    }

    private static boolean tableExists(Connection conn, String tableNameUpper) throws SQLException {
        DatabaseMetaData meta = conn.getMetaData();
        try (ResultSet rs = meta.getTables(null, null, tableNameUpper, new String[]{"TABLE"})) {
            return rs.next();
        }
    }

    private static String env(String key) {
        String v = System.getenv(key);
        if (v == null || v.isBlank()) {
            throw new IllegalArgumentException("Missing environment variable: " + key);
        }
        return v;
    }

    private static String envDefault(String key, String def) {
        String v = System.getenv(key);
        return (v == null || v.isBlank()) ? def : v;
    }

    @FunctionalInterface
    private interface ThrowingConsumer<T> {
        void accept(T value) throws SQLException;
    }
}

