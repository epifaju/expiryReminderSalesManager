package com.salesmanager.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO pour la requête de synchronisation batch
 * Contient la liste des opérations à synchroniser
 * 
 * @author Sales Manager Team
 * @version 1.0
 */
public class SyncBatchRequest {

    @NotNull(message = "La liste des opérations ne peut pas être nulle")
    @NotEmpty(message = "Au moins une opération doit être fournie")
    @Size(max = 100, message = "Maximum 100 opérations par batch")
    @Valid
    @JsonProperty("operations")
    private List<SyncOperation> operations;

    @JsonProperty("client_timestamp")
    private LocalDateTime clientTimestamp;

    @JsonProperty("device_id")
    private String deviceId;

    @JsonProperty("app_version")
    private String appVersion;

    @JsonProperty("sync_session_id")
    private String syncSessionId;

    /**
     * Constructeur par défaut
     */
    public SyncBatchRequest() {
        this.clientTimestamp = LocalDateTime.now();
    }

    /**
     * Constructeur avec paramètres
     */
    public SyncBatchRequest(List<SyncOperation> operations, String deviceId, String appVersion) {
        this();
        this.operations = operations;
        this.deviceId = deviceId;
        this.appVersion = appVersion;
    }

    // Getters et Setters

    public List<SyncOperation> getOperations() {
        return operations;
    }

    public void setOperations(List<SyncOperation> operations) {
        this.operations = operations;
    }

    public LocalDateTime getClientTimestamp() {
        return clientTimestamp;
    }

    public void setClientTimestamp(LocalDateTime clientTimestamp) {
        this.clientTimestamp = clientTimestamp;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public String getAppVersion() {
        return appVersion;
    }

    public void setAppVersion(String appVersion) {
        this.appVersion = appVersion;
    }

    public String getSyncSessionId() {
        return syncSessionId;
    }

    public void setSyncSessionId(String syncSessionId) {
        this.syncSessionId = syncSessionId;
    }

    /**
     * Classe interne pour représenter une opération de synchronisation
     */
    public static class SyncOperation {

        @NotNull(message = "Le type d'entité ne peut pas être nul")
        @JsonProperty("entity_type")
        private EntityType entityType;

        @NotNull(message = "Le type d'opération ne peut pas être nul")
        @JsonProperty("operation_type")
        private OperationType operationType;

        @NotNull(message = "L'ID de l'entité ne peut pas être nul")
        @JsonProperty("entity_id")
        private String entityId;

        @JsonProperty("local_id")
        private String localId;

        @JsonProperty("entity_data")
        private Object entityData;

        @JsonProperty("timestamp")
        private LocalDateTime timestamp;

        @JsonProperty("priority")
        private Integer priority;

        @JsonProperty("retry_count")
        private Integer retryCount;

        /**
         * Constructeur par défaut
         */
        public SyncOperation() {
            this.timestamp = LocalDateTime.now();
            this.priority = 1;
            this.retryCount = 0;
        }

        /**
         * Constructeur avec paramètres principaux
         */
        public SyncOperation(EntityType entityType, OperationType operationType,
                String entityId, Object entityData) {
            this();
            this.entityType = entityType;
            this.operationType = operationType;
            this.entityId = entityId;
            this.entityData = entityData;
        }

        // Getters et Setters

        public EntityType getEntityType() {
            return entityType;
        }

        public void setEntityType(EntityType entityType) {
            this.entityType = entityType;
        }

        public OperationType getOperationType() {
            return operationType;
        }

        public void setOperationType(OperationType operationType) {
            this.operationType = operationType;
        }

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

        public Object getEntityData() {
            return entityData;
        }

        public void setEntityData(Object entityData) {
            this.entityData = entityData;
        }

        public LocalDateTime getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }

        public Integer getPriority() {
            return priority;
        }

        public void setPriority(Integer priority) {
            this.priority = priority;
        }

        public Integer getRetryCount() {
            return retryCount;
        }

        public void setRetryCount(Integer retryCount) {
            this.retryCount = retryCount;
        }
    }

    /**
     * Énumération pour les types d'entités
     */
    public enum EntityType {
        PRODUCT("product"),
        SALE("sale"),
        STOCK_MOVEMENT("stock_movement");

        private final String value;

        EntityType(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        @Override
        public String toString() {
            return value;
        }
    }

    /**
     * Énumération pour les types d'opérations
     */
    public enum OperationType {
        CREATE("create"),
        UPDATE("update"),
        DELETE("delete");

        private final String value;

        OperationType(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        @Override
        public String toString() {
            return value;
        }
    }
}

