package com.salesmanager.controller;

import com.salesmanager.dto.ApiResponse;
import com.salesmanager.dto.ProductDto;
import com.salesmanager.service.ProductBarcodeService;
import com.salesmanager.util.MessageHelper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;

/**
 * Endpoint dédié recherche produit par code-barres (PRD §14).
 */
@RestController
@RequestMapping("/api/v1/products")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProductBarcodeController {

    private final ProductBarcodeService productBarcodeService;
    private final MessageHelper messageHelper;

    public ProductBarcodeController(
            ProductBarcodeService productBarcodeService,
            MessageHelper messageHelper) {
        this.productBarcodeService = productBarcodeService;
        this.messageHelper = messageHelper;
    }

    @GetMapping("/barcode/{barcode}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('MANAGER') or hasRole('PLATFORM_ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<ApiResponse<ProductDto>> findByBarcode(
            @PathVariable String barcode,
            Locale locale) {
        ProductDto product = productBarcodeService.findByBarcode(barcode);
        String message = messageHelper.getMessage("product.found.by.barcode", locale);

        ApiResponse<ProductDto> response = new ApiResponse<>(
                true,
                message,
                product,
                locale.getLanguage());

        return ResponseEntity.ok(response);
    }
}
