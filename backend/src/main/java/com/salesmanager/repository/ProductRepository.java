package com.salesmanager.repository;

import com.salesmanager.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // Find by barcode
    Optional<Product> findByBarcode(String barcode);

    // Find active products
    List<Product> findByIsActiveTrue();

    Page<Product> findByIsActiveTrue(Pageable pageable);

    // Find by category
    List<Product> findByCategoryAndIsActiveTrue(String category);

    Page<Product> findByCategoryAndIsActiveTrue(String category, Pageable pageable);

    // Search by name or description
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND " +
            "(LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(p.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Product> searchByNameOrDescription(@Param("searchTerm") String searchTerm, Pageable pageable);

    // Find low stock products
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.stockQuantity <= p.minStockLevel")
    List<Product> findLowStockProducts();

    // Find expiring products
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.expiryDate IS NOT NULL AND p.expiryDate <= :date")
    List<Product> findExpiringProducts(@Param("date") LocalDate date);

    // Find expired products
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.expiryDate IS NOT NULL AND p.expiryDate < :currentDate")
    List<Product> findExpiredProducts(@Param("currentDate") LocalDate currentDate);

    // Find products by price range
    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.sellingPrice BETWEEN :minPrice AND :maxPrice")
    Page<Product> findByPriceRange(@Param("minPrice") java.math.BigDecimal minPrice,
            @Param("maxPrice") java.math.BigDecimal maxPrice,
            Pageable pageable);

    // Get all categories
    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.isActive = true AND p.category IS NOT NULL ORDER BY p.category")
    List<String> findAllCategories();

    // Count products by category
    @Query("SELECT COUNT(p) FROM Product p WHERE p.isActive = true AND p.category = :category")
    Long countByCategory(@Param("category") String category);

    // Check if barcode exists (excluding current product)
    @Query("SELECT COUNT(p) > 0 FROM Product p WHERE p.barcode = :barcode AND p.id != :productId")
    boolean existsByBarcodeAndIdNot(@Param("barcode") String barcode, @Param("productId") Long productId);

    // Check if barcode exists
    boolean existsByBarcode(String barcode);

    // Find products updated after a specific timestamp (for sync)
    List<Product> findByUpdatedAtAfter(LocalDateTime timestamp);
}
