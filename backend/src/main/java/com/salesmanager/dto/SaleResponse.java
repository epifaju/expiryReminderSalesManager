package com.salesmanager.dto;

import com.salesmanager.entity.Sale;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class SaleResponse {
    
    private Long id;
    private String saleNumber;
    private LocalDateTime saleDate;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal finalAmount;
    private Sale.PaymentMethod paymentMethod;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String notes;
    private Sale.SaleStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdByUsername;
    private List<SaleItemResponse> saleItems;
    private BigDecimal totalProfit;
    private Integer totalQuantity;
    
    // Constructors
    public SaleResponse() {}
    
    public SaleResponse(Sale sale) {
        this.id = sale.getId();
        this.saleNumber = sale.getSaleNumber();
        this.saleDate = sale.getSaleDate();
        this.totalAmount = sale.getTotalAmount();
        this.discountAmount = sale.getDiscountAmount();
        this.taxAmount = sale.getTaxAmount();
        this.finalAmount = sale.getFinalAmount();
        this.paymentMethod = sale.getPaymentMethod();
        this.customerName = sale.getCustomerName();
        this.customerPhone = sale.getCustomerPhone();
        this.customerEmail = sale.getCustomerEmail();
        this.notes = sale.getNotes();
        this.status = sale.getStatus();
        this.createdAt = sale.getCreatedAt();
        this.updatedAt = sale.getUpdatedAt();
        this.createdByUsername = sale.getCreatedBy() != null ? sale.getCreatedBy().getUsername() : null;
        this.totalProfit = sale.getTotalProfit();
        this.totalQuantity = sale.getTotalQuantity();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getSaleNumber() {
        return saleNumber;
    }
    
    public void setSaleNumber(String saleNumber) {
        this.saleNumber = saleNumber;
    }
    
    public LocalDateTime getSaleDate() {
        return saleDate;
    }
    
    public void setSaleDate(LocalDateTime saleDate) {
        this.saleDate = saleDate;
    }
    
    public BigDecimal getTotalAmount() {
        return totalAmount;
    }
    
    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }
    
    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }
    
    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }
    
    public BigDecimal getTaxAmount() {
        return taxAmount;
    }
    
    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }
    
    public BigDecimal getFinalAmount() {
        return finalAmount;
    }
    
    public void setFinalAmount(BigDecimal finalAmount) {
        this.finalAmount = finalAmount;
    }
    
    public Sale.PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }
    
    public void setPaymentMethod(Sale.PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
    
    public String getCustomerName() {
        return customerName;
    }
    
    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }
    
    public String getCustomerPhone() {
        return customerPhone;
    }
    
    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }
    
    public String getCustomerEmail() {
        return customerEmail;
    }
    
    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public Sale.SaleStatus getStatus() {
        return status;
    }
    
    public void setStatus(Sale.SaleStatus status) {
        this.status = status;
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
    
    public List<SaleItemResponse> getSaleItems() {
        return saleItems;
    }
    
    public void setSaleItems(List<SaleItemResponse> saleItems) {
        this.saleItems = saleItems;
    }
    
    public BigDecimal getTotalProfit() {
        return totalProfit;
    }
    
    public void setTotalProfit(BigDecimal totalProfit) {
        this.totalProfit = totalProfit;
    }
    
    public Integer getTotalQuantity() {
        return totalQuantity;
    }
    
    public void setTotalQuantity(Integer totalQuantity) {
        this.totalQuantity = totalQuantity;
    }
}
