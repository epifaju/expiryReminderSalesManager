package com.salesmanager.service;

import com.salesmanager.dto.ProductRequest;
import com.salesmanager.dto.ProductResponse;
import com.salesmanager.entity.Product;
import com.salesmanager.entity.User;
import com.salesmanager.exception.ProductNotFoundException;
import com.salesmanager.exception.ResourceAlreadyExistsException;
import com.salesmanager.repository.ProductRepository;
import com.salesmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductService {
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    // Create product
    public ProductResponse createProduct(ProductRequest request) {
        // Check if barcode already exists
        if (request.getBarcode() != null && !request.getBarcode().trim().isEmpty()) {
            if (productRepository.existsByBarcode(request.getBarcode())) {
                throw new ResourceAlreadyExistsException("Un produit avec ce code-barres existe déjà: " + request.getBarcode());
            }
        }
        
        Product product = mapToEntity(request);
        
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
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));
        return mapToResponse(product);
    }
    
    // Get all products with pagination
    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        Page<Product> products = productRepository.findByIsActiveTrue(pageable);
        return products.map(this::mapToResponse);
    }
    
    // Search products
    @Transactional(readOnly = true)
    public Page<ProductResponse> searchProducts(String searchTerm, Pageable pageable) {
        Page<Product> products = productRepository.searchByNameOrDescription(searchTerm, pageable);
        return products.map(this::mapToResponse);
    }
    
    // Get products by category
    @Transactional(readOnly = true)
    public Page<ProductResponse> getProductsByCategory(String category, Pageable pageable) {
        Page<Product> products = productRepository.findByCategoryAndIsActiveTrue(category, pageable);
        return products.map(this::mapToResponse);
    }
    
    // Get products by price range
    @Transactional(readOnly = true)
    public Page<ProductResponse> getProductsByPriceRange(BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable) {
        Page<Product> products = productRepository.findByPriceRange(minPrice, maxPrice, pageable);
        return products.map(this::mapToResponse);
    }
    
    // Update product
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product existingProduct = productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));
        
        // Check if barcode already exists for another product
        if (request.getBarcode() != null && !request.getBarcode().trim().isEmpty()) {
            if (productRepository.existsByBarcodeAndIdNot(request.getBarcode(), id)) {
                throw new ResourceAlreadyExistsException("Un autre produit avec ce code-barres existe déjà: " + request.getBarcode());
            }
        }
        
        // Update fields
        existingProduct.setName(request.getName());
        existingProduct.setDescription(request.getDescription());
        existingProduct.setBarcode(request.getBarcode());
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
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));
        
        product.setIsActive(false);
        productRepository.save(product);
    }
    
    // Update stock quantity
    public ProductResponse updateStock(Long id, Integer newQuantity) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));
        
        product.setStockQuantity(newQuantity);
        Product updatedProduct = productRepository.save(product);
        return mapToResponse(updatedProduct);
    }
    
    // Get low stock products
    @Transactional(readOnly = true)
    public List<ProductResponse> getLowStockProducts() {
        List<Product> products = productRepository.findLowStockProducts();
        return products.stream().map(this::mapToResponse).collect(Collectors.toList());
    }
    
    // Get expiring products
    @Transactional(readOnly = true)
    public List<ProductResponse> getExpiringProducts(int warningDays) {
        LocalDate warningDate = LocalDate.now().plusDays(warningDays);
        List<Product> products = productRepository.findExpiringProducts(warningDate);
        return products.stream().map(this::mapToResponse).collect(Collectors.toList());
    }
    
    // Get expired products
    @Transactional(readOnly = true)
    public List<ProductResponse> getExpiredProducts() {
        List<Product> products = productRepository.findExpiredProducts(LocalDate.now());
        return products.stream().map(this::mapToResponse).collect(Collectors.toList());
    }
    
    // Get all categories
    @Transactional(readOnly = true)
    public List<String> getAllCategories() {
        return productRepository.findAllCategories();
    }
    
    // Get product by barcode
    @Transactional(readOnly = true)
    public ProductResponse getProductByBarcode(String barcode) {
        Product product = productRepository.findByBarcode(barcode)
            .orElseThrow(() -> new ProductNotFoundException("Produit non trouvé avec le code-barres: " + barcode));
        return mapToResponse(product);
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
