package com.salesmanager.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ProductRequest {
    
    @NotBlank(message = "Le nom du produit est obligatoire")
    @Size(max = 100, message = "Le nom ne peut pas dépasser 100 caractères")
    private String name;
    
    @Size(max = 500, message = "La description ne peut pas dépasser 500 caractères")
    private String description;
    
    private String barcode;
    
    @NotNull(message = "Le prix d'achat est obligatoire")
    @DecimalMin(value = "0.01", message = "Le prix d'achat doit être supérieur à 0")
    private BigDecimal purchasePrice;
    
    @NotNull(message = "Le prix de vente est obligatoire")
    @DecimalMin(value = "0.01", message = "Le prix de vente doit être supérieur à 0")
    private BigDecimal sellingPrice;
    
    @NotNull(message = "La quantité en stock est obligatoire")
    private Integer stockQuantity = 0;
    
    @NotNull(message = "Le niveau de stock minimum est obligatoire")
    private Integer minStockLevel = 5;
    
    private LocalDate expiryDate;
    
    private LocalDate manufacturingDate;
    
    @Size(max = 50, message = "La catégorie ne peut pas dépasser 50 caractères")
    private String category;
    
    @Size(max = 20, message = "L'unité ne peut pas dépasser 20 caractères")
    private String unit = "pcs";
    
    private String imageUrl;
    
    private Boolean isActive = true;
    
    // Constructors
    public ProductRequest() {}
    
    public ProductRequest(String name, String description, String barcode, 
                         BigDecimal purchasePrice, BigDecimal sellingPrice, 
                         Integer stockQuantity, Integer minStockLevel, 
                         LocalDate expiryDate, LocalDate manufacturingDate, 
                         String category, String unit, String imageUrl, Boolean isActive) {
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
    }
    
    // Getters and Setters
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
}
