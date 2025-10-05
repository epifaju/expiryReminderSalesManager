package com.salesmanager.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;
    private String locale;

    public ApiResponse(boolean success, String message, T data, String locale) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.timestamp = LocalDateTime.now();
        this.locale = locale;
    }

    public ApiResponse(boolean success, String message, T data) {
        this(success, message, data, "fr");
    }

    public ApiResponse(boolean success, String message) {
        this(success, message, null, "fr");
    }
}
