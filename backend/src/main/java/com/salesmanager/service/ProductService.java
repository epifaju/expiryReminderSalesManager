package com.salesmanager.service;

import com.salesmanager.dto.ProductRequest;
import com.salesmanager.dto.ProductResponse;
import com.salesmanager.entity.Product;
import com.salesmanager.entity.User;
import com.salesmanager.exception.ProductNotFoundException;
import com.salesmanager.exception.ResourceAlreadyExistsException;
import com.salesmanager.exception.TenantContextMissingException;
import com.salesmanager.repository.ProductRepository;
import com.salesmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import com.salesmanager.security.TenantContext;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import com.salesmanager.entity.Organisation;
import com.salesmanager.util.BarcodeNormalizer;

@Service
@Transactional
public class ProductService {
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductBarcodeLookupService productBarcodeLookupService;

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${multitenancy.require-tenant-claims:false}")
    private boolean requireTenantClaims;
    
    // Create product
    public ProductResponse createProduct(ProductRequest request) {
        UUID organisationId = requireOrganisationId();
        String barcode = normalizeBarcode(request.getBarcode());

        if (barcode != null) {
            Optional<Product> existing = findAnyByBarcodeVariants(organisationId, request.getBarcode());
            if (existing.isPresent()) {
                Product inactiveOrActive = existing.get();
                if (Boolean.TRUE.equals(inactiveOrActive.getIsActive())) {
                    throw new ResourceAlreadyExistsException(
                            "Un produit avec ce code-barres existe déjà: " + barcode);
                }
                applyRequestToProduct(inactiveOrActive, request, barcode);
                inactiveOrActive.setIsActive(true);
                Product reactivated = productRepository.save(inactiveOrActive);
                return mapToResponse(reactivated);
            }
        }

        Product product = mapToEntity(request);
        product.setBarcode(barcode);
        product.setOrganisation(entityManager.getReference(Organisation.class, organisationId));
        
        // Set created by user
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null) {
            User user = userRepository.findByUsername(auth.getName()).orElse(null);
            product.setCreatedBy(user);
        }
        
