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
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // Find by barcode
    Optional<Product> findByBarcodeAndOrganisation_Id(String barcode, java.util.UUID organisationId);

    Optional<Product> findByBarcodeAndOrganisation_IdAndIsActiveTrue(String barcode, UUID organisationId);

    @Query("""
            SELECT p FROM Product p
            LEFT JOIN FETCH p.createdBy
            WHERE p.organisation.id = :organisationId
              AND p.barcode = :barcode
              AND p.isActive = true
            """)
    Optional<Product> findByBarcodeAndOrganisation_IdAndIsActiveTrueWithDetails(
            @Param("barcode") String barcode,
            @Param("organisationId") UUID organisationId);

    // Find active products
    List<Product> findByIsActiveTrue();

    Page<Product> findByIsActiveTrue(Pageable pageable);
    Page<Product> findByOrganisation_IdAndIsActiveTrue(java.util.UUID organisationId, Pageable pageable);

    // Find by category
    List<Product> findByCategoryAndIsActiveTrue(String category);

    Page<Product> findByOrganisation_IdAndCategoryAndIsActiveTrue(java.util.UUID organisationId, String category, Pageable pageable);

    // Search by name or description
    @Query("SELECT p FROM Product p WHERE p.organisation.id = :organisationId AND p.isActive = true AND " +
            "(LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(p.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Product> searchByNameOrDescription(@Param("organisationId") java.util.UUID organisationId,
                                            @Param("searchTerm") String searchTerm,
                                            Pageable pageable);

    // Find low stock products
    @Query("SELECT p FROM Product p WHERE p.organisation.id = :organisationId AND p.isActive = true AND p.stockQuantity <= p.minStockLevel")
    List<Product> findLowStockProducts(@Param("organisationId") java.util.UUID organisationId);

    // Find expiring products
    @Query("SELECT p FROM Product p WHERE p.organisation.id = :organisationId AND p.isActive = true AND p.expiryDate IS NOT NULL AND p.expiryDate <= :date")
    List<Product> findExpiringProducts(@Param("organisationId") java.util.UUID organisationId, @Param("date") LocalDate date);

    // Find expired products
    @Query("SELECT p FROM Product p WHERE p.organisation.id = :organisationId AND p.isActive = true AND p.expiryDate IS NOT NULL AND p.expiryDate < :currentDate")
    List<Product> findExpiredProducts(@Param("organisationId") java.util.UUID organisationId, @Param("currentDate") LocalDate currentDate);

    // Find products by price range
    @Query("SELECT p FROM Product p WHERE p.organisation.id = :organisationId AND p.isActive = true AND p.sellingPrice BETWEEN :minPrice AND :maxPrice")
    Page<Product> findByPriceRange(@Param("organisationId") java.util.UUID organisationId,
            @Param("minPrice") java.math.BigDecimal minPrice,
            @Param("maxPrice") java.math.BigDecimal maxPrice,
            Pageable pageable);

    // Get all categories
    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.organisation.id = :organisationId AND p.isActive = true AND p.category IS NOT NULL ORDER BY p.category")
    List<String> findAllCategories(@Param("organisationId") java.util.UUID organisationId);

    // Count products by category
    @Query("SELECT COUNT(p) FROM Product p WHERE p.organisation.id = :organisationId AND p.isActive = true AND p.category = :category")
    Long countByCategory(@Param("organisationId") java.util.UUID organisationId, @Param("category") String category);

    // Check if barcode exists (excluding current product)
    @Query("SELECT COUNT(p) > 0 FROM Product p WHERE p.organisation.id = :organisationId AND p.barcode = :barcode AND p.id != :productId AND p.isActive = true")
    boolean existsByBarcodeAndIdNot(@Param("organisationId") java.util.UUID organisationId, @Param("barcode") String barcode, @Param("productId") Long productId);

    // Check if barcode exists
    boolean existsByBarcodeAndOrganisation_Id(String barcode, java.util.UUID organisationId);

    Optional<Product> findByIdAndOrganisation_Id(Long id, java.util.UUID organisationId);

    // Find products updated after a specific timestamp (for sync)
    List<Product> findByUpdatedAtAfter(LocalDateTime timestamp);
    List<Product> findByOrganisation_IdAndUpdatedAtAfter(UUID organisationId, LocalDateTime timestamp);
}
