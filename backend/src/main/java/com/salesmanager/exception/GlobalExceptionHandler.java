package com.salesmanager.exception;

import com.salesmanager.dto.ApiResponse;
import com.salesmanager.util.MessageHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Locale;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @Autowired
    private MessageHelper messageHelper;

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

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGenericException(
            Exception ex,
            Locale locale) {
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
}
