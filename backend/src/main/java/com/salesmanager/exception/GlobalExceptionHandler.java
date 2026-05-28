package com.salesmanager.exception;

import com.salesmanager.dto.ApiResponse;
import com.salesmanager.util.MessageHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.hibernate.LazyInitializationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @Autowired
    private MessageHelper messageHelper;

    private static final Pattern PG_CONSTRAINT_PATTERN = Pattern.compile("constraint\\s+\"([^\"]+)\"", Pattern.CASE_INSENSITIVE);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleResourceNotFound(
            ResourceNotFoundException ex,
            Locale locale) {
        String message = messageHelper.getMessage(
                ex.getMessageKey(),
                locale,
                ex.getMessage());

        ApiResponse<?> response = new ApiResponse<>(
                false,
                message,
                null,
                locale.getLanguage());

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(response);
    }

    @ExceptionHandler(ResourceAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<?>> handleResourceAlreadyExists(
            ResourceAlreadyExistsException ex,
            Locale locale) {
        ApiResponse<?> response = new ApiResponse<>(
                false,
                ex.getMessage(),
                null,
                locale.getLanguage());

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(response);
    }

    @ExceptionHandler(InvalidPasswordException.class)
    public ResponseEntity<ApiResponse<?>> handleInvalidPassword(
            InvalidPasswordException ex,
            Locale locale) {
        ApiResponse<?> response = new ApiResponse<>(
                false,
                ex.getMessage(),
                null,
                locale.getLanguage());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<?>> handleBadRequest(
            BadRequestException ex,
            Locale locale) {
        ApiResponse<?> response = new ApiResponse<>(
                false,
                ex.getMessage(),
                null,
                locale.getLanguage());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiResponse<?>> handleForbidden(
            ForbiddenException ex,
            Locale locale) {
        ApiResponse<?> response = new ApiResponse<>(
                false,
                ex.getMessage(),
                null,
                locale.getLanguage());

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(response);
    }

    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleProductNotFound(
            ProductNotFoundException ex,
            Locale locale) {
        ApiResponse<?> response = new ApiResponse<>(
                false,
                ex.getMessage(),
                null,
                locale.getLanguage());

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(response);
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleNotFound(
            NotFoundException ex,
            Locale locale) {
        ApiResponse<?> response = new ApiResponse<>(
                false,
                ex.getMessage(),
                null,
                locale.getLanguage());

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidationErrors(
            MethodArgumentNotValidException ex,
            Locale locale) {
        String fieldError = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(error -> {
                    String fieldName = error.getField();
                    return messageHelper.getMessage(
                            "validation.required",
                            new Object[] { fieldName },
                            locale);
                })
                .orElse(messageHelper.getMessage("error.operation", locale));

        ApiResponse<?> response = new ApiResponse<>(
                false,
                fieldError,
                null,
                locale.getLanguage());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @ExceptionHandler(TenantContextMissingException.class)
    public ResponseEntity<ApiResponse<?>> handleTenantContextMissing(
            TenantContextMissingException ex,
            Locale locale) {
        ApiResponse<?> response = new ApiResponse<>(
                false,
                ex.getMessage(),
                null,
                locale.getLanguage());

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccessDenied(
            AccessDeniedException ex,
            Locale locale
    ) {
        ApiResponse<?> response = new ApiResponse<>(
                false,
                "Accès refusé",
                null,
                locale.getLanguage());

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(response);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<?>> handleDataIntegrityViolation(
            DataIntegrityViolationException ex,
            Locale locale
    ) {
        log.warn("Data integrity violation", ex);
        String constraint = extractPostgresConstraintName(ex).orElse(null);
        String message = switch (constraint == null ? "" : constraint) {
            case "idx_organisations_name_active_unique" -> "Une organisation avec ce nom existe déjà.";
            case "idx_stores_org_name_active_unique" -> "Une boutique avec ce nom existe déjà dans cette organisation.";
            case "idx_products_org_barcode_unique" -> "Un produit avec ce code-barres existe déjà dans cette organisation.";
            default -> "Conflit: une contrainte d'unicité empêche cette opération.";
        };

        ApiResponse<?> response = new ApiResponse<>(
                false,
                message,
                null,
                locale.getLanguage());

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(response);
    }

    @ExceptionHandler(LazyInitializationException.class)
    public ResponseEntity<ApiResponse<?>> handleLazyInitialization(
            LazyInitializationException ex,
            Locale locale) {
        log.error("LazyInitializationException", ex);
        ApiResponse<?> response = new ApiResponse<>(
                false,
                "Erreur interne lors du chargement des données associées",
                null,
                locale.getLanguage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGenericException(
            Exception ex,
            Locale locale) {
        log.error("Unhandled exception", ex);
        String message = messageHelper.getMessage(
                "error.operation",
                locale);

        ApiResponse<?> response = new ApiResponse<>(
                false,
                message,
                null,
                locale.getLanguage());

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }

    private static Optional<String> extractPostgresConstraintName(Throwable ex) {
        Throwable current = ex;
        while (current != null) {
            String msg = current.getMessage();
            if (msg != null) {
                Matcher m = PG_CONSTRAINT_PATTERN.matcher(msg);
                if (m.find()) {
                    return Optional.ofNullable(m.group(1));
                }
            }
            current = current.getCause();
        }
        return Optional.empty();
    }
}
