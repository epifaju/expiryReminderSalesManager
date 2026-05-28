package com.salesmanager.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

/**
 * Format d'erreur uniforme pour tous les endpoints /api/sync.
 */
public record SyncErrorResponse(
        @JsonProperty("status") int status,
        @JsonProperty("error") String error,
        @JsonProperty("message") String message,
        @JsonProperty("path") String path,
        @JsonProperty("timestamp") LocalDateTime timestamp
) {}

