package com.salesmanager.service;

import com.salesmanager.dto.ProductDto;
import com.salesmanager.entity.Product;
import com.salesmanager.exception.ResourceNotFoundException;
import com.salesmanager.repository.ProductBarcodeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProductBarcodeService {

    private final ProductBarcodeRepository productBarcodeRepository;

    public ProductBarcodeService(ProductBarcodeRepository productBarcodeRepository) {
        this.productBarcodeRepository = productBarcodeRepository;
    }

    public ProductDto findByBarcode(String barcode) {
        String normalized = normalizeBarcode(barcode);
        if (normalized.isEmpty()) {
            throw new ResourceNotFoundException(
                    "error.product.notfound",
                    "Code-barres invalide ou vide");
        }

        Product product = productBarcodeRepository
                .findByBarcodeAndIsActiveTrue(normalized)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "error.product.notfound",
                        "Produit non trouvé avec le code-barres: " + normalized));

        return toDto(product);
    }

    private static String normalizeBarcode(String barcode) {
        if (barcode == null) {
            return "";
        }
        return barcode.trim();
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
