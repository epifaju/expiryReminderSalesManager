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

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {
    
    Optional<Sale> findBySaleNumber(String saleNumber);
    
    List<Sale> findByCreatedBy(User user);
    
    Page<Sale> findByCreatedBy(User user, Pageable pageable);
    
    List<Sale> findBySaleDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    Page<Sale> findBySaleDateBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
    
    List<Sale> findByCreatedByAndSaleDateBetween(User user, LocalDateTime startDate, LocalDateTime endDate);
    
    Page<Sale> findByCreatedByAndSaleDateBetween(User user, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
    
    List<Sale> findByStatus(Sale.SaleStatus status);
    
    List<Sale> findByPaymentMethod(Sale.PaymentMethod paymentMethod);
    
    @Query("SELECT s FROM Sale s WHERE s.customerName LIKE %:customerName%")
    List<Sale> findByCustomerNameContaining(@Param("customerName") String customerName);
    
    @Query("SELECT s FROM Sale s WHERE s.customerPhone = :phone")
    List<Sale> findByCustomerPhone(@Param("phone") String phone);
    
    // Sales analytics queries
    @Query("SELECT SUM(s.finalAmount) FROM Sale s WHERE s.saleDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalSalesAmount(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT SUM(s.finalAmount) FROM Sale s WHERE s.createdBy = :user AND s.saleDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalSalesAmountByUser(@Param("user") User user, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(s) FROM Sale s WHERE s.saleDate BETWEEN :startDate AND :endDate")
    Long getTotalSalesCount(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(s) FROM Sale s WHERE s.createdBy = :user AND s.saleDate BETWEEN :startDate AND :endDate")
    Long getTotalSalesCountByUser(@Param("user") User user, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT AVG(s.finalAmount) FROM Sale s WHERE s.saleDate BETWEEN :startDate AND :endDate")
    BigDecimal getAverageSaleAmount(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT s.paymentMethod, COUNT(s) FROM Sale s WHERE s.saleDate BETWEEN :startDate AND :endDate GROUP BY s.paymentMethod")
    List<Object[]> getPaymentMethodStats(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT DATE(s.saleDate), SUM(s.finalAmount), COUNT(s) FROM Sale s WHERE s.saleDate BETWEEN :startDate AND :endDate GROUP BY DATE(s.saleDate) ORDER BY DATE(s.saleDate)")
    List<Object[]> getDailySalesStats(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT YEAR(s.saleDate), MONTH(s.saleDate), SUM(s.finalAmount), COUNT(s) FROM Sale s WHERE s.saleDate BETWEEN :startDate AND :endDate GROUP BY YEAR(s.saleDate), MONTH(s.saleDate) ORDER BY YEAR(s.saleDate), MONTH(s.saleDate)")
    List<Object[]> getMonthlySalesStats(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Top customers
    @Query("SELECT s.customerName, s.customerPhone, SUM(s.finalAmount), COUNT(s) FROM Sale s WHERE s.customerName IS NOT NULL AND s.saleDate BETWEEN :startDate AND :endDate GROUP BY s.customerName, s.customerPhone ORDER BY SUM(s.finalAmount) DESC")
    List<Object[]> getTopCustomers(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate, Pageable pageable);
    
    // Recent sales
    @Query("SELECT s FROM Sale s ORDER BY s.saleDate DESC")
    List<Sale> findRecentSales(Pageable pageable);
    
    @Query("SELECT s FROM Sale s WHERE s.createdBy = :user ORDER BY s.saleDate DESC")
    List<Sale> findRecentSalesByUser(@Param("user") User user, Pageable pageable);
}
