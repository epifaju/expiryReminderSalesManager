package com.salesmanager.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

@Entity
@Table(name = "sale_items")
public class SaleItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @NotNull
    @Min(1)
    private Integer quantity;
    
    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    @Column(name = "unit_price", precision = 10, scale = 2)
    private BigDecimal unitPrice;
    
    @NotNull
    @DecimalMin(value = "0.0")
    @Column(name = "discount", precision = 10, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;
    
    @NotNull
    @Column(name = "subtotal", precision = 10, scale = 2)
    private BigDecimal subtotal;
    
    // Store product details at time of sale for historical accuracy
    @Column(name = "product_name")
    private String productName;
    
    @Column(name = "product_barcode")
    private String productBarcode;
    
    @Column(name = "product_purchase_price", precision = 10, scale = 2)
    private BigDecimal productPurchasePrice;
    
    @PrePersist
    @PreUpdate
    protected void calculateSubtotal() {
        if (unitPrice != null && quantity != null) {
            // Ensure discount is not null
            BigDecimal discountAmount = (discount != null) ? discount : BigDecimal.ZERO;
            subtotal = unitPrice.multiply(BigDecimal.valueOf(quantity)).subtract(discountAmount);
        }
        
        // Store product details for historical accuracy
        if (product != null) {
            productName = product.getName();
            productBarcode = product.getBarcode();
            productPurchasePrice = product.getPurchasePrice();
        }
    }
    
    // Business methods
    public BigDecimal getProfit() {
        if (productPurchasePrice == null) return BigDecimal.ZERO;
        BigDecimal totalCost = productPurchasePrice.multiply(BigDecimal.valueOf(quantity));
        return subtotal.subtract(totalCost);
    }
    
    public BigDecimal getProfitMargin() {
        if (subtotal.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return getProfit().divide(subtotal, 4, BigDecimal.ROUND_HALF_UP).multiply(BigDecimal.valueOf(100));
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Sale getSale() {
        return sale;
    }
    
    public void setSale(Sale sale) {
        this.sale = sale;
    }
    
    public Product getProduct() {
        return product;
    }
    
    public void setProduct(Product product) {
        this.product = product;
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
    
    public BigDecimal getProductPurchasePrice() {
        return productPurchasePrice;
    }
    
    public void setProductPurchasePrice(BigDecimal productPurchasePrice) {
        this.productPurchasePrice = productPurchasePrice;
    }
}
