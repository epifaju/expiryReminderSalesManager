package com.salesmanager.repository;

import com.salesmanager.entity.Sale;
import com.salesmanager.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {

    Optional<Sale> findBySaleNumber(String saleNumber);

    List<Sale> findByCreatedBy(User user);

    Page<Sale> findByCreatedBy(User user, Pageable pageable);
    Page<Sale> findByOrganisation_Id(java.util.UUID organisationId, Pageable pageable);
    Optional<Sale> findByIdAndOrganisation_Id(Long id, java.util.UUID organisationId);
    Optional<Sale> findByIdAndOrganisation_IdAndStore_Id(Long id, UUID organisationId, UUID storeId);

    List<Sale> findBySaleDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    Page<Sale> findBySaleDateBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    List<Sale> findByCreatedByAndSaleDateBetween(User user, LocalDateTime startDate, LocalDateTime endDate);

    Page<Sale> findByCreatedByAndSaleDateBetween(User user, LocalDateTime startDate, LocalDateTime endDate,
            Pageable pageable);

    List<Sale> findByStatus(Sale.SaleStatus status);

    List<Sale> findByPaymentMethod(Sale.PaymentMethod paymentMethod);

    @Query("SELECT s FROM Sale s WHERE s.customerName LIKE %:customerName%")
    List<Sale> findByCustomerNameContaining(@Param("customerName") String customerName);

    @Query("SELECT s FROM Sale s WHERE s.customerPhone = :phone")
    List<Sale> findByCustomerPhone(@Param("phone") String phone);

    // Sales analytics queries
    @Query("SELECT SUM(s.finalAmount) FROM Sale s WHERE s.organisation.id = :organisationId AND s.saleDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalSalesAmount(@Param("organisationId") java.util.UUID organisationId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT SUM(s.finalAmount) FROM Sale s WHERE s.organisation.id = :organisationId AND s.store.id = :storeId AND s.saleDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalSalesAmountByStore(@Param("organisationId") UUID organisationId,
            @Param("storeId") UUID storeId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT SUM(s.finalAmount) FROM Sale s WHERE s.createdBy = :user AND s.saleDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalSalesAmountByUser(@Param("user") User user, @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.organisation.id = :organisationId AND s.saleDate BETWEEN :startDate AND :endDate")
    Long getTotalSalesCount(@Param("organisationId") java.util.UUID organisationId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.organisation.id = :organisationId AND s.store.id = :storeId AND s.saleDate BETWEEN :startDate AND :endDate")
    Long getTotalSalesCountByStore(@Param("organisationId") UUID organisationId,
            @Param("storeId") UUID storeId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.createdBy = :user AND s.saleDate BETWEEN :startDate AND :endDate")
    Long getTotalSalesCountByUser(@Param("user") User user, @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT AVG(s.finalAmount) FROM Sale s WHERE s.organisation.id = :organisationId AND s.saleDate BETWEEN :startDate AND :endDate")
    BigDecimal getAverageSaleAmount(@Param("organisationId") java.util.UUID organisationId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT AVG(s.finalAmount) FROM Sale s WHERE s.organisation.id = :organisationId AND s.store.id = :storeId AND s.saleDate BETWEEN :startDate AND :endDate")
    BigDecimal getAverageSaleAmountByStore(@Param("organisationId") UUID organisationId,
            @Param("storeId") UUID storeId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT s.paymentMethod, COUNT(s) FROM Sale s WHERE s.organisation.id = :organisationId AND s.saleDate BETWEEN :startDate AND :endDate GROUP BY s.paymentMethod")
    List<Object[]> getPaymentMethodStats(@Param("organisationId") java.util.UUID organisationId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT s.paymentMethod, COUNT(s) FROM Sale s WHERE s.organisation.id = :organisationId AND s.store.id = :storeId AND s.saleDate BETWEEN :startDate AND :endDate GROUP BY s.paymentMethod")
    List<Object[]> getPaymentMethodStatsByStore(@Param("organisationId") UUID organisationId,
            @Param("storeId") UUID storeId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT DATE(s.saleDate), SUM(s.finalAmount), COUNT(s) FROM Sale s WHERE s.organisation.id = :organisationId AND s.saleDate BETWEEN :startDate AND :endDate GROUP BY DATE(s.saleDate) ORDER BY DATE(s.saleDate)")
    List<Object[]> getDailySalesStats(@Param("organisationId") java.util.UUID organisationId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT DATE(s.saleDate), SUM(s.finalAmount), COUNT(s) FROM Sale s WHERE s.organisation.id = :organisationId AND s.store.id = :storeId AND s.saleDate BETWEEN :startDate AND :endDate GROUP BY DATE(s.saleDate) ORDER BY DATE(s.saleDate)")
    List<Object[]> getDailySalesStatsByStore(@Param("organisationId") UUID organisationId,
            @Param("storeId") UUID storeId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT YEAR(s.saleDate), MONTH(s.saleDate), SUM(s.finalAmount), COUNT(s) FROM Sale s WHERE s.organisation.id = :organisationId AND s.saleDate BETWEEN :startDate AND :endDate GROUP BY YEAR(s.saleDate), MONTH(s.saleDate) ORDER BY YEAR(s.saleDate), MONTH(s.saleDate)")
    List<Object[]> getMonthlySalesStats(@Param("organisationId") java.util.UUID organisationId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT YEAR(s.saleDate), MONTH(s.saleDate), SUM(s.finalAmount), COUNT(s) FROM Sale s WHERE s.organisation.id = :organisationId AND s.store.id = :storeId AND s.saleDate BETWEEN :startDate AND :endDate GROUP BY YEAR(s.saleDate), MONTH(s.saleDate) ORDER BY YEAR(s.saleDate), MONTH(s.saleDate)")
    List<Object[]> getMonthlySalesStatsByStore(@Param("organisationId") UUID organisationId,
            @Param("storeId") UUID storeId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Top customers
    @Query("SELECT s.customerName, s.customerPhone, SUM(s.finalAmount), COUNT(s) FROM Sale s WHERE s.organisation.id = :organisationId AND s.customerName IS NOT NULL AND s.saleDate BETWEEN :startDate AND :endDate GROUP BY s.customerName, s.customerPhone ORDER BY SUM(s.finalAmount) DESC")
    List<Object[]> getTopCustomers(@Param("organisationId") java.util.UUID organisationId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    @Query("SELECT s.customerName, s.customerPhone, SUM(s.finalAmount), COUNT(s) FROM Sale s WHERE s.organisation.id = :organisationId AND s.store.id = :storeId AND s.customerName IS NOT NULL AND s.saleDate BETWEEN :startDate AND :endDate GROUP BY s.customerName, s.customerPhone ORDER BY SUM(s.finalAmount) DESC")
    List<Object[]> getTopCustomersByStore(@Param("organisationId") UUID organisationId,
            @Param("storeId") UUID storeId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    // Recent sales
    @Query("SELECT s FROM Sale s ORDER BY s.saleDate DESC")
    List<Sale> findRecentSales(Pageable pageable);

    @Query("SELECT s FROM Sale s WHERE s.createdBy = :user ORDER BY s.saleDate DESC")
    List<Sale> findRecentSalesByUser(@Param("user") User user, Pageable pageable);

    // Find sales updated after a specific timestamp (for sync)
    List<Sale> findByUpdatedAtAfter(LocalDateTime timestamp);
    List<Sale> findByOrganisation_IdAndUpdatedAtAfter(UUID organisationId, LocalDateTime timestamp);
    List<Sale> findByOrganisation_IdAndStore_IdAndUpdatedAtAfter(UUID organisationId, UUID storeId, LocalDateTime timestamp);
}
