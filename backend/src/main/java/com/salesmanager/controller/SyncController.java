package com.salesmanager.controller;

import com.salesmanager.dto.SyncBatchRequest;
import com.salesmanager.dto.SyncBatchResponse;
import com.salesmanager.dto.SyncDeltaRequest;
import com.salesmanager.dto.SyncDeltaResponse;
import com.salesmanager.service.SyncService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<SyncBatchResponse> syncBatch(
            @Valid @RequestBody SyncBatchRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        try {
            // Log de la requête reçue
            System.out.println("[SYNC_CONTROLLER] Requête batch reçue: " +
                    request.getOperations().size() + " opérations");

            // Validation de l'authentification (si nécessaire)
            if (authHeader != null && !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Traitement de la synchronisation batch
            SyncBatchResponse response = syncService.processBatchSync(request);

            // Log de la réponse
            System.out.println("[SYNC_CONTROLLER] Réponse batch: " +
                    response.getSuccessCount() + " succès, " +
                    response.getConflictCount() + " conflits, " +
                    response.getErrorCount() + " erreurs");

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            System.err.println("[SYNC_CONTROLLER] Erreur de validation: " + e.getMessage());
            return ResponseEntity.badRequest().build();

        } catch (Exception e) {
            System.err.println("[SYNC_CONTROLLER] Erreur interne: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
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
    public ResponseEntity<SyncDeltaResponse> syncDelta(
            @RequestParam String lastSyncTimestamp,
            @RequestParam(required = false) String deviceId,
            @RequestParam(required = false) String appVersion,
            @RequestParam(required = false) List<String> entityTypes,
            @RequestParam(required = false, defaultValue = "100") Integer limit,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        try {
            // Log de la requête reçue
            System.out.println("[SYNC_CONTROLLER] Requête delta reçue depuis: " + lastSyncTimestamp);

            // Validation de l'authentification (si nécessaire)
            if (authHeader != null && !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Création de la requête delta
            SyncDeltaRequest request = new SyncDeltaRequest();
            request.setLastSyncTimestamp(java.time.LocalDateTime.parse(lastSyncTimestamp));
            request.setDeviceId(deviceId);
            request.setAppVersion(appVersion);
            request.setEntityTypes(entityTypes);
            request.setLimit(limit);

            // Traitement de la synchronisation delta
            SyncDeltaResponse response = syncService.processDeltaSync(request);

            // Log de la réponse
            System.out.println("[SYNC_CONTROLLER] Réponse delta: " +
                    response.getModifiedEntities().size() + " entités modifiées");

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            System.err.println("[SYNC_CONTROLLER] Erreur de validation delta: " + e.getMessage());
            return ResponseEntity.badRequest().build();

        } catch (Exception e) {
            System.err.println("[SYNC_CONTROLLER] Erreur interne delta: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Endpoint pour vérifier l'état de la synchronisation
     * Retourne des informations sur l'état du serveur
     * 
     * @return Informations sur l'état de synchronisation
     */
    @GetMapping("/status")
    public ResponseEntity<?> syncStatus() {
        try {
            // Log de la requête de statut
            System.out.println("[SYNC_CONTROLLER] Requête de statut reçue");

            // Récupération du statut de synchronisation
            var status = syncService.getSyncStatus();

            return ResponseEntity.ok(status);

        } catch (Exception e) {
            System.err.println("[SYNC_CONTROLLER] Erreur statut: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Endpoint pour forcer la synchronisation
     * Déclenche une synchronisation complète
     * 
     * @return Confirmation de la synchronisation forcée
     */
    @PostMapping("/force")
    public ResponseEntity<?> forceSync(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        try {
            // Log de la requête de synchronisation forcée
            System.out.println("[SYNC_CONTROLLER] Synchronisation forcée demandée");

            // Validation de l'authentification (si nécessaire)
            if (authHeader != null && !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Déclenchement de la synchronisation forcée
            syncService.forceSync();

            return ResponseEntity.ok("Synchronisation forcée déclenchée");

        } catch (Exception e) {
            System.err.println("[SYNC_CONTROLLER] Erreur synchronisation forcée: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Endpoint pour récupérer les conflits en attente
     * Retourne la liste des conflits nécessitant une résolution manuelle
     * 
     * @return Liste des conflits en attente
     */
    @GetMapping("/conflicts")
    public ResponseEntity<List<?>> getConflicts(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        try {
            // Log de la requête de conflits
            System.out.println("[SYNC_CONTROLLER] Requête de conflits reçue");

            // Validation de l'authentification (si nécessaire)
            if (authHeader != null && !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Récupération des conflits
            List<?> conflicts = syncService.getPendingConflicts();

            return ResponseEntity.ok(conflicts);

        } catch (Exception e) {
            System.err.println("[SYNC_CONTROLLER] Erreur récupération conflits: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
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
    public ResponseEntity<?> resolveConflict(
            @PathVariable String conflictId,
            @RequestParam String resolution,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        try {
            // Log de la résolution de conflit
            System.out.println("[SYNC_CONTROLLER] Résolution conflit " + conflictId +
                    " avec stratégie: " + resolution);

            // Validation de l'authentification (si nécessaire)
            if (authHeader != null && !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Résolution du conflit
            syncService.resolveConflict(conflictId, resolution);

            return ResponseEntity.ok("Conflit résolu avec succès");

        } catch (IllegalArgumentException e) {
            System.err.println("[SYNC_CONTROLLER] Erreur validation résolution: " + e.getMessage());
            return ResponseEntity.badRequest().build();

        } catch (Exception e) {
            System.err.println("[SYNC_CONTROLLER] Erreur résolution conflit: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
