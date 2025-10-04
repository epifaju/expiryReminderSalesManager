package com.salesmanager.dto;

import com.salesmanager.entity.Receipt;
import com.salesmanager.entity.Sale;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ReceiptResponse {
    private Long id;
    private String receiptNumber;
    private BigDecimal totalAmount;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private Sale.PaymentMethod paymentMethod;
    private String status;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String companyName;
    private String companyAddress;
    private String companyPhone;
    private String companyEmail;
    private String companyLogoUrl;
    private String notes;
    private String qrCodeData;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime downloadedAt;
    
    private Integer downloadCount;
    
    // Simplified Sale info to avoid infinite recursion
    private Long saleId;
    private String saleNumber;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime saleDate;
    
    // Simplified User info
    private Long userId;
    private String userFirstName;
    private String userLastName;
    private String userEmail;

    // Constructors
    public ReceiptResponse() {}

    public ReceiptResponse(Receipt receipt) {
        this.id = receipt.getId();
        this.receiptNumber = receipt.getReceiptNumber();
        this.totalAmount = receipt.getTotalAmount();
        this.taxAmount = receipt.getTaxAmount();
        this.discountAmount = receipt.getDiscountAmount();
        this.finalAmount = receipt.getFinalAmount();
        this.paymentMethod = receipt.getPaymentMethod();
        this.status = receipt.getStatus() != null ? receipt.getStatus().name() : null;
        this.customerName = receipt.getCustomerName();
        this.customerPhone = receipt.getCustomerPhone();
        this.customerEmail = receipt.getCustomerEmail();
        this.companyName = receipt.getCompanyName();
        this.companyAddress = receipt.getCompanyAddress();
        this.companyPhone = receipt.getCompanyPhone();
        this.companyEmail = receipt.getCompanyEmail();
        this.companyLogoUrl = receipt.getCompanyLogoUrl();
        this.notes = receipt.getNotes();
        this.qrCodeData = receipt.getQrCodeData();
        this.createdAt = receipt.getCreatedAt();
        this.updatedAt = receipt.getUpdatedAt();
        this.downloadedAt = receipt.getDownloadedAt();
        this.downloadCount = receipt.getDownloadCount();
        
        // Populate simplified Sale info
        if (receipt.getSale() != null) {
            this.saleId = receipt.getSale().getId();
            this.saleNumber = receipt.getSale().getSaleNumber();
            this.saleDate = receipt.getSale().getSaleDate();
        }
        
        // Populate simplified User info
        if (receipt.getUser() != null) {
            this.userId = receipt.getUser().getId();
            this.userFirstName = receipt.getUser().getFirstName();
            this.userLastName = receipt.getUser().getLastName();
            this.userEmail = receipt.getUser().getEmail();
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReceiptNumber() {
        return receiptNumber;
    }

    public void setReceiptNumber(String receiptNumber) {
        this.receiptNumber = receiptNumber;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCompanyAddress() {
        return companyAddress;
    }

    public void setCompanyAddress(String companyAddress) {
        this.companyAddress = companyAddress;
    }

    public String getCompanyPhone() {
        return companyPhone;
    }

    public void setCompanyPhone(String companyPhone) {
        this.companyPhone = companyPhone;
    }

    public String getCompanyEmail() {
        return companyEmail;
    }

    public void setCompanyEmail(String companyEmail) {
        this.companyEmail = companyEmail;
    }

    public String getCompanyLogoUrl() {
        return companyLogoUrl;
    }

    public void setCompanyLogoUrl(String companyLogoUrl) {
        this.companyLogoUrl = companyLogoUrl;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getQrCodeData() {
        return qrCodeData;
    }

    public void setQrCodeData(String qrCodeData) {
        this.qrCodeData = qrCodeData;
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

    public LocalDateTime getDownloadedAt() {
        return downloadedAt;
    }

    public void setDownloadedAt(LocalDateTime downloadedAt) {
        this.downloadedAt = downloadedAt;
    }

    public Integer getDownloadCount() {
        return downloadCount;
    }

    public void setDownloadCount(Integer downloadCount) {
        this.downloadCount = downloadCount;
    }

    public Long getSaleId() {
        return saleId;
    }

    public void setSaleId(Long saleId) {
        this.saleId = saleId;
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

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserFirstName() {
        return userFirstName;
    }

    public void setUserFirstName(String userFirstName) {
        this.userFirstName = userFirstName;
    }

    public String getUserLastName() {
        return userLastName;
    }

    public void setUserLastName(String userLastName) {
        this.userLastName = userLastName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }
}
