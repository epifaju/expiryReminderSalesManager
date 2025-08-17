package com.salesmanager.exception;

public class ProductNotFoundException extends RuntimeException {
    
    public ProductNotFoundException(String message) {
        super(message);
    }
    
    public ProductNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
    
    public ProductNotFoundException(Long productId) {
        super("Produit non trouvé avec l'ID: " + productId);
    }
}
