package com.salesmanager.dto;

import com.salesmanager.entity.SaleItem;

import java.math.BigDecimal;

public class SaleItemResponse {
    
    private Long id;
    private Long productId;
    private String productName;
    private String productBarcode;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal discount;
    private BigDecimal subtotal;
    private BigDecimal productPurchasePrice;
    private BigDecimal profit;
    private BigDecimal profitMargin;
    
    // Constructors
    public SaleItemResponse() {}
    
    public SaleItemResponse(SaleItem saleItem) {
        this.id = saleItem.getId();
        this.productId = saleItem.getProduct() != null ? saleItem.getProduct().getId() : null;
        this.productName = saleItem.getProductName();
        this.productBarcode = saleItem.getProductBarcode();
        this.quantity = saleItem.getQuantity();
        this.unitPrice = saleItem.getUnitPrice();
        this.discount = saleItem.getDiscount();
        this.subtotal = saleItem.getSubtotal();
        this.productPurchasePrice = saleItem.getProductPurchasePrice();
        this.profit = saleItem.getProfit();
        this.profitMargin = saleItem.getProfitMargin();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getProductId() {
        return productId;
    }
    
    public void setProductId(Long productId) {
        this.productId = productId;
    }
    
    public String getProductName() {
        return productName;
    }
    
    public void setProductName(String productName) {
        this.productName = productName;
    }
    
    public String getProductBarcode() {
        return productBarcode;
    }
    
    public void setProductBarcode(String productBarcode) {
        this.productBarcode = productBarcode;
    }
    
    public Integer getQuantity() {
        return quantity;
    }
    
    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
    
    public BigDecimal getUnitPrice() {
        return unitPrice;
    }
    
    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }
    
    public BigDecimal getDiscount() {
        return discount;
    }
    
    public void setDiscount(BigDecimal discount) {
        this.discount = discount;
    }
    
    public BigDecimal getSubtotal() {
        return subtotal;
    }
    
    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }
    
    public BigDecimal getProductPurchasePrice() {
        return productPurchasePrice;
    }
    
    public void setProductPurchasePrice(BigDecimal productPurchasePrice) {
        this.productPurchasePrice = productPurchasePrice;
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
