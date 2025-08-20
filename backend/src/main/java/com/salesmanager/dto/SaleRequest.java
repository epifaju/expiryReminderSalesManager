package com.salesmanager.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.salesmanager.entity.Sale;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class SaleRequest {
    
    @NotNull(message = "Sale date is required")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime saleDate;
    
    private BigDecimal discountAmount = BigDecimal.ZERO;
    
    private BigDecimal taxAmount = BigDecimal.ZERO;
    
    @NotNull(message = "Payment method is required")
    private Sale.PaymentMethod paymentMethod;
    
    private String customerName;
    
    private String customerPhone;
    
    private String customerEmail;
    
    private String notes;
    
    @NotEmpty(message = "Sale items are required")
    @Valid
    private List<SaleItemRequest> saleItems;
    
    // Constructors
    public SaleRequest() {}
    
    public SaleRequest(LocalDateTime saleDate, Sale.PaymentMethod paymentMethod, List<SaleItemRequest> saleItems) {
        this.saleDate = saleDate;
        this.paymentMethod = paymentMethod;
        this.saleItems = saleItems;
    }
    
    // Getters and Setters
    public LocalDateTime getSaleDate() {
        return saleDate;
    }
    
    public void setSaleDate(LocalDateTime saleDate) {
        this.saleDate = saleDate;
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
    
    public List<SaleItemRequest> getSaleItems() {
        return saleItems;
    }
    
    public void setSaleItems(List<SaleItemRequest> saleItems) {
        this.saleItems = saleItems;
    }
}
