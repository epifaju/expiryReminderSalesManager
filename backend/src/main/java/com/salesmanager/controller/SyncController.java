package com.salesmanager.controller;

import com.salesmanager.dto.SyncBatchRequest;
import com.salesmanager.dto.SyncBatchResponse;
import com.salesmanager.dto.SyncDeltaRequest;
import com.salesmanager.dto.SyncDeltaResponse;
import com.salesmanager.service.SyncService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour la synchronisation bidirectionnelle
 * Gère les endpoints de synchronisation batch et delta
 * 
 * @author Sales Manager Team
 * @version 1.0
 */
@RestController
@RequestMapping("/api/sync")
@CrossOrigin(origins = "*")
public class SyncController {

    @Autowired
    private SyncService syncService;

    /**
     * Endpoint pour la synchronisation batch
     * Reçoit un lot d'opérations de synchronisation depuis le client mobile
     * 
     * @param request Requête de synchronisation batch contenant les opérations
     * @return Réponse avec les résultats de synchronisation
     */
    @PostMapping("/batch")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SyncBatchResponse> syncBatch(
            @Valid @RequestBody SyncBatchRequest request) {
        SyncBatchResponse response = syncService.processBatchSync(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint pour la synchronisation delta
     * Retourne les modifications serveur depuis la dernière synchronisation
     * 
     * @param lastSyncTimestamp Timestamp de la dernière synchronisation réussie
     * @param deviceId          ID du device mobile
     * @param appVersion        Version de l'application
     * @param entityTypes       Types d'entités à synchroniser (optionnel)
     * @param limit             Limite du nombre d'entités à retourner (optionnel)
     * @param authHeader        Header d'authentification
     * @return Réponse avec les modifications serveur
     */
    @GetMapping("/delta")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SyncDeltaResponse> syncDelta(
            @RequestParam String lastSyncTimestamp,
            @RequestParam(required = false) String deviceId,
            @RequestParam(required = false) String appVersion,
            @RequestParam(required = false) List<String> entityTypes,
            @RequestParam(required = false, defaultValue = "100") Integer limit) {

        SyncDeltaRequest request = new SyncDeltaRequest();
        request.setLastSyncTimestamp(java.time.LocalDateTime.parse(lastSyncTimestamp));
        request.setDeviceId(deviceId);
        request.setAppVersion(appVersion);
        request.setEntityTypes(entityTypes);
        request.setLimit(limit);

        SyncDeltaResponse response = syncService.processDeltaSync(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint pour vérifier l'état de la synchronisation
     * Retourne des informations sur l'état du serveur
     * 
     * @return Informations sur l'état de synchronisation
     */
    @GetMapping("/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> syncStatus() {
        var status = syncService.getSyncStatus();
        return ResponseEntity.ok(status);
    }

    /**
     * Endpoint pour forcer la synchronisation
     * Déclenche une synchronisation complète
     * 
     * @return Confirmation de la synchronisation forcée
     */
    @PostMapping("/force")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<String> forceSync() {
        syncService.forceSync();
        return ResponseEntity.ok("Synchronisation forcée déclenchée");
    }

    /**
     * Endpoint pour récupérer les conflits en attente
     * Retourne la liste des conflits nécessitant une résolution manuelle
     * 
     * @return Liste des conflits en attente
     */
    @GetMapping("/conflicts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<?>> getConflicts() {
        List<?> conflicts = syncService.getPendingConflicts();
        return ResponseEntity.ok(conflicts);
    }

    /**
     * Endpoint pour résoudre un conflit
     * Permet de résoudre manuellement un conflit spécifique
     * 
     * @param conflictId ID du conflit à résoudre
     * @param resolution Résolution choisie (local, server, merge)
     * @return Confirmation de la résolution
     */
    @PostMapping("/conflicts/{conflictId}/resolve")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> resolveConflict(
            @PathVariable String conflictId,
            @RequestParam String resolution) {
        syncService.resolveConflict(conflictId, resolution);
        return ResponseEntity.ok("Conflit résolu avec succès");
    }
}
