package com.salesmanager.repository;

import com.salesmanager.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository dédié à la recherche produit par code-barres (PRD §14).
 */
@Repository
public interface ProductBarcodeRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByBarcodeAndIsActiveTrue(String barcode);
}
