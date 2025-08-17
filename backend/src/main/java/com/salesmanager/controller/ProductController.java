package com.salesmanager.controller;

import com.salesmanager.dto.ProductRequest;
import com.salesmanager.dto.ProductResponse;
import com.salesmanager.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/products")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProductController {
    
    @Autowired
    private ProductService productService;
    
    // Create product
    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request) {
        ProductResponse response = productService.createProduct(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    // Get product by ID
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        ProductResponse response = productService.getProductById(id);
        return ResponseEntity.ok(response);
    }
    
    // Get all products with pagination
    @GetMapping
    public ResponseEntity<Page<ProductResponse>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : 
            Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ProductResponse> products = productService.getAllProducts(pageable);
        return ResponseEntity.ok(products);
    }
    
    // Search products
    @GetMapping("/search")
    public ResponseEntity<Page<ProductResponse>> searchProducts(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : 
            Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ProductResponse> products = productService.searchProducts(q, pageable);
        return ResponseEntity.ok(products);
    }
    
    // Get products by category
    @GetMapping("/category/{category}")
    public ResponseEntity<Page<ProductResponse>> getProductsByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : 
            Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ProductResponse> products = productService.getProductsByCategory(category, pageable);
        return ResponseEntity.ok(products);
    }
    
    // Get products by price range
    @GetMapping("/price-range")
    public ResponseEntity<Page<ProductResponse>> getProductsByPriceRange(
            @RequestParam BigDecimal minPrice,
            @RequestParam BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "sellingPrice") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : 
            Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ProductResponse> products = productService.getProductsByPriceRange(minPrice, maxPrice, pageable);
        return ResponseEntity.ok(products);
    }
    
    // Update product
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id, 
            @Valid @RequestBody ProductRequest request) {
        ProductResponse response = productService.updateProduct(id, request);
        return ResponseEntity.ok(response);
    }
    
    // Delete product (soft delete)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Produit supprimé avec succès");
        return ResponseEntity.ok(response);
    }
    
    // Update stock quantity
    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ProductResponse> updateStock(
            @PathVariable Long id, 
            @RequestParam Integer quantity) {
        ProductResponse response = productService.updateStock(id, quantity);
        return ResponseEntity.ok(response);
    }
    
    // Get product by barcode
    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<ProductResponse> getProductByBarcode(@PathVariable String barcode) {
        ProductResponse response = productService.getProductByBarcode(barcode);
        return ResponseEntity.ok(response);
    }
    
    // Get low stock products
    @GetMapping("/alerts/low-stock")
    public ResponseEntity<List<ProductResponse>> getLowStockProducts() {
        List<ProductResponse> products = productService.getLowStockProducts();
        return ResponseEntity.ok(products);
    }
    
    // Get expiring products
    @GetMapping("/alerts/expiring")
    public ResponseEntity<List<ProductResponse>> getExpiringProducts(
            @RequestParam(defaultValue = "7") int warningDays) {
        List<ProductResponse> products = productService.getExpiringProducts(warningDays);
        return ResponseEntity.ok(products);
    }
    
    // Get expired products
    @GetMapping("/alerts/expired")
    public ResponseEntity<List<ProductResponse>> getExpiredProducts() {
        List<ProductResponse> products = productService.getExpiredProducts();
        return ResponseEntity.ok(products);
    }
    
    // Get all categories
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getAllCategories() {
        List<String> categories = productService.getAllCategories();
        return ResponseEntity.ok(categories);
    }
    
    // Get product statistics
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getProductStats() {
        Map<String, Object> stats = new HashMap<>();
        
        List<ProductResponse> lowStockProducts = productService.getLowStockProducts();
        List<ProductResponse> expiringProducts = productService.getExpiringProducts(7);
        List<ProductResponse> expiredProducts = productService.getExpiredProducts();
        List<String> categories = productService.getAllCategories();
        
        stats.put("lowStockCount", lowStockProducts.size());
        stats.put("expiringCount", expiringProducts.size());
        stats.put("expiredCount", expiredProducts.size());
        stats.put("categoriesCount", categories.size());
        stats.put("lowStockProducts", lowStockProducts);
        stats.put("expiringProducts", expiringProducts);
        stats.put("expiredProducts", expiredProducts);
        stats.put("categories", categories);
        
        return ResponseEntity.ok(stats);
    }
}
