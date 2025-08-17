package com.salesmanager.repository;

import com.salesmanager.entity.Product;
import com.salesmanager.entity.Sale;
import com.salesmanager.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {
    
    List<SaleItem> findBySale(Sale sale);
    
    List<SaleItem> findByProduct(Product product);
    
    List<SaleItem> findBySaleId(Long saleId);
    
    List<SaleItem> findByProductId(Long productId);
    
    // Analytics queries
    @Query("SELECT SUM(si.quantity) FROM SaleItem si WHERE si.product = :product AND si.sale.saleDate BETWEEN :startDate AND :endDate")
    Integer getTotalQuantitySoldForProduct(@Param("product") Product product, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT SUM(si.subtotal) FROM SaleItem si WHERE si.product = :product AND si.sale.saleDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalRevenueForProduct(@Param("product") Product product, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT si.product, SUM(si.quantity) FROM SaleItem si WHERE si.sale.saleDate BETWEEN :startDate AND :endDate GROUP BY si.product ORDER BY SUM(si.quantity) DESC")
    List<Object[]> getTopSellingProducts(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT si.product, SUM(si.subtotal) FROM SaleItem si WHERE si.sale.saleDate BETWEEN :startDate AND :endDate GROUP BY si.product ORDER BY SUM(si.subtotal) DESC")
    List<Object[]> getTopRevenueProducts(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT si.productName, SUM(si.quantity), SUM(si.subtotal) FROM SaleItem si WHERE si.sale.saleDate BETWEEN :startDate AND :endDate GROUP BY si.productName ORDER BY SUM(si.quantity) DESC")
    List<Object[]> getProductSalesStats(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT AVG(si.unitPrice) FROM SaleItem si WHERE si.product = :product AND si.sale.saleDate BETWEEN :startDate AND :endDate")
    BigDecimal getAverageSellingPriceForProduct(@Param("product") Product product, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT SUM(si.quantity * si.productPurchasePrice) FROM SaleItem si WHERE si.sale.saleDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalCostOfGoodsSold(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT SUM(si.subtotal - (si.quantity * si.productPurchasePrice)) FROM SaleItem si WHERE si.sale.saleDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalGrossProfit(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Low stock alerts based on sales velocity
    @Query("SELECT si.product, AVG(si.quantity) FROM SaleItem si WHERE si.sale.saleDate >= :startDate GROUP BY si.product")
    List<Object[]> getAverageDailySales(@Param("startDate") LocalDateTime startDate);
    
    // Product performance
    @Query("SELECT si.product, COUNT(DISTINCT si.sale) FROM SaleItem si WHERE si.sale.saleDate BETWEEN :startDate AND :endDate GROUP BY si.product")
    List<Object[]> getProductFrequency(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
