package com.salesmanager.service;

import com.salesmanager.entity.Product;
import com.salesmanager.repository.ProductRepository;
import com.salesmanager.util.BarcodeNormalizer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ProductBarcodeLookupService {

    private final ProductRepository productRepository;

    public ProductBarcodeLookupService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public Optional<Product> findActiveByBarcode(UUID organisationId, String rawBarcode) {
        List<String> candidates = BarcodeNormalizer.candidates(rawBarcode);
        for (String candidate : candidates) {
            Optional<Product> found = productRepository
                    .findByBarcodeAndOrganisation_IdAndIsActiveTrueWithDetails(candidate, organisationId);
            if (found.isPresent()) {
                return found;
            }
        }
        return Optional.empty();
    }
}
