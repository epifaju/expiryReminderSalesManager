package com.salesmanager.service;

import com.salesmanager.dto.*;
import com.salesmanager.entity.*;
import com.salesmanager.exception.BadRequestException;
import com.salesmanager.exception.NotFoundException;
import com.salesmanager.exception.ProductNotFoundException;
import com.salesmanager.exception.TenantContextMissingException;
import com.salesmanager.repository.ProductRepository;
import com.salesmanager.repository.SaleRepository;
import com.salesmanager.security.UserDetailsImpl;
import com.salesmanager.security.TenantContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
import java.util.UUID;
import java.util.stream.Collectors;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
@Transactional
public class SaleService {
    
    @Autowired
    private SaleRepository saleRepository;
    
    // NOTE: SaleItemRepository non utilisé actuellement (cascade via Sale).
    
    @Autowired
    private ProductRepository productRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${multitenancy.require-tenant-claims:false}")
    private boolean requireTenantClaims;
    
    public SaleResponse createSale(SaleRequest saleRequest) {
        // Get current user
        User currentUser = getCurrentUser();
        UUID organisationId = requireOrganisationId();
        UUID storeId = TenantContext.getStoreId();
        
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
        sale.setOrganisation(entityManager.getReference(Organisation.class, organisationId));
        if (storeId != null) {
            sale.setStore(entityManager.getReference(Store.class, storeId));
        }
        sale.setStatus(Sale.SaleStatus.COMPLETED);
        
        // Process sale items
        for (SaleItemRequest itemRequest : saleRequest.getSaleItems()) {
            Product product = resolveProduct(itemRequest);
            
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

    private Product resolveProduct(SaleItemRequest itemRequest) {
        UUID organisationId = requireOrganisationId();
        Long productId = itemRequest.getProductId();
        if (productId != null) {
            Optional<Product> byId = productRepository.findByIdAndOrganisation_Id(productId, organisationId);
            if (byId.isPresent()) {
                return byId.get();
            }
        }

        String barcode = itemRequest.getBarcode();
        if (barcode != null && !barcode.isBlank()) {
            Optional<Product> byBarcode = productRepository.findByBarcodeAndOrganisation_Id(barcode.trim(), organisationId);
            if (byBarcode.isPresent()) {
                return byBarcode.get();
            }
        }

        if (productId == null && (barcode == null || barcode.isBlank())) {
            throw new ProductNotFoundException("Product reference is required (productId or barcode)");
        }

        throw new ProductNotFoundException(
            "Product not found (id=" + productId + ", barcode=" + (barcode == null ? "null" : "'" + barcode + "'") + ")"
        );
    }
    
    public SaleResponse getSaleById(Long id) {
        UUID organisationId = requireOrganisationId();
        Sale sale = saleRepository.findByIdAndOrganisation_Id(id, organisationId)
            .orElseThrow(() -> new NotFoundException("Sale not found with id: " + id));
        return convertToResponse(sale);
    }
    
    public SaleResponse getSaleBySaleNumber(String saleNumber) {
        Sale sale = saleRepository.findBySaleNumber(saleNumber)
            .orElseThrow(() -> new NotFoundException("Sale not found with number: " + saleNumber));
        return convertToResponse(sale);
    }
    
    public Page<SaleResponse> getAllSales(int page, int size, String sortBy, String sortDir) {
        UUID organisationId = requireOrganisationId();
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Sale> sales = saleRepository.findByOrganisation_Id(organisationId, pageable);
        
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
            .orElseThrow(() -> new NotFoundException("Sale not found with id: " + id));
        
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
            .orElseThrow(() -> new NotFoundException("Sale not found with id: " + id));
        
        // Restore stock if sale was completed
        if (sale.getStatus() == Sale.SaleStatus.COMPLETED) {
            restoreStock(sale);
        }
        
        saleRepository.delete(sale);
    }
    
    // Analytics methods
    public BigDecimal getTotalSalesAmount(LocalDateTime startDate, LocalDateTime endDate) {
        UUID organisationId = requireOrganisationId();
        BigDecimal total;
        if (isElevated()) {
            total = saleRepository.getTotalSalesAmount(organisationId, startDate, endDate);
        } else {
            UUID storeId = requireStoreId();
            total = saleRepository.getTotalSalesAmountByStore(organisationId, storeId, startDate, endDate);
        }
        return total != null ? total : BigDecimal.ZERO;
    }
    
    public Long getTotalSalesCount(LocalDateTime startDate, LocalDateTime endDate) {
        UUID organisationId = requireOrganisationId();
        Long count;
        if (isElevated()) {
            count = saleRepository.getTotalSalesCount(organisationId, startDate, endDate);
        } else {
            UUID storeId = requireStoreId();
            count = saleRepository.getTotalSalesCountByStore(organisationId, storeId, startDate, endDate);
        }
        return count != null ? count : 0L;
    }
    
    public BigDecimal getAverageSaleAmount(LocalDateTime startDate, LocalDateTime endDate) {
        UUID organisationId = requireOrganisationId();
        BigDecimal average;
        if (isElevated()) {
            average = saleRepository.getAverageSaleAmount(organisationId, startDate, endDate);
        } else {
            UUID storeId = requireStoreId();
            average = saleRepository.getAverageSaleAmountByStore(organisationId, storeId, startDate, endDate);
        }
        return average != null ? average : BigDecimal.ZERO;
    }
    
    public List<Object[]> getPaymentMethodStats(LocalDateTime startDate, LocalDateTime endDate) {
        UUID organisationId = requireOrganisationId();
        if (isElevated()) {
            return saleRepository.getPaymentMethodStats(organisationId, startDate, endDate);
        }
        UUID storeId = requireStoreId();
        return saleRepository.getPaymentMethodStatsByStore(organisationId, storeId, startDate, endDate);
    }
    
    public List<Object[]> getDailySalesStats(LocalDateTime startDate, LocalDateTime endDate) {
        UUID organisationId = requireOrganisationId();
        if (isElevated()) {
            return saleRepository.getDailySalesStats(organisationId, startDate, endDate);
        }
        UUID storeId = requireStoreId();
        return saleRepository.getDailySalesStatsByStore(organisationId, storeId, startDate, endDate);
    }
    
    public List<Object[]> getMonthlySalesStats(LocalDateTime startDate, LocalDateTime endDate) {
        UUID organisationId = requireOrganisationId();
        if (isElevated()) {
            return saleRepository.getMonthlySalesStats(organisationId, startDate, endDate);
        }
        UUID storeId = requireStoreId();
        return saleRepository.getMonthlySalesStatsByStore(organisationId, storeId, startDate, endDate);
    }
    
    public List<Object[]> getTopCustomers(LocalDateTime startDate, LocalDateTime endDate, int limit) {
        UUID organisationId = requireOrganisationId();
        Pageable pageable = PageRequest.of(0, limit);
        if (isElevated()) {
            return saleRepository.getTopCustomers(organisationId, startDate, endDate, pageable);
        }
        UUID storeId = requireStoreId();
        return saleRepository.getTopCustomersByStore(organisationId, storeId, startDate, endDate, pageable);
    }

    private UUID requireOrganisationId() {
        UUID orgId = TenantContext.getOrganisationId();
        if (orgId == null) {
            if (requireTenantClaims) {
                throw new TenantContextMissingException("Missing tenant context (orgId) in JWT");
            }
            return UUID.fromString("00000000-0000-0000-0000-000000000001");
        }
        return orgId;
    }

    private UUID requireStoreId() {
        UUID storeId = TenantContext.getStoreId();
        if (storeId == null) {
            throw new BadRequestException("Boutique requise pour accéder aux rapports");
        }
        return storeId;
    }

    private boolean isElevated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream().anyMatch(a -> {
            String role = a.getAuthority();
            return "ROLE_ADMIN".equals(role) || "ROLE_MANAGER".equals(role) || "ROLE_PLATFORM_ADMIN".equals(role);
        });
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
