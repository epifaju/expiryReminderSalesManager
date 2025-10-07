package com.salesmanager.service;

import com.salesmanager.dto.*;
import com.salesmanager.entity.Product;
import com.salesmanager.entity.Sale;
import com.salesmanager.entity.StockMovement;
import com.salesmanager.entity.SyncConflict;
import com.salesmanager.entity.SyncLog;
import com.salesmanager.exception.ConflictException;
import com.salesmanager.repository.ProductRepository;
import com.salesmanager.repository.SaleRepository;
import com.salesmanager.repository.StockMovementRepository;
import com.salesmanager.repository.SyncConflictRepository;
import com.salesmanager.repository.SyncLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Service de synchronisation bidirectionnelle
 * Gère le traitement des opérations de synchronisation batch et delta
 * 
 * @author Sales Manager Team
 * @version 1.0
 */
@Service
@Transactional
public class SyncService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    @Autowired
    private SyncLogRepository syncLogRepository;

    @Autowired
    private SyncConflictRepository syncConflictRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Traite une synchronisation batch
     * 
     * @param request Requête de synchronisation batch
     * @return Réponse avec les résultats du traitement
     */
    public SyncBatchResponse processBatchSync(SyncBatchRequest request) {
        long startTime = System.currentTimeMillis();

        System.out.println("[SYNC_SERVICE] Début du traitement batch: " +
                request.getOperations().size() + " opérations");

        SyncBatchResponse response = new SyncBatchResponse();
        response.setSyncSessionId(UUID.randomUUID().toString());

        List<SyncBatchResponse.OperationResult> results = new ArrayList<>();
        List<SyncBatchResponse.SyncConflict> conflicts = new ArrayList<>();
        List<SyncBatchResponse.SyncError> errors = new ArrayList<>();

        // Statistiques
        Map<String, Integer> byEntityType = new ConcurrentHashMap<>();
        Map<String, Integer> byOperationType = new ConcurrentHashMap<>();

        // Traitement des opérations
        for (SyncBatchRequest.SyncOperation operation : request.getOperations()) {
            try {
                SyncBatchResponse.OperationResult result = processOperation(operation, request);
                results.add(result);

                // Mise à jour des statistiques
                byEntityType.merge(operation.getEntityType().getValue(), 1, Integer::sum);
                byOperationType.merge(operation.getOperationType().getValue(), 1, Integer::sum);

                // Détermination du statut
                switch (result.getStatus()) {
                    case SUCCESS -> response.setSuccessCount(response.getSuccessCount() + 1);
                    case CONFLICT -> {
                        response.setConflictCount(response.getConflictCount() + 1);
                        // Création d'un conflit si nécessaire
                        if (result.getMessage() != null && result.getMessage().contains("conflit")) {
                            conflicts.add(createConflict(operation, result));
                        }
                    }
                    case FAILED -> {
                        response.setErrorCount(response.getErrorCount() + 1);
                        errors.add(createError(operation, result.getMessage()));
                    }
                }

            } catch (Exception e) {
                System.err.println("[SYNC_SERVICE] Erreur traitement opération " +
                        operation.getEntityId() + ": " + e.getMessage());

                response.setErrorCount(response.getErrorCount() + 1);
                errors.add(createError(operation, e.getMessage()));

                SyncBatchResponse.OperationResult errorResult = new SyncBatchResponse.OperationResult();
                errorResult.setEntityId(operation.getEntityId());
                errorResult.setEntityType(operation.getEntityType().getValue());
                errorResult.setOperationType(operation.getOperationType().getValue());
                errorResult.setStatus(SyncBatchResponse.OperationStatus.FAILED);
                errorResult.setMessage(e.getMessage());
                results.add(errorResult);
            }
        }

        // Finalisation de la réponse
        response.setTotalProcessed(request.getOperations().size());
        response.setProcessingTimeMs(System.currentTimeMillis() - startTime);
        response.setResults(results);
        response.setConflicts(conflicts);
        response.setErrors(errors);

        // Création des statistiques
        SyncBatchResponse.SyncStatistics statistics = new SyncBatchResponse.SyncStatistics();
        statistics.setByEntityType(byEntityType);
        statistics.setByOperationType(byOperationType);
        statistics.setAverageProcessingTimeMs(response.getProcessingTimeMs() / (double) response.getTotalProcessed());
        response.setStatistics(statistics);

        // Log de la synchronisation
        logSyncOperation(request, response);

        System.out.println("[SYNC_SERVICE] Fin du traitement batch: " +
                response.getSuccessCount() + " succès, " +
                response.getConflictCount() + " conflits, " +
                response.getErrorCount() + " erreurs");

        return response;
    }

    /**
     * Traite une opération individuelle
     */
    private SyncBatchResponse.OperationResult processOperation(
            SyncBatchRequest.SyncOperation operation,
            SyncBatchRequest request) {

        SyncBatchResponse.OperationResult result = new SyncBatchResponse.OperationResult();
        result.setEntityId(operation.getEntityId());
        result.setLocalId(operation.getLocalId());
        result.setEntityType(operation.getEntityType().getValue());
        result.setOperationType(operation.getOperationType().getValue());

        try {
            switch (operation.getEntityType()) {
                case PRODUCT -> {
                    result.setServerId(processProductOperation(operation));
                    result.setStatus(SyncBatchResponse.OperationStatus.SUCCESS);
                    result.setMessage("Produit synchronisé avec succès");
                }
                case SALE -> {
                    result.setServerId(processSaleOperation(operation));
                    result.setStatus(SyncBatchResponse.OperationStatus.SUCCESS);
                    result.setMessage("Vente synchronisée avec succès");
                }
                case STOCK_MOVEMENT -> {
                    result.setServerId(processStockMovementOperation(operation));
                    result.setStatus(SyncBatchResponse.OperationStatus.SUCCESS);
                    result.setMessage("Mouvement de stock synchronisé avec succès");
                }
                default -> {
                    result.setStatus(SyncBatchResponse.OperationStatus.FAILED);
                    result.setMessage("Type d'entité non supporté: " + operation.getEntityType());
                }
            }
        } catch (ConflictException e) {
            result.setStatus(SyncBatchResponse.OperationStatus.CONFLICT);
            result.setMessage("Conflit détecté: " + e.getMessage());
        } catch (Exception e) {
            result.setStatus(SyncBatchResponse.OperationStatus.FAILED);
            result.setMessage("Erreur de traitement: " + e.getMessage());
        }

        return result;
    }

    /**
     * Traite une opération sur un produit avec détection de conflits
     */
    private String processProductOperation(SyncBatchRequest.SyncOperation operation) {
        Map<String, Object> data = (Map<String, Object>) operation.getEntityData();

        switch (operation.getOperationType()) {
            case CREATE -> {
                Product product = new Product();
                product.setName((String) data.get("name"));
                product.setDescription((String) data.get("description"));
                product.setSellingPrice(new java.math.BigDecimal(data.get("price").toString()));
                product.setCategory((String) data.get("category"));
                product.setStockQuantity(Integer.parseInt(data.get("stock_quantity").toString()));
                product.setCreatedAt(LocalDateTime.now());
                product.setUpdatedAt(LocalDateTime.now());

                Product saved = productRepository.save(product);
                return saved.getId().toString();
            }
            case UPDATE -> {
                Optional<Product> existing = productRepository.findById(Long.parseLong(operation.getEntityId()));
                if (existing.isPresent()) {
                    Product currentProduct = existing.get();

                    // Détection de conflit : vérifier si updated_at est différent
                    String clientUpdatedAt = (String) data.get("updated_at");
                    if (clientUpdatedAt != null && !clientUpdatedAt.isEmpty()) {
                        LocalDateTime clientTimestamp = LocalDateTime.parse(clientUpdatedAt);
                        LocalDateTime serverTimestamp = currentProduct.getUpdatedAt();

                        // Conflit détecté si les timestamps ne correspondent pas
                        if (serverTimestamp != null && !serverTimestamp.equals(clientTimestamp)) {
                            System.out.println("[SYNC_SERVICE] Conflit détecté pour produit " +
                                    operation.getEntityId() +
                                    " - Server: " + serverTimestamp +
                                    " vs Client: " + clientTimestamp);

                            // Créer et persister le conflit
                            SyncConflict conflict = createAndSaveConflict(
                                    operation,
                                    currentProduct,
                                    "VERSION_MISMATCH");

                            throw new ConflictException(
                                    "Conflit de version détecté pour le produit " + operation.getEntityId(),
                                    conflict);
                        }
                    }

                    // Pas de conflit, appliquer la mise à jour
                    currentProduct.setName((String) data.get("name"));
                    currentProduct.setDescription((String) data.get("description"));
                    currentProduct.setSellingPrice(new java.math.BigDecimal(data.get("price").toString()));
                    currentProduct.setCategory((String) data.get("category"));
                    currentProduct.setStockQuantity(Integer.parseInt(data.get("stock_quantity").toString()));
                    currentProduct.setUpdatedAt(LocalDateTime.now());

                    Product saved = productRepository.save(currentProduct);
                    return saved.getId().toString();
                } else {
                    throw new IllegalArgumentException("Produit non trouvé: " + operation.getEntityId());
                }
            }
            case DELETE -> {
                Optional<Product> existing = productRepository.findById(Long.parseLong(operation.getEntityId()));
                if (existing.isPresent()) {
                    // Vérifier si le produit a été modifié entre-temps (conflit UPDATE_DELETE)
                    Product currentProduct = existing.get();
                    String clientUpdatedAt = (String) data.get("updated_at");

                    if (clientUpdatedAt != null && !clientUpdatedAt.isEmpty()) {
                        LocalDateTime clientTimestamp = LocalDateTime.parse(clientUpdatedAt);
                        LocalDateTime serverTimestamp = currentProduct.getUpdatedAt();

                        if (serverTimestamp != null && serverTimestamp.isAfter(clientTimestamp)) {
                            // Le produit a été modifié sur le serveur depuis que le client l'a supprimé
                            SyncConflict conflict = createAndSaveConflict(
                                    operation,
                                    currentProduct,
                                    "DELETE_UPDATE");

                            throw new ConflictException(
                                    "Le produit a été modifié sur le serveur après votre tentative de suppression",
                                    conflict);
                        }
                    }

                    productRepository.deleteById(Long.parseLong(operation.getEntityId()));
                }
                return operation.getEntityId();
            }
            default -> throw new IllegalArgumentException("Type d'opération non supporté");
        }
    }

    /**
     * Traite une opération sur une vente
     */
    private String processSaleOperation(SyncBatchRequest.SyncOperation operation) {
        Map<String, Object> data = (Map<String, Object>) operation.getEntityData();

        switch (operation.getOperationType()) {
            case CREATE -> {
                Sale sale = new Sale();
                sale.setTotalAmount(new java.math.BigDecimal(data.get("amount").toString()));
                sale.setCustomerName((String) data.get("customer_name"));
                sale.setSaleDate(LocalDateTime.now());
                sale.setCreatedAt(LocalDateTime.now());
                sale.setUpdatedAt(LocalDateTime.now());

                Sale saved = saleRepository.save(sale);
                return saved.getId().toString();
            }
            case UPDATE -> {
                Optional<Sale> existing = saleRepository.findById(Long.parseLong(operation.getEntityId()));
                if (existing.isPresent()) {
                    Sale sale = existing.get();
                    sale.setTotalAmount(new java.math.BigDecimal(data.get("amount").toString()));
                    sale.setCustomerName((String) data.get("customer_name"));
                    sale.setUpdatedAt(LocalDateTime.now());

                    Sale saved = saleRepository.save(sale);
                    return saved.getId().toString();
                } else {
                    throw new IllegalArgumentException("Vente non trouvée: " + operation.getEntityId());
                }
            }
            case DELETE -> {
                saleRepository.deleteById(Long.parseLong(operation.getEntityId()));
                return operation.getEntityId();
            }
            default -> throw new IllegalArgumentException("Type d'opération non supporté");
        }
    }

    /**
     * Traite une opération sur un mouvement de stock
     */
    private String processStockMovementOperation(SyncBatchRequest.SyncOperation operation) {
        Map<String, Object> data = (Map<String, Object>) operation.getEntityData();

        switch (operation.getOperationType()) {
            case CREATE -> {
                StockMovement movement = new StockMovement();
                movement.setProductId(Long.parseLong(data.get("product_id").toString()));
                movement.setQuantity(Integer.parseInt(data.get("quantity").toString()));
                movement.setMovementType((String) data.get("movement_type"));
                movement.setReason((String) data.get("reason"));
                movement.setCreatedAt(LocalDateTime.now());
                movement.setUpdatedAt(LocalDateTime.now());

                StockMovement saved = stockMovementRepository.save(movement);
                return saved.getId().toString();
            }
            case UPDATE -> {
                Optional<StockMovement> existing = stockMovementRepository
                        .findById(Long.parseLong(operation.getEntityId()));
                if (existing.isPresent()) {
                    StockMovement movement = existing.get();
                    movement.setProductId(Long.parseLong(data.get("product_id").toString()));
                    movement.setQuantity(Integer.parseInt(data.get("quantity").toString()));
                    movement.setMovementType((String) data.get("movement_type"));
                    movement.setReason((String) data.get("reason"));
                    movement.setUpdatedAt(LocalDateTime.now());

                    StockMovement saved = stockMovementRepository.save(movement);
                    return saved.getId().toString();
                } else {
                    throw new IllegalArgumentException("Mouvement de stock non trouvé: " + operation.getEntityId());
                }
            }
            case DELETE -> {
                stockMovementRepository.deleteById(Long.parseLong(operation.getEntityId()));
                return operation.getEntityId();
            }
            default -> throw new IllegalArgumentException("Type d'opération non supporté");
        }
    }

    /**
     * Traite une synchronisation delta
     * Récupère les modifications serveur depuis la dernière synchronisation
     */
    public SyncDeltaResponse processDeltaSync(SyncDeltaRequest request) {
        long startTime = System.currentTimeMillis();

        System.out.println("[SYNC_SERVICE] Début du traitement delta depuis: " +
                request.getLastSyncTimestamp() +
                " (device: " + request.getDeviceId() + ")");

        SyncDeltaResponse response = new SyncDeltaResponse();
        response.setSyncSessionId(UUID.randomUUID().toString());

        List<SyncDeltaResponse.ModifiedEntity> modifiedEntities = new ArrayList<>();
        List<SyncDeltaResponse.DeletedEntity> deletedEntities = new ArrayList<>();

        LocalDateTime since = request.getLastSyncTimestamp();
        int limit = request.getLimit() != null ? request.getLimit() : 100;

        // Statistiques pour le delta
        Map<String, Integer> byEntityType = new ConcurrentHashMap<>();
        Map<String, Integer> byOperationType = new ConcurrentHashMap<>();
        LocalDateTime oldestModification = null;
        LocalDateTime newestModification = null;

        // Récupération des entités modifiées par type
        if (request.getEntityTypes() == null || request.getEntityTypes().contains("product")) {
            List<Product> modifiedProducts = productRepository.findByUpdatedAtAfter(since);
            for (Product product : modifiedProducts) {
                if (modifiedEntities.size() >= limit) {
                    response.setHasMore(true);
                    break;
                }

                SyncDeltaResponse.ModifiedEntity entity = new SyncDeltaResponse.ModifiedEntity();
                entity.setEntityId(product.getId().toString());
                entity.setEntityType("product");
                entity.setEntityData(convertProductToMap(product));
                entity.setLastModified(product.getUpdatedAt());
                entity.setOperationType("update");
                modifiedEntities.add(entity);

                // Mise à jour des statistiques
                byEntityType.merge("product", 1, Integer::sum);
                byOperationType.merge("update", 1, Integer::sum);

                // Tracking des dates
                if (oldestModification == null || product.getUpdatedAt().isBefore(oldestModification)) {
                    oldestModification = product.getUpdatedAt();
                }
                if (newestModification == null || product.getUpdatedAt().isAfter(newestModification)) {
                    newestModification = product.getUpdatedAt();
                }
            }
        }

        if (request.getEntityTypes() == null || request.getEntityTypes().contains("sale")) {
            List<Sale> modifiedSales = saleRepository.findByUpdatedAtAfter(since);
            for (Sale sale : modifiedSales) {
                if (modifiedEntities.size() >= limit) {
                    response.setHasMore(true);
                    break;
                }

                SyncDeltaResponse.ModifiedEntity entity = new SyncDeltaResponse.ModifiedEntity();
                entity.setEntityId(sale.getId().toString());
                entity.setEntityType("sale");
                entity.setEntityData(convertSaleToMap(sale));
                entity.setLastModified(sale.getUpdatedAt());
                entity.setOperationType("update");
                modifiedEntities.add(entity);

                // Mise à jour des statistiques
                byEntityType.merge("sale", 1, Integer::sum);
                byOperationType.merge("update", 1, Integer::sum);

                // Tracking des dates
                if (oldestModification == null || sale.getUpdatedAt().isBefore(oldestModification)) {
                    oldestModification = sale.getUpdatedAt();
                }
                if (newestModification == null || sale.getUpdatedAt().isAfter(newestModification)) {
                    newestModification = sale.getUpdatedAt();
                }
            }
        }

        if (request.getEntityTypes() == null || request.getEntityTypes().contains("stock_movement")) {
            List<StockMovement> modifiedMovements = stockMovementRepository.findByUpdatedAtAfter(since);
            for (StockMovement movement : modifiedMovements) {
                if (modifiedEntities.size() >= limit) {
                    response.setHasMore(true);
                    break;
                }

                SyncDeltaResponse.ModifiedEntity entity = new SyncDeltaResponse.ModifiedEntity();
                entity.setEntityId(movement.getId().toString());
                entity.setEntityType("stock_movement");
                entity.setEntityData(convertStockMovementToMap(movement));
                entity.setLastModified(movement.getUpdatedAt());
                entity.setOperationType("update");
                modifiedEntities.add(entity);

                // Mise à jour des statistiques
                byEntityType.merge("stock_movement", 1, Integer::sum);
                byOperationType.merge("update", 1, Integer::sum);

                // Tracking des dates
                if (oldestModification == null || movement.getUpdatedAt().isBefore(oldestModification)) {
                    oldestModification = movement.getUpdatedAt();
                }
                if (newestModification == null || movement.getUpdatedAt().isAfter(newestModification)) {
                    newestModification = movement.getUpdatedAt();
                }
            }
        }

        // Finalisation de la réponse
        response.setModifiedEntities(modifiedEntities);
        response.setDeletedEntities(deletedEntities);
        response.setTotalModified(modifiedEntities.size());
        response.setTotalDeleted(deletedEntities.size());
        response.setServerTimestamp(LocalDateTime.now());
        response.setNextSyncTimestamp(response.getServerTimestamp());

        // Création des statistiques delta
        SyncDeltaResponse.DeltaStatistics statistics = new SyncDeltaResponse.DeltaStatistics();
        statistics.setByEntityType(byEntityType);
        statistics.setByOperationType(byOperationType);
        statistics.setOldestModification(oldestModification);
        statistics.setNewestModification(newestModification);
        statistics.setTotalDataSizeBytes(calculateDataSize(modifiedEntities));
        response.setStatistics(statistics);

        // Log de la synchronisation delta
        logDeltaSync(request, response);

        long processingTime = System.currentTimeMillis() - startTime;
        System.out.println("[SYNC_SERVICE] Fin du traitement delta: " +
                response.getTotalModified() + " entités modifiées en " + processingTime + "ms");

        return response;
    }

    /**
     * Obtient le statut de synchronisation
     */
    public Map<String, Object> getSyncStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("server_time", LocalDateTime.now());
        status.put("status", "active");
        status.put("version", "1.0.0");

        // Statistiques générales
        Map<String, Long> entityCounts = new HashMap<>();
        entityCounts.put("products", productRepository.count());
        entityCounts.put("sales", saleRepository.count());
        entityCounts.put("stock_movements", stockMovementRepository.count());
        status.put("entity_counts", entityCounts);

        return status;
    }

    /**
     * Force une synchronisation complète
     */
    public void forceSync() {
        System.out.println("[SYNC_SERVICE] Synchronisation forcée déclenchée");
        // Logique de synchronisation forcée
        // Peut inclure la réinitialisation des timestamps, etc.
    }

    /**
     * Récupère les conflits en attente
     */
    public List<Map<String, Object>> getPendingConflicts() {
        List<SyncConflict> conflicts = syncConflictRepository.findByResolvedAtIsNull();
        List<Map<String, Object>> result = new ArrayList<>();

        for (SyncConflict conflict : conflicts) {
            Map<String, Object> conflictMap = new HashMap<>();
            conflictMap.put("id", conflict.getId());
            conflictMap.put("entity_type", conflict.getEntityType());
            conflictMap.put("entity_id", conflict.getEntityId());
            conflictMap.put("conflict_type", conflict.getConflictType());
            conflictMap.put("local_data", conflict.getLocalData());
            conflictMap.put("server_data", conflict.getServerData());
            conflictMap.put("created_at", conflict.getCreatedAt());
            conflictMap.put("user_id", conflict.getUserId());
            result.add(conflictMap);
        }

        return result;
    }

    /**
     * Résout un conflit
     */
    public void resolveConflict(String conflictId, String resolution) {
        System.out.println("[SYNC_SERVICE] Résolution conflit " + conflictId +
                " avec stratégie: " + resolution);

        try {
            Long id = Long.parseLong(conflictId);
            resolveConflictWithStrategy(id, resolution, "system");
        } catch (NumberFormatException e) {
            System.err.println("[SYNC_SERVICE] ID de conflit invalide: " + conflictId);
        }
    }

    /**
     * Méthodes utilitaires
     */
    private SyncBatchResponse.SyncConflict createConflict(
            SyncBatchRequest.SyncOperation operation,
            SyncBatchResponse.OperationResult result) {

        SyncBatchResponse.SyncConflict conflict = new SyncBatchResponse.SyncConflict();
        conflict.setConflictId(UUID.randomUUID().toString());
        conflict.setEntityId(operation.getEntityId());
        conflict.setEntityType(operation.getEntityType().getValue());
        conflict.setConflictType(SyncBatchResponse.ConflictType.UPDATE_CONFLICT);
        conflict.setLocalData(operation.getEntityData());
        conflict.setMessage(result.getMessage());
        conflict.setPriority(SyncBatchResponse.ConflictPriority.MEDIUM);

        // Tenter de récupérer les données serveur pour comparaison
        try {
            if ("product".equals(operation.getEntityType().getValue())) {
                Optional<Product> product = productRepository.findById(Long.parseLong(operation.getEntityId()));
                product.ifPresent(p -> conflict.setServerData(convertProductToMap(p)));
            } else if ("sale".equals(operation.getEntityType().getValue())) {
                Optional<Sale> sale = saleRepository.findById(Long.parseLong(operation.getEntityId()));
                sale.ifPresent(s -> conflict.setServerData(convertSaleToMap(s)));
            } else if ("stock_movement".equals(operation.getEntityType().getValue())) {
                Optional<StockMovement> movement = stockMovementRepository
                        .findById(Long.parseLong(operation.getEntityId()));
                movement.ifPresent(m -> conflict.setServerData(convertStockMovementToMap(m)));
            }
        } catch (Exception e) {
            System.err.println("[SYNC_SERVICE] Erreur récupération données serveur pour conflit: " + e.getMessage());
        }

        return conflict;
    }

    private SyncBatchResponse.SyncError createError(
            SyncBatchRequest.SyncOperation operation,
            String message) {

        SyncBatchResponse.SyncError error = new SyncBatchResponse.SyncError();
        error.setEntityId(operation.getEntityId());
        error.setEntityType(operation.getEntityType().getValue());
        error.setOperationType(operation.getOperationType().getValue());
        error.setErrorCode("SYNC_ERROR");
        error.setErrorMessage(message);
        return error;
    }

    private void logSyncOperation(SyncBatchRequest request, SyncBatchResponse response) {
        try {
            SyncLog log = new SyncLog();
            log.setSyncType("BATCH");
            log.setDeviceId(request.getDeviceId());
            log.setOperationsCount(request.getOperations().size());
            log.setSuccessCount(response.getSuccessCount());
            log.setErrorCount(response.getErrorCount());
            log.setConflictCount(response.getConflictCount());
            log.setProcessingTimeMs(Long.valueOf(response.getProcessingTimeMs()));
            log.setTimestamp(LocalDateTime.now());

            syncLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("[SYNC_SERVICE] Erreur log synchronisation: " + e.getMessage());
        }
    }

    private void logDeltaSync(SyncDeltaRequest request, SyncDeltaResponse response) {
        try {
            SyncLog log = new SyncLog();
            log.setSyncType("DELTA");
            log.setDeviceId(request.getDeviceId());
            log.setOperationsCount(response.getTotalModified());
            log.setSuccessCount(response.getTotalModified());
            log.setErrorCount(0);
            log.setConflictCount(0);
            log.setProcessingTimeMs(0L); // Calculer si nécessaire
            log.setTimestamp(LocalDateTime.now());

            syncLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("[SYNC_SERVICE] Erreur log delta: " + e.getMessage());
        }
    }

    /**
     * Méthodes utilitaires pour la conversion d'entités en Map
     */
    private Map<String, Object> convertProductToMap(Product product) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", product.getId());
        data.put("name", product.getName());
        data.put("description", product.getDescription());
        data.put("price", product.getSellingPrice());
        data.put("category", product.getCategory());
        data.put("stock_quantity", product.getStockQuantity());
        data.put("created_at", product.getCreatedAt());
        data.put("updated_at", product.getUpdatedAt());
        return data;
    }

    private Map<String, Object> convertSaleToMap(Sale sale) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", sale.getId());
        data.put("amount", sale.getTotalAmount());
        data.put("total_quantity", sale.getTotalQuantity());
        data.put("customer_name", sale.getCustomerName());
        data.put("created_at", sale.getCreatedAt());
        data.put("updated_at", sale.getUpdatedAt());
        return data;
    }

    private Map<String, Object> convertStockMovementToMap(StockMovement movement) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", movement.getId());
        data.put("product_id", movement.getProductId());
        data.put("quantity", movement.getQuantity());
        data.put("movement_type", movement.getMovementType());
        data.put("reason", movement.getReason());
        data.put("created_at", movement.getCreatedAt());
        data.put("updated_at", movement.getUpdatedAt());
        return data;
    }

    /**
     * Calcule la taille approximative des données en bytes
     */
    private long calculateDataSize(List<SyncDeltaResponse.ModifiedEntity> entities) {
        // Approximation simple - dans un vrai projet, on utiliserait une méthode plus
        // précise
        return entities.size() * 512L; // 512 bytes par entité en moyenne
    }

    /**
     * Crée et sauvegarde un conflit dans la base de données
     */
    private SyncConflict createAndSaveConflict(
            SyncBatchRequest.SyncOperation operation,
            Object serverEntity,
            String conflictType) {

        try {
            SyncConflict conflict = new SyncConflict();
            conflict.setEntityType(operation.getEntityType().getValue());
            conflict.setEntityId(operation.getEntityId());
            conflict.setConflictType(conflictType);

            // Sérialiser les données
            conflict.setLocalData(objectMapper.writeValueAsString(operation.getEntityData()));

            if (serverEntity instanceof Product) {
                conflict.setServerData(objectMapper.writeValueAsString(convertProductToMap((Product) serverEntity)));
            } else if (serverEntity instanceof Sale) {
                conflict.setServerData(objectMapper.writeValueAsString(convertSaleToMap((Sale) serverEntity)));
            } else if (serverEntity instanceof StockMovement) {
                conflict.setServerData(
                        objectMapper.writeValueAsString(convertStockMovementToMap((StockMovement) serverEntity)));
            }

            // Informations supplémentaires
            Map<String, Object> localData = (Map<String, Object>) operation.getEntityData();
            String userId = localData.get("user_id") != null ? localData.get("user_id").toString() : "0";
            conflict.setUserId(Long.parseLong(userId));

            // Détails du conflit
            String details = String.format(
                    "Conflit %s détecté lors de la synchronisation de %s (ID: %s)",
                    conflictType,
                    operation.getEntityType().getValue(),
                    operation.getEntityId());
            conflict.setConflictDetails(details);

            // Sauvegarder le conflit
            SyncConflict savedConflict = syncConflictRepository.save(conflict);

            System.out.println("[SYNC_SERVICE] Conflit enregistré avec ID: " + savedConflict.getId());

            return savedConflict;

        } catch (JsonProcessingException e) {
            System.err.println("[SYNC_SERVICE] Erreur sérialisation conflit: " + e.getMessage());
            throw new RuntimeException("Erreur lors de la création du conflit", e);
        }
    }

    /**
     * Récupère les conflits non résolus pour un utilisateur
     */
    public List<SyncConflict> getUnresolvedConflicts(Long userId) {
        return syncConflictRepository.findByUserIdAndResolvedAtIsNull(userId);
    }

    /**
     * Résout un conflit avec une stratégie donnée
     */
    @Transactional
    public void resolveConflictWithStrategy(Long conflictId, String strategy, String resolvedBy) {
        Optional<SyncConflict> conflictOpt = syncConflictRepository.findById(conflictId);

        if (conflictOpt.isPresent()) {
            SyncConflict conflict = conflictOpt.get();
            conflict.setResolutionStrategy(strategy);
            conflict.setResolvedAt(LocalDateTime.now());
            conflict.setResolvedBy(resolvedBy);

            syncConflictRepository.save(conflict);

            System.out.println("[SYNC_SERVICE] Conflit " + conflictId +
                    " résolu avec stratégie: " + strategy);
        }
    }
}
