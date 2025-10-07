package com.salesmanager.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO pour la requête de synchronisation delta
 * Contient les informations pour récupérer les modifications serveur
 * 
 * @author Sales Manager Team
 * @version 1.0
 */
public class SyncDeltaRequest {

    @NotNull(message = "Le timestamp de dernière synchronisation ne peut pas être nul")
    @JsonProperty("last_sync_timestamp")
    private LocalDateTime lastSyncTimestamp;

    @JsonProperty("entity_types")
    private List<String> entityTypes;

    @JsonProperty("limit")
    private Integer limit;

    @JsonProperty("device_id")
    private String deviceId;

    @JsonProperty("app_version")
    private String appVersion;

    @JsonProperty("sync_session_id")
    private String syncSessionId;

    /**
     * Constructeur par défaut
     */
    public SyncDeltaRequest() {
        this.limit = 100; // Limite par défaut
    }

    /**
     * Constructeur avec timestamp
     */
    public SyncDeltaRequest(LocalDateTime lastSyncTimestamp) {
        this();
        this.lastSyncTimestamp = lastSyncTimestamp;
    }

    /**
     * Constructeur avec paramètres
     */
    public SyncDeltaRequest(LocalDateTime lastSyncTimestamp, List<String> entityTypes,
            Integer limit) {
        this(lastSyncTimestamp);
        this.entityTypes = entityTypes;
        this.limit = limit != null ? limit : 100;
    }

    // Getters et Setters

    public LocalDateTime getLastSyncTimestamp() {
        return lastSyncTimestamp;
    }

    public void setLastSyncTimestamp(LocalDateTime lastSyncTimestamp) {
        this.lastSyncTimestamp = lastSyncTimestamp;
    }

    public List<String> getEntityTypes() {
        return entityTypes;
    }

    public void setEntityTypes(List<String> entityTypes) {
        this.entityTypes = entityTypes;
    }

    public Integer getLimit() {
        return limit;
    }

    public void setLimit(Integer limit) {
        this.limit = limit;
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
}

