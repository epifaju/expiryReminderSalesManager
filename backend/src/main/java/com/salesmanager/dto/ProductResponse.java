package com.salesmanager.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ProductResponse {
    
    private Long id;
    private String name;
    private String description;
    private String barcode;
    private BigDecimal purchasePrice;
    private BigDecimal sellingPrice;
    private Integer stockQuantity;
    private Integer minStockLevel;
    private LocalDate expiryDate;
    private LocalDate manufacturingDate;
    private String category;
    private String unit;
    private String imageUrl;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdByUsername;
    
    // Business fields
    private Boolean isLowStock;
    private Boolean isExpiringSoon;
    private Boolean isExpired;
    private BigDecimal profit;
    private BigDecimal profitMargin;
    
    // Constructors
    public ProductResponse() {}
    
    public ProductResponse(Long id, String name, String description, String barcode,
                          BigDecimal purchasePrice, BigDecimal sellingPrice,
                          Integer stockQuantity, Integer minStockLevel,
                          LocalDate expiryDate, LocalDate manufacturingDate,
                          String category, String unit, String imageUrl,
                          Boolean isActive, LocalDateTime createdAt,
                          LocalDateTime updatedAt, String createdByUsername) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.barcode = barcode;
        this.purchasePrice = purchasePrice;
        this.sellingPrice = sellingPrice;
        this.stockQuantity = stockQuantity;
        this.minStockLevel = minStockLevel;
        this.expiryDate = expiryDate;
        this.manufacturingDate = manufacturingDate;
        this.category = category;
        this.unit = unit;
        this.imageUrl = imageUrl;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.createdByUsername = createdByUsername;
        
        // Calculate business fields
        this.isLowStock = stockQuantity <= minStockLevel;
        this.isExpired = expiryDate != null && expiryDate.isBefore(LocalDate.now());
        this.isExpiringSoon = expiryDate != null && expiryDate.isBefore(LocalDate.now().plusDays(7));
        this.profit = sellingPrice.subtract(purchasePrice);
        this.profitMargin = purchasePrice.compareTo(BigDecimal.ZERO) == 0 ? 
            BigDecimal.ZERO : 
            profit.divide(purchasePrice, 4, BigDecimal.ROUND_HALF_UP).multiply(BigDecimal.valueOf(100));
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getBarcode() {
        return barcode;
    }
    
    public void setBarcode(String barcode) {
        this.barcode = barcode;
    }
    
    public BigDecimal getPurchasePrice() {
        return purchasePrice;
    }
    
    public void setPurchasePrice(BigDecimal purchasePrice) {
        this.purchasePrice = purchasePrice;
    }
    
    public BigDecimal getSellingPrice() {
        return sellingPrice;
    }
    
    public void setSellingPrice(BigDecimal sellingPrice) {
        this.sellingPrice = sellingPrice;
    }
    
    public Integer getStockQuantity() {
        return stockQuantity;
    }
    
    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
    }
    
    public Integer getMinStockLevel() {
        return minStockLevel;
    }
    
    public void setMinStockLevel(Integer minStockLevel) {
        this.minStockLevel = minStockLevel;
    }
    
    public LocalDate getExpiryDate() {
        return expiryDate;
    }
    
    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }
    
    public LocalDate getManufacturingDate() {
        return manufacturingDate;
    }
    
    public void setManufacturingDate(LocalDate manufacturingDate) {
        this.manufacturingDate = manufacturingDate;
    }
    
    public String getCategory() {
        return category;
    }
    
    public void setCategory(String category) {
        this.category = category;
    }
    
    public String getUnit() {
        return unit;
    }
    
    public void setUnit(String unit) {
        this.unit = unit;
    }
    
    public String getImageUrl() {
        return imageUrl;
    }
    
    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public String getCreatedByUsername() {
        return createdByUsername;
    }
    
    public void setCreatedByUsername(String createdByUsername) {
        this.createdByUsername = createdByUsername;
    }
    
    public Boolean getIsLowStock() {
        return isLowStock;
    }
    
    public void setIsLowStock(Boolean isLowStock) {
        this.isLowStock = isLowStock;
    }
    
    public Boolean getIsExpiringSoon() {
        return isExpiringSoon;
    }
    
    public void setIsExpiringSoon(Boolean isExpiringSoon) {
        this.isExpiringSoon = isExpiringSoon;
    }
    
    public Boolean getIsExpired() {
        return isExpired;
    }
    
    public void setIsExpired(Boolean isExpired) {
        this.isExpired = isExpired;
    }
    
    public BigDecimal getProfit() {
        return profit;
    }
    
    public void setProfit(BigDecimal profit) {
        this.profit = profit;
    }
    
    public BigDecimal getProfitMargin() {
        return profitMargin;
    }
    
    public void setProfitMargin(BigDecimal profitMargin) {
        this.profitMargin = profitMargin;
    }
}
