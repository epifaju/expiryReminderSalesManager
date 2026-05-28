package com.salesmanager.service;

import com.salesmanager.dto.ProductDto;
import com.salesmanager.entity.Product;
import com.salesmanager.exception.ResourceNotFoundException;
import com.salesmanager.security.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ProductBarcodeService {

    private final ProductBarcodeLookupService productBarcodeLookupService;

    public ProductBarcodeService(ProductBarcodeLookupService productBarcodeLookupService) {
        this.productBarcodeLookupService = productBarcodeLookupService;
    }

    public ProductDto findByBarcode(String barcode) {
        if (barcode == null || barcode.isBlank()) {
            throw new ResourceNotFoundException(
                    "error.product.notfound",
                    "Code-barres invalide ou vide");
        }

        UUID organisationId = TenantContext.getOrganisationId();
        if (organisationId == null) {
            organisationId = TenantResolutionService.DEFAULT_ORG_ID;
        }

        Product product = productBarcodeLookupService
                .findActiveByBarcode(organisationId, barcode)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "error.product.notfound",
                        "Produit non trouvé avec le code-barres: " + barcode));

        return toDto(product);
    }

    private ProductDto toDto(Product product) {
        return ProductDto.builder()
                .id(product.getId())
                .name(product.getName())
                .barcode(product.getBarcode())
                .salePrice(product.getSellingPrice())
                .stockQuantity(product.getStockQuantity())
                .expirationDate(product.getExpiryDate())
                .category(product.getCategory())
                .unit(product.getUnit())
                .syncStatus("SYNCED")
                .build();
    }
}
