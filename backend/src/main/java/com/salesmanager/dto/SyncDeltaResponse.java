package com.salesmanager.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTO pour la réponse de synchronisation delta
 * Contient les modifications serveur depuis la dernière synchronisation
 * 
 * @author Sales Manager Team
 * @version 1.0
 */
public class SyncDeltaResponse {

    @JsonProperty("modified_entities")
    private List<ModifiedEntity> modifiedEntities;

    @JsonProperty("deleted_entities")
    private List<DeletedEntity> deletedEntities;

    @JsonProperty("total_modified")
    private int totalModified;

    @JsonProperty("total_deleted")
    private int totalDeleted;

    @JsonProperty("server_timestamp")
    private LocalDateTime serverTimestamp;

    @JsonProperty("sync_session_id")
    private String syncSessionId;

    @JsonProperty("has_more")
    private boolean hasMore;

    @JsonProperty("next_sync_timestamp")
    private LocalDateTime nextSyncTimestamp;

    @JsonProperty("statistics")
    private DeltaStatistics statistics;

    /**
     * Constructeur par défaut
     */
    public SyncDeltaResponse() {
        this.serverTimestamp = LocalDateTime.now();
        this.totalModified = 0;
        this.totalDeleted = 0;
        this.hasMore = false;
    }

    /**
     * Constructeur avec paramètres
     */
    public SyncDeltaResponse(List<ModifiedEntity> modifiedEntities,
            List<DeletedEntity> deletedEntities) {
        this();
        this.modifiedEntities = modifiedEntities;
        this.deletedEntities = deletedEntities;
        this.totalModified = modifiedEntities != null ? modifiedEntities.size() : 0;
        this.totalDeleted = deletedEntities != null ? deletedEntities.size() : 0;
    }

    // Getters et Setters

    public List<ModifiedEntity> getModifiedEntities() {
        return modifiedEntities;
    }

    public void setModifiedEntities(List<ModifiedEntity> modifiedEntities) {
        this.modifiedEntities = modifiedEntities;
        this.totalModified = modifiedEntities != null ? modifiedEntities.size() : 0;
    }

    public List<DeletedEntity> getDeletedEntities() {
        return deletedEntities;
    }

    public void setDeletedEntities(List<DeletedEntity> deletedEntities) {
        this.deletedEntities = deletedEntities;
        this.totalDeleted = deletedEntities != null ? deletedEntities.size() : 0;
    }

    public int getTotalModified() {
        return totalModified;
    }

    public void setTotalModified(int totalModified) {
        this.totalModified = totalModified;
    }

    public int getTotalDeleted() {
        return totalDeleted;
    }

    public void setTotalDeleted(int totalDeleted) {
        this.totalDeleted = totalDeleted;
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

    public boolean isHasMore() {
        return hasMore;
    }

    public void setHasMore(boolean hasMore) {
        this.hasMore = hasMore;
    }

    public LocalDateTime getNextSyncTimestamp() {
        return nextSyncTimestamp;
    }

    public void setNextSyncTimestamp(LocalDateTime nextSyncTimestamp) {
        this.nextSyncTimestamp = nextSyncTimestamp;
    }

    public DeltaStatistics getStatistics() {
        return statistics;
    }

    public void setStatistics(DeltaStatistics statistics) {
        this.statistics = statistics;
    }

    /**
     * Classe pour représenter une entité modifiée
     */
    public static class ModifiedEntity {

        @JsonProperty("entity_id")
        private String entityId;

        @JsonProperty("entity_type")
        private String entityType;

        @JsonProperty("entity_data")
        private Object entityData;

        @JsonProperty("last_modified")
        private LocalDateTime lastModified;

        @JsonProperty("version")
        private Long version;

        @JsonProperty("operation_type")
        private String operationType;

        /**
         * Constructeur par défaut
         */
        public ModifiedEntity() {
        }

        /**
         * Constructeur avec paramètres
         */
        public ModifiedEntity(String entityId, String entityType, Object entityData,
                LocalDateTime lastModified) {
            this.entityId = entityId;
            this.entityType = entityType;
            this.entityData = entityData;
            this.lastModified = lastModified;
            this.version = 1L;
            this.operationType = "update";
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

        public Object getEntityData() {
            return entityData;
        }

        public void setEntityData(Object entityData) {
            this.entityData = entityData;
        }

        public LocalDateTime getLastModified() {
            return lastModified;
        }

        public void setLastModified(LocalDateTime lastModified) {
            this.lastModified = lastModified;
        }

        public Long getVersion() {
            return version;
        }

        public void setVersion(Long version) {
            this.version = version;
        }

        public String getOperationType() {
            return operationType;
        }

        public void setOperationType(String operationType) {
            this.operationType = operationType;
        }
    }

    /**
     * Classe pour représenter une entité supprimée
     */
    public static class DeletedEntity {

        @JsonProperty("entity_id")
        private String entityId;

        @JsonProperty("entity_type")
        private String entityType;

        @JsonProperty("deleted_at")
        private LocalDateTime deletedAt;

        @JsonProperty("version")
        private Long version;

        /**
         * Constructeur par défaut
         */
        public DeletedEntity() {
        }

        /**
         * Constructeur avec paramètres
         */
        public DeletedEntity(String entityId, String entityType, LocalDateTime deletedAt) {
            this.entityId = entityId;
            this.entityType = entityType;
            this.deletedAt = deletedAt;
            this.version = 1L;
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

        public LocalDateTime getDeletedAt() {
            return deletedAt;
        }

        public void setDeletedAt(LocalDateTime deletedAt) {
            this.deletedAt = deletedAt;
        }

        public Long getVersion() {
            return version;
        }

        public void setVersion(Long version) {
            this.version = version;
        }
    }

    /**
     * Classe pour les statistiques delta
     */
    public static class DeltaStatistics {

        @JsonProperty("by_entity_type")
        private Map<String, Integer> byEntityType;

        @JsonProperty("by_operation_type")
        private Map<String, Integer> byOperationType;

        @JsonProperty("oldest_modification")
        private LocalDateTime oldestModification;

        @JsonProperty("newest_modification")
        private LocalDateTime newestModification;

        @JsonProperty("total_data_size_bytes")
        private long totalDataSizeBytes;

        /**
         * Constructeur par défaut
         */
        public DeltaStatistics() {
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

        public LocalDateTime getOldestModification() {
            return oldestModification;
        }

        public void setOldestModification(LocalDateTime oldestModification) {
            this.oldestModification = oldestModification;
        }

        public LocalDateTime getNewestModification() {
            return newestModification;
        }

        public void setNewestModification(LocalDateTime newestModification) {
            this.newestModification = newestModification;
        }

        public long getTotalDataSizeBytes() {
            return totalDataSizeBytes;
        }

        public void setTotalDataSizeBytes(long totalDataSizeBytes) {
            this.totalDataSizeBytes = totalDataSizeBytes;
        }
    }
}

