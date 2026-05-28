package com.salesmanager.exception;

import com.salesmanager.controller.SyncController;
import com.salesmanager.dto.SyncErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

/**
 * Handler d'erreurs uniforme et spécifique à /api/sync.
 * Permet au client mobile de parser un format stable (SyncErrorResponse),
 * sans impacter les autres APIs qui utilisent ApiResponse.
 */
@RestControllerAdvice(assignableTypes = { SyncController.class })
public class SyncExceptionHandler {

    @ExceptionHandler({
            BadRequestException.class,
            IllegalArgumentException.class
    })
    public ResponseEntity<SyncErrorResponse> handleBadRequest(Exception ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, ex, request);
    }

    @ExceptionHandler({
            ForbiddenException.class
    })
    public ResponseEntity<SyncErrorResponse> handleForbidden(Exception ex, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, ex, request);
    }

    @ExceptionHandler({
            TenantContextMissingException.class
    })
    public ResponseEntity<SyncErrorResponse> handleUnauthorized(Exception ex, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, ex, request);
    }

    @ExceptionHandler({
            NotFoundException.class
    })
    public ResponseEntity<SyncErrorResponse> handleNotFound(Exception ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, ex, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<SyncErrorResponse> handleGeneric(Exception ex, HttpServletRequest request) {
        return build(HttpStatus.INTERNAL_SERVER_ERROR, ex, request);
    }

    private ResponseEntity<SyncErrorResponse> build(HttpStatus status, Exception ex, HttpServletRequest request) {
        SyncErrorResponse body = new SyncErrorResponse(
                status.value(),
                status.getReasonPhrase(),
                ex.getMessage(),
                request != null ? request.getRequestURI() : null,
                LocalDateTime.now()
        );
        return ResponseEntity.status(status).body(body);
    }
}

