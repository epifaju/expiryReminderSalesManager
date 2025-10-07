package com.salesmanager.exception;

import com.salesmanager.entity.SyncConflict;

/**
 * Exception levée lors de la détection d'un conflit de synchronisation
 * Contient les informations du conflit pour traitement
 * 
 * @author Sales Manager Team
 * @version 1.0
 */
public class ConflictException extends RuntimeException {

    private final SyncConflict conflict;
    private final String conflictType;
    private final Object localData;
    private final Object serverData;

    /**
     * Constructeur avec conflit persisté
     */
    public ConflictException(String message, SyncConflict conflict) {
        super(message);
        this.conflict = conflict;
        this.conflictType = conflict != null ? conflict.getConflictType() : null;
        this.localData = null;
        this.serverData = null;
    }

    /**
     * Constructeur avec données de conflit
     */
    public ConflictException(String message, String conflictType, Object localData, Object serverData) {
        super(message);
        this.conflictType = conflictType;
        this.localData = localData;
        this.serverData = serverData;
        this.conflict = null;
    }

    /**
     * Constructeur simple
     */
    public ConflictException(String message) {
        super(message);
        this.conflict = null;
        this.conflictType = null;
        this.localData = null;
        this.serverData = null;
    }

    public SyncConflict getConflict() {
        return conflict;
    }

    public String getConflictType() {
        return conflictType;
    }

    public Object getLocalData() {
        return localData;
    }

    public Object getServerData() {
        return serverData;
    }
}
