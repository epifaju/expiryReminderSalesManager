package com.salesmanager.controller;

import com.salesmanager.dto.SaleRequest;
import com.salesmanager.dto.SaleResponse;
import com.salesmanager.entity.Sale;
import com.salesmanager.service.SaleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/sales")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SaleController {
    
    @Autowired
    private SaleService saleService;
    
    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<SaleResponse> createSale(@Valid @RequestBody SaleRequest saleRequest) {
        try {
            SaleResponse saleResponse = saleService.createSale(saleRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(saleResponse);
        } catch (Exception e) {
            throw new RuntimeException("Error creating sale: " + e.getMessage());
        }
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<SaleResponse> getSaleById(@PathVariable Long id) {
        SaleResponse saleResponse = saleService.getSaleById(id);
        return ResponseEntity.ok(saleResponse);
    }
    
    @GetMapping("/number/{saleNumber}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<SaleResponse> getSaleBySaleNumber(@PathVariable String saleNumber) {
        SaleResponse saleResponse = saleService.getSaleBySaleNumber(saleNumber);
        return ResponseEntity.ok(saleResponse);
    }
    
    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Page<SaleResponse>> getAllSales(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "saleDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Page<SaleResponse> sales = saleService.getAllSales(page, size, sortBy, sortDir);
        return ResponseEntity.ok(sales);
    }
    
    @GetMapping("/date-range")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Page<SaleResponse>> getSalesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "saleDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Page<SaleResponse> sales = saleService.getSalesByDateRange(startDate, endDate, page, size, sortBy, sortDir);
        return ResponseEntity.ok(sales);
    }
    
    @GetMapping("/my-sales")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Page<SaleResponse>> getMySales(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "saleDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Page<SaleResponse> sales = saleService.getSalesByUser(page, size, sortBy, sortDir);
        return ResponseEntity.ok(sales);
    }
    
    @GetMapping("/recent")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<SaleResponse>> getRecentSales(
            @RequestParam(defaultValue = "10") int limit) {
        
        List<SaleResponse> sales = saleService.getRecentSales(limit);
        return ResponseEntity.ok(sales);
    }
    
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SaleResponse> updateSaleStatus(
            @PathVariable Long id,
            @RequestParam Sale.SaleStatus status) {
        
        SaleResponse saleResponse = saleService.updateSaleStatus(id, status);
        return ResponseEntity.ok(saleResponse);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteSale(@PathVariable Long id) {
        saleService.deleteSale(id);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Sale deleted successfully");
        return ResponseEntity.ok(response);
    }
    
    // Analytics endpoints
    @GetMapping("/analytics/summary")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getSalesSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalAmount", saleService.getTotalSalesAmount(startDate, endDate));
        summary.put("totalCount", saleService.getTotalSalesCount(startDate, endDate));
        summary.put("averageAmount", saleService.getAverageSaleAmount(startDate, endDate));
        
        return ResponseEntity.ok(summary);
    }
    
    @GetMapping("/analytics/payment-methods")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<Object[]>> getPaymentMethodStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        List<Object[]> stats = saleService.getPaymentMethodStats(startDate, endDate);
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/analytics/daily")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<Object[]>> getDailySalesStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        List<Object[]> stats = saleService.getDailySalesStats(startDate, endDate);
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/analytics/monthly")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<Object[]>> getMonthlySalesStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        List<Object[]> stats = saleService.getMonthlySalesStats(startDate, endDate);
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/analytics/top-customers")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<Object[]>> getTopCustomers(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "10") int limit) {
        
        List<Object[]> customers = saleService.getTopCustomers(startDate, endDate, limit);
        return ResponseEntity.ok(customers);
    }
    
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", ex.getMessage());
        return ResponseEntity.badRequest().body(error);
    }
}
