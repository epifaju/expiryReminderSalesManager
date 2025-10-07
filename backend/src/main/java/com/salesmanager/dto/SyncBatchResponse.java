package com.salesmanager.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTO pour la réponse de synchronisation batch
 * Contient les résultats du traitement des opérations
 * 
 * @author Sales Manager Team
 * @version 1.0
 */
public class SyncBatchResponse {

    @JsonProperty("success_count")
    private int successCount;

    @JsonProperty("error_count")
    private int errorCount;

    @JsonProperty("conflict_count")
    private int conflictCount;

    @JsonProperty("total_processed")
    private int totalProcessed;

    @JsonProperty("processing_time_ms")
    private long processingTimeMs;

    @JsonProperty("server_timestamp")
    private LocalDateTime serverTimestamp;

    @JsonProperty("sync_session_id")
    private String syncSessionId;

    @JsonProperty("results")
    private List<OperationResult> results;

    @JsonProperty("conflicts")
    private List<SyncConflict> conflicts;

    @JsonProperty("errors")
    private List<SyncError> errors;

    @JsonProperty("statistics")
    private SyncStatistics statistics;

    /**
     * Constructeur par défaut
     */
    public SyncBatchResponse() {
        this.serverTimestamp = LocalDateTime.now();
        this.successCount = 0;
        this.errorCount = 0;
        this.conflictCount = 0;
        this.totalProcessed = 0;
        this.processingTimeMs = 0;
    }

    /**
     * Constructeur avec paramètres principaux
     */
    public SyncBatchResponse(int totalProcessed, long processingTimeMs) {
        this();
        this.totalProcessed = totalProcessed;
        this.processingTimeMs = processingTimeMs;
    }

    // Getters et Setters

    public int getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(int successCount) {
        this.successCount = successCount;
    }

    public int getErrorCount() {
        return errorCount;
    }

    public void setErrorCount(int errorCount) {
        this.errorCount = errorCount;
    }

    public int getConflictCount() {
        return conflictCount;
    }

    public void setConflictCount(int conflictCount) {
        this.conflictCount = conflictCount;
    }

    public int getTotalProcessed() {
        return totalProcessed;
    }

    public void setTotalProcessed(int totalProcessed) {
        this.totalProcessed = totalProcessed;
    }

    public long getProcessingTimeMs() {
        return processingTimeMs;
    }

    public void setProcessingTimeMs(long processingTimeMs) {
        this.processingTimeMs = processingTimeMs;
    }

    public LocalDateTime getServerTimestamp() {
        return serverTimestamp;
    }

    public void setServerTimestamp(LocalDateTime serverTimestamp) {
        this.serverTimestamp = serverTimestamp;
    }

    public String getSyncSessionId() {
        return syncSessionId;
    }

    public void setSyncSessionId(String syncSessionId) {
        this.syncSessionId = syncSessionId;
    }

    public List<OperationResult> getResults() {
        return results;
    }

    public void setResults(List<OperationResult> results) {
        this.results = results;
    }

    public List<SyncConflict> getConflicts() {
        return conflicts;
    }

    public void setConflicts(List<SyncConflict> conflicts) {
        this.conflicts = conflicts;
    }

    public List<SyncError> getErrors() {
        return errors;
    }

    public void setErrors(List<SyncError> errors) {
        this.errors = errors;
    }

    public SyncStatistics getStatistics() {
        return statistics;
    }

    public void setStatistics(SyncStatistics statistics) {
        this.statistics = statistics;
    }

    /**
     * Classe pour représenter le résultat d'une opération
     */
    public static class OperationResult {

        @JsonProperty("entity_id")
        private String entityId;

        @JsonProperty("local_id")
        private String localId;

        @JsonProperty("server_id")
        private String serverId;

        @JsonProperty("entity_type")
        private String entityType;

        @JsonProperty("operation_type")
        private String operationType;

        @JsonProperty("status")
        private OperationStatus status;

        @JsonProperty("message")
        private String message;

        @JsonProperty("timestamp")
        private LocalDateTime timestamp;

        /**
         * Constructeur par défaut
         */
        public OperationResult() {
            this.timestamp = LocalDateTime.now();
        }

        /**
         * Constructeur avec paramètres
         */
        public OperationResult(String entityId, String entityType, String operationType,
                OperationStatus status) {
            this();
            this.entityId = entityId;
            this.entityType = entityType;
            this.operationType = operationType;
            this.status = status;
        }

        // Getters et Setters

        public String getEntityId() {
            return entityId;
        }

        public void setEntityId(String entityId) {
            this.entityId = entityId;
        }

        public String getLocalId() {
            return localId;
        }

        public void setLocalId(String localId) {
            this.localId = localId;
        }

        public String getServerId() {
            return serverId;
        }

        public void setServerId(String serverId) {
            this.serverId = serverId;
        }

        public String getEntityType() {
            return entityType;
        }

        public void setEntityType(String entityType) {
            this.entityType = entityType;
        }

        public String getOperationType() {
            return operationType;
        }

        public void setOperationType(String operationType) {
            this.operationType = operationType;
        }

