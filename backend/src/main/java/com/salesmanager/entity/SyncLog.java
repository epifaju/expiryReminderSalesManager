package com.salesmanager.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entité pour les logs de synchronisation
 * Enregistre l'historique des opérations de synchronisation
 * 
 * @author Sales Manager Team
 * @version 1.0
 */
@Entity
@Table(name = "sync_logs")
public class SyncLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sync_type", nullable = false)
    private String syncType;

    @Column(name = "device_id")
    private String deviceId;

    @Column(name = "operations_count")
    private Integer operationsCount;

    @Column(name = "success_count")
    private Integer successCount;

    @Column(name = "error_count")
    private Integer errorCount;

    @Column(name = "conflict_count")
    private Integer conflictCount;

    @Column(name = "processing_time_ms")
    private Long processingTimeMs;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "app_version")
    private String appVersion;

    @Column(name = "sync_session_id")
    private String syncSessionId;

    /**
     * Constructeur par défaut
     */
    public SyncLog() {
        this.timestamp = LocalDateTime.now();
    }

    // Getters et Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSyncType() {
        return syncType;
    }

    public void setSyncType(String syncType) {
        this.syncType = syncType;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public Integer getOperationsCount() {
        return operationsCount;
    }

    public void setOperationsCount(Integer operationsCount) {
        this.operationsCount = operationsCount;
    }

    public Integer getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(Integer successCount) {
        this.successCount = successCount;
    }

    public Integer getErrorCount() {
        return errorCount;
    }

    public void setErrorCount(Integer errorCount) {
        this.errorCount = errorCount;
    }

    public Integer getConflictCount() {
        return conflictCount;
    }

    public void setConflictCount(Integer conflictCount) {
        this.conflictCount = conflictCount;
    }

    public Long getProcessingTimeMs() {
        return processingTimeMs;
    }

    public void setProcessingTimeMs(Long processingTimeMs) {
        this.processingTimeMs = processingTimeMs;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
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

