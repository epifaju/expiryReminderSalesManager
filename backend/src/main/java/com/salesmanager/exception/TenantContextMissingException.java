package com.salesmanager.exception;

/**
 * Lancée quand l'application exige orgId (tenant) mais que le JWT ne le fournit pas.
 * On la mappe explicitement en 401 dans GlobalExceptionHandler.
 */
public class TenantContextMissingException extends RuntimeException {
    public TenantContextMissingException(String message) {
        super(message);
    }
}

