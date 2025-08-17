package com.salesmanager.service;

import com.salesmanager.dto.*;
import com.salesmanager.entity.*;
import com.salesmanager.exception.ProductNotFoundException;
import com.salesmanager.repository.ProductRepository;
import com.salesmanager.repository.SaleRepository;
import com.salesmanager.repository.SaleItemRepository;
import com.salesmanager.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class SaleService {
    
    @Autowired
    private SaleRepository saleRepository;
    
    @Autowired
    private SaleItemRepository saleItemRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    public SaleResponse createSale(SaleRequest saleRequest) {
        // Get current user
        User currentUser = getCurrentUser();
        
        // Create sale entity
        Sale sale = new Sale();
        sale.setSaleDate(saleRequest.getSaleDate());
        sale.setDiscountAmount(saleRequest.getDiscountAmount());
        sale.setTaxAmount(saleRequest.getTaxAmount());
        sale.setPaymentMethod(saleRequest.getPaymentMethod());
        sale.setCustomerName(saleRequest.getCustomerName());
        sale.setCustomerPhone(saleRequest.getCustomerPhone());
        sale.setCustomerEmail(saleRequest.getCustomerEmail());
        sale.setNotes(saleRequest.getNotes());
        sale.setCreatedBy(currentUser);
        sale.setStatus(Sale.SaleStatus.COMPLETED);
        
        // Process sale items
        for (SaleItemRequest itemRequest : saleRequest.getSaleItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                .orElseThrow(() -> new ProductNotFoundException("Product not found with id: " + itemRequest.getProductId()));
            
            // Check stock availability
            if (product.getStockQuantity() < itemRequest.getQuantity()) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName() + 
                    ". Available: " + product.getStockQuantity() + ", Requested: " + itemRequest.getQuantity());
            }
            
            // Create sale item
            SaleItem saleItem = new SaleItem();
            saleItem.setProduct(product);
            saleItem.setQuantity(itemRequest.getQuantity());
            saleItem.setUnitPrice(itemRequest.getUnitPrice());
            saleItem.setDiscount(itemRequest.getDiscount());
            
            // Update product stock
            product.setStockQuantity(product.getStockQuantity() - itemRequest.getQuantity());
            productRepository.save(product);
            
            sale.addSaleItem(saleItem);
        }
        
        // Calculate totals
        sale.calculateTotals();
        
        // Save sale
        Sale savedSale = saleRepository.save(sale);
        
        return convertToResponse(savedSale);
    }
    
    public SaleResponse getSaleById(Long id) {
        Sale sale = saleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Sale not found with id: " + id));
        return convertToResponse(sale);
    }
    
    public SaleResponse getSaleBySaleNumber(String saleNumber) {
        Sale sale = saleRepository.findBySaleNumber(saleNumber)
            .orElseThrow(() -> new RuntimeException("Sale not found with number: " + saleNumber));
        return convertToResponse(sale);
    }
    
    public Page<SaleResponse> getAllSales(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Sale> sales = saleRepository.findAll(pageable);
        
        return sales.map(this::convertToResponse);
    }
    
    public Page<SaleResponse> getSalesByDateRange(LocalDateTime startDate, LocalDateTime endDate, 
                                                  int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Sale> sales = saleRepository.findBySaleDateBetween(startDate, endDate, pageable);
        
        return sales.map(this::convertToResponse);
    }
    
    public Page<SaleResponse> getSalesByUser(int page, int size, String sortBy, String sortDir) {
        User currentUser = getCurrentUser();
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Sale> sales = saleRepository.findByCreatedBy(currentUser, pageable);
        
        return sales.map(this::convertToResponse);
    }
    
    public List<SaleResponse> getRecentSales(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<Sale> sales = saleRepository.findRecentSales(pageable);
        
        return sales.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    public SaleResponse updateSaleStatus(Long id, Sale.SaleStatus status) {
        Sale sale = saleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Sale not found with id: " + id));
        
        // If cancelling or refunding, restore stock
        if ((status == Sale.SaleStatus.CANCELLED || status == Sale.SaleStatus.REFUNDED) 
            && sale.getStatus() == Sale.SaleStatus.COMPLETED) {
            restoreStock(sale);
        }
        
        sale.setStatus(status);
        Sale updatedSale = saleRepository.save(sale);
        
        return convertToResponse(updatedSale);
    }
    
    public void deleteSale(Long id) {
        Sale sale = saleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Sale not found with id: " + id));
        
        // Restore stock if sale was completed
        if (sale.getStatus() == Sale.SaleStatus.COMPLETED) {
            restoreStock(sale);
        }
        
        saleRepository.delete(sale);
    }
    
    // Analytics methods
    public BigDecimal getTotalSalesAmount(LocalDateTime startDate, LocalDateTime endDate) {
        BigDecimal total = saleRepository.getTotalSalesAmount(startDate, endDate);
        return total != null ? total : BigDecimal.ZERO;
    }
    
    public Long getTotalSalesCount(LocalDateTime startDate, LocalDateTime endDate) {
        Long count = saleRepository.getTotalSalesCount(startDate, endDate);
        return count != null ? count : 0L;
    }
    
    public BigDecimal getAverageSaleAmount(LocalDateTime startDate, LocalDateTime endDate) {
        BigDecimal average = saleRepository.getAverageSaleAmount(startDate, endDate);
        return average != null ? average : BigDecimal.ZERO;
    }
    
    public List<Object[]> getPaymentMethodStats(LocalDateTime startDate, LocalDateTime endDate) {
        return saleRepository.getPaymentMethodStats(startDate, endDate);
    }
    
    public List<Object[]> getDailySalesStats(LocalDateTime startDate, LocalDateTime endDate) {
        return saleRepository.getDailySalesStats(startDate, endDate);
    }
    
    public List<Object[]> getMonthlySalesStats(LocalDateTime startDate, LocalDateTime endDate) {
        return saleRepository.getMonthlySalesStats(startDate, endDate);
    }
    
    public List<Object[]> getTopCustomers(LocalDateTime startDate, LocalDateTime endDate, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return saleRepository.getTopCustomers(startDate, endDate, pageable);
    }
    
    // Helper methods
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        User user = new User();
        user.setId(userDetails.getId());
        user.setUsername(userDetails.getUsername());
        user.setEmail(userDetails.getEmail());
        
        return user;
    }
    
    private void restoreStock(Sale sale) {
        for (SaleItem saleItem : sale.getSaleItems()) {
            Product product = saleItem.getProduct();
            if (product != null) {
                product.setStockQuantity(product.getStockQuantity() + saleItem.getQuantity());
                productRepository.save(product);
            }
        }
    }
    
    private SaleResponse convertToResponse(Sale sale) {
        SaleResponse response = new SaleResponse(sale);
        
        // Convert sale items
        List<SaleItemResponse> saleItemResponses = sale.getSaleItems().stream()
            .map(SaleItemResponse::new)
            .collect(Collectors.toList());
        
        response.setSaleItems(saleItemResponses);
        
        return response;
    }
}