        public OperationStatus getStatus() {
            return status;
        }

        public void setStatus(OperationStatus status) {
            this.status = status;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public LocalDateTime getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }
    }

    /**
     * Classe pour représenter un conflit de synchronisation
     */
    public static class SyncConflict {

        @JsonProperty("conflict_id")
        private String conflictId;

        @JsonProperty("entity_id")
        private String entityId;

        @JsonProperty("entity_type")
        private String entityType;

        @JsonProperty("conflict_type")
        private ConflictType conflictType;

        @JsonProperty("local_data")
        private Object localData;

        @JsonProperty("server_data")
        private Object serverData;

        @JsonProperty("priority")
        private ConflictPriority priority;

        @JsonProperty("timestamp")
        private LocalDateTime timestamp;

        @JsonProperty("message")
        private String message;

        /**
         * Constructeur par défaut
         */
        public SyncConflict() {
            this.timestamp = LocalDateTime.now();
            this.priority = ConflictPriority.MEDIUM;
        }

        // Getters et Setters

        public String getConflictId() {
            return conflictId;
        }

        public void setConflictId(String conflictId) {
            this.conflictId = conflictId;
        }

        public String getEntityId() {
            return entityId;
        }

        public void setEntityId(String entityId) {
            this.entityId = entityId;
        }

        public String getEntityType() {
            return entityType;
        }

        public void setEntityType(String entityType) {
            this.entityType = entityType;
        }

        public ConflictType getConflictType() {
            return conflictType;
        }

        public void setConflictType(ConflictType conflictType) {
            this.conflictType = conflictType;
        }

        public Object getLocalData() {
            return localData;
        }

        public void setLocalData(Object localData) {
            this.localData = localData;
        }

        public Object getServerData() {
            return serverData;
        }

        public void setServerData(Object serverData) {
            this.serverData = serverData;
        }

        public ConflictPriority getPriority() {
            return priority;
        }

        public void setPriority(ConflictPriority priority) {
            this.priority = priority;
        }

        public LocalDateTime getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }

    /**
     * Classe pour représenter une erreur de synchronisation
     */
    public static class SyncError {

        @JsonProperty("entity_id")
        private String entityId;

        @JsonProperty("entity_type")
        private String entityType;

        @JsonProperty("operation_type")
        private String operationType;

        @JsonProperty("error_code")
        private String errorCode;

        @JsonProperty("error_message")
        private String errorMessage;

        @JsonProperty("timestamp")
        private LocalDateTime timestamp;

        /**
         * Constructeur par défaut
         */
        public SyncError() {
            this.timestamp = LocalDateTime.now();
        }

        // Getters et Setters

        public String getEntityId() {
            return entityId;
        }

        public void setEntityId(String entityId) {
            this.entityId = entityId;
        }

        public String getEntityType() {
            return entityType;
        }

        public void setEntityType(String entityType) {
            this.entityType = entityType;
        }

        public String getOperationType() {
            return operationType;
        }

        public void setOperationType(String operationType) {
            this.operationType = operationType;
        }

        public String getErrorCode() {
            return errorCode;
        }

        public void setErrorCode(String errorCode) {
            this.errorCode = errorCode;
        }

        public String getErrorMessage() {
            return errorMessage;
        }

        public void setErrorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
        }

        public LocalDateTime getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }
    }

    /**
     * Classe pour les statistiques de synchronisation
     */
    public static class SyncStatistics {

        @JsonProperty("by_entity_type")
        private Map<String, Integer> byEntityType;

        @JsonProperty("by_operation_type")
        private Map<String, Integer> byOperationType;

        @JsonProperty("average_processing_time_ms")
        private double averageProcessingTimeMs;

        @JsonProperty("total_data_size_bytes")
        private long totalDataSizeBytes;

        /**
         * Constructeur par défaut
         */
        public SyncStatistics() {
        }

        // Getters et Setters

        public Map<String, Integer> getByEntityType() {
            return byEntityType;
        }

        public void setByEntityType(Map<String, Integer> byEntityType) {
            this.byEntityType = byEntityType;
        }

        public Map<String, Integer> getByOperationType() {
            return byOperationType;
        }

        public void setByOperationType(Map<String, Integer> byOperationType) {
            this.byOperationType = byOperationType;
        }

        public double getAverageProcessingTimeMs() {
            return averageProcessingTimeMs;
        }

        public void setAverageProcessingTimeMs(double averageProcessingTimeMs) {
            this.averageProcessingTimeMs = averageProcessingTimeMs;
        }

        public long getTotalDataSizeBytes() {
            return totalDataSizeBytes;
        }

        public void setTotalDataSizeBytes(long totalDataSizeBytes) {
            this.totalDataSizeBytes = totalDataSizeBytes;
        }
    }

    /**
     * Énumérations pour les statuts et types
     */
    public enum OperationStatus {
        SUCCESS, FAILED, CONFLICT, SKIPPED
    }

    public enum ConflictType {
        UPDATE_CONFLICT, DELETE_CONFLICT, CREATE_CONFLICT
    }

    public enum ConflictPriority {
        LOW, MEDIUM, HIGH, CRITICAL
    }
}