        Product savedProduct = productRepository.save(product);
        return mapToResponse(savedProduct);
    }
    
    // Get product by ID
    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        UUID organisationId = requireOrganisationId();
        Product product = productRepository.findByIdAndOrganisation_Id(id, organisationId)
            .orElseThrow(() -> new ProductNotFoundException(id));
        return mapToResponse(product);
    }
    
    // Get all products with pagination
    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        UUID organisationId = requireOrganisationId();
        Page<Product> products = productRepository.findByOrganisation_IdAndIsActiveTrue(organisationId, pageable);
        return products.map(this::mapToResponse);
    }
    
    // Search products
    @Transactional(readOnly = true)
    public Page<ProductResponse> searchProducts(String searchTerm, Pageable pageable) {
        UUID organisationId = requireOrganisationId();
        Page<Product> products = productRepository.searchByNameOrDescription(organisationId, searchTerm, pageable);
        return products.map(this::mapToResponse);
    }
    
    // Get products by category
    @Transactional(readOnly = true)
    public Page<ProductResponse> getProductsByCategory(String category, Pageable pageable) {
        UUID organisationId = requireOrganisationId();
        Page<Product> products = productRepository.findByOrganisation_IdAndCategoryAndIsActiveTrue(organisationId, category, pageable);
        return products.map(this::mapToResponse);
    }
    
    // Get products by price range
    @Transactional(readOnly = true)
    public Page<ProductResponse> getProductsByPriceRange(BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable) {
        UUID organisationId = requireOrganisationId();
        Page<Product> products = productRepository.findByPriceRange(organisationId, minPrice, maxPrice, pageable);
        return products.map(this::mapToResponse);
    }
    
    // Update product
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        UUID organisationId = requireOrganisationId();
        Product existingProduct = productRepository.findByIdAndOrganisation_Id(id, organisationId)
            .orElseThrow(() -> new ProductNotFoundException(id));
        
        String barcode = normalizeBarcode(request.getBarcode());
        if (barcode != null) {
            if (productRepository.existsByBarcodeAndIdNot(organisationId, barcode, id)) {
                throw new ResourceAlreadyExistsException("Un autre produit avec ce code-barres existe déjà: " + barcode);
            }
        }

        // Update fields
        existingProduct.setName(request.getName());
        existingProduct.setDescription(request.getDescription());
        existingProduct.setBarcode(barcode);
        existingProduct.setPurchasePrice(request.getPurchasePrice());
        existingProduct.setSellingPrice(request.getSellingPrice());
        existingProduct.setStockQuantity(request.getStockQuantity());
        existingProduct.setMinStockLevel(request.getMinStockLevel());
        existingProduct.setExpiryDate(request.getExpiryDate());
        existingProduct.setManufacturingDate(request.getManufacturingDate());
        existingProduct.setCategory(request.getCategory());
        existingProduct.setUnit(request.getUnit());
        existingProduct.setImageUrl(request.getImageUrl());
        existingProduct.setIsActive(request.getIsActive());
        
        Product updatedProduct = productRepository.save(existingProduct);
        return mapToResponse(updatedProduct);
    }
    
    // Delete product (soft delete)
    public void deleteProduct(Long id) {
        UUID organisationId = requireOrganisationId();
        Product product = productRepository.findByIdAndOrganisation_Id(id, organisationId)
            .orElseThrow(() -> new ProductNotFoundException(id));
        
        product.setIsActive(false);
        productRepository.save(product);
    }
    
    // Update stock quantity
    public ProductResponse updateStock(Long id, Integer newQuantity) {
        UUID organisationId = requireOrganisationId();
        Product product = productRepository.findByIdAndOrganisation_Id(id, organisationId)
            .orElseThrow(() -> new ProductNotFoundException(id));
        
        product.setStockQuantity(newQuantity);
        Product updatedProduct = productRepository.save(product);
        return mapToResponse(updatedProduct);
    }
    
    // Get low stock products
    @Transactional(readOnly = true)
    public List<ProductResponse> getLowStockProducts() {
        UUID organisationId = requireOrganisationId();
        List<Product> products = productRepository.findLowStockProducts(organisationId);
        return products.stream().map(this::mapToResponse).collect(Collectors.toList());
    }
    
    // Get expiring products
    @Transactional(readOnly = true)
    public List<ProductResponse> getExpiringProducts(int warningDays) {
        UUID organisationId = requireOrganisationId();
        LocalDate warningDate = LocalDate.now().plusDays(warningDays);
        List<Product> products = productRepository.findExpiringProducts(organisationId, warningDate);
        return products.stream().map(this::mapToResponse).collect(Collectors.toList());
    }
    
    // Get expired products
    @Transactional(readOnly = true)
    public List<ProductResponse> getExpiredProducts() {
        UUID organisationId = requireOrganisationId();
        List<Product> products = productRepository.findExpiredProducts(organisationId, LocalDate.now());
        return products.stream().map(this::mapToResponse).collect(Collectors.toList());
    }
    
    // Get all categories
    @Transactional(readOnly = true)
    public List<String> getAllCategories() {
        UUID organisationId = requireOrganisationId();
        return productRepository.findAllCategories(organisationId);
    }
    
    // Get product by barcode
    @Transactional(readOnly = true)
    public ProductResponse getProductByBarcode(String barcode) {
        UUID organisationId = requireOrganisationId();
        Product product = productBarcodeLookupService.findActiveByBarcode(organisationId, barcode)
            .orElseThrow(() -> new ProductNotFoundException("Produit non trouvé avec le code-barres: " + barcode));
        return mapToResponse(product);
    }

    private static String normalizeBarcode(String barcode) {
        if (barcode == null || barcode.isBlank()) {
            return null;
        }
        String canonical = BarcodeNormalizer.canonical(barcode);
        return canonical.isEmpty() ? barcode.trim() : canonical;
    }

    private Optional<Product> findAnyByBarcodeVariants(UUID organisationId, String rawBarcode) {
        for (String candidate : BarcodeNormalizer.candidates(rawBarcode)) {
            Optional<Product> found = productRepository.findByBarcodeAndOrganisation_Id(candidate, organisationId);
            if (found.isPresent()) {
                return found;
            }
        }
        return Optional.empty();
    }

    private void applyRequestToProduct(Product product, ProductRequest request, String barcode) {
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setBarcode(barcode);
        product.setPurchasePrice(request.getPurchasePrice());
        product.setSellingPrice(request.getSellingPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setMinStockLevel(request.getMinStockLevel());
        product.setExpiryDate(request.getExpiryDate());
        product.setManufacturingDate(request.getManufacturingDate());
        product.setCategory(request.getCategory());
        product.setUnit(request.getUnit());
        product.setImageUrl(request.getImageUrl());
        if (request.getIsActive() != null) {
            product.setIsActive(request.getIsActive());
        }
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
    
    // Helper methods
    private Product mapToEntity(ProductRequest request) {
        Product product = new Product();
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setBarcode(request.getBarcode());
        product.setPurchasePrice(request.getPurchasePrice());
        product.setSellingPrice(request.getSellingPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setMinStockLevel(request.getMinStockLevel());
        product.setExpiryDate(request.getExpiryDate());
        product.setManufacturingDate(request.getManufacturingDate());
        product.setCategory(request.getCategory());
        product.setUnit(request.getUnit());
        product.setImageUrl(request.getImageUrl());
        product.setIsActive(request.getIsActive());
        return product;
    }
    
    private ProductResponse mapToResponse(Product product) {
        String createdByUsername = product.getCreatedBy() != null ? 
            product.getCreatedBy().getUsername() : null;
            
        return new ProductResponse(
            product.getId(),
            product.getName(),
            product.getDescription(),
            product.getBarcode(),
            product.getPurchasePrice(),
            product.getSellingPrice(),
            product.getStockQuantity(),
            product.getMinStockLevel(),
            product.getExpiryDate(),
            product.getManufacturingDate(),
            product.getCategory(),
            product.getUnit(),
            product.getImageUrl(),
            product.getIsActive(),
            product.getCreatedAt(),
            product.getUpdatedAt(),
            createdByUsername
        );
    }
}
