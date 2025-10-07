package com.salesmanager.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entité représentant un conflit de synchronisation
 * Utilisée pour tracker et résoudre les conflits entre données locales et
 * serveur
 * 
 * @author Sales Manager Team
 * @version 1.0
 */
@Entity
@Table(name = "sync_conflicts")
public class SyncConflict {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private String entityId;

    @Column(name = "local_data", columnDefinition = "TEXT", nullable = false)
    private String localData;

    @Column(name = "server_data", columnDefinition = "TEXT", nullable = false)
    private String serverData;

    @Column(name = "conflict_type", length = 50)
    private String conflictType; // VERSION_MISMATCH, UPDATE_DELETE, DELETE_UPDATE, etc.

    @Column(name = "resolution_strategy", length = 50)
    private String resolutionStrategy; // SERVER_WINS, CLIENT_WINS, MANUAL, MERGED

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "resolved_by")
    private String resolvedBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "local_version")
    private Integer localVersion;

    @Column(name = "server_version")
    private Integer serverVersion;

    @Column(name = "conflict_details", columnDefinition = "TEXT")
    private String conflictDetails;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }

    public String getLocalData() {
        return localData;
    }

    public void setLocalData(String localData) {
        this.localData = localData;
    }

    public String getServerData() {
        return serverData;
    }

    public void setServerData(String serverData) {
        this.serverData = serverData;
    }

    public String getConflictType() {
        return conflictType;
    }

    public void setConflictType(String conflictType) {
        this.conflictType = conflictType;
    }

    public String getResolutionStrategy() {
        return resolutionStrategy;
    }

    public void setResolutionStrategy(String resolutionStrategy) {
        this.resolutionStrategy = resolutionStrategy;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public String getResolvedBy() {
        return resolvedBy;
    }

    public void setResolvedBy(String resolvedBy) {
        this.resolvedBy = resolvedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getLocalVersion() {
        return localVersion;
    }

    public void setLocalVersion(Integer localVersion) {
        this.localVersion = localVersion;
    }

    public Integer getServerVersion() {
        return serverVersion;
    }

    public void setServerVersion(Integer serverVersion) {
        this.serverVersion = serverVersion;
    }

    public String getConflictDetails() {
        return conflictDetails;
    }

    public void setConflictDetails(String conflictDetails) {
        this.conflictDetails = conflictDetails;
    }
}
