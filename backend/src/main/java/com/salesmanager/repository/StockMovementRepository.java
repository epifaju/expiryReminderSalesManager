package com.salesmanager.repository;

import com.salesmanager.entity.StockMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository pour les mouvements de stock
 * Gère l'accès aux données des mouvements de stock
 * 
 * @author Sales Manager Team
 * @version 1.0
 */
@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    /**
     * Trouve les mouvements par produit
     * 
     * @param productId ID du produit
     * @return Liste des mouvements
     */
    List<StockMovement> findByProductId(Long productId);

    /**
     * Trouve les mouvements par produit avec pagination
     * 
     * @param productId ID du produit
     * @param pageable  Paramètres de pagination
     * @return Page des mouvements
     */
    Page<StockMovement> findByProductId(Long productId, Pageable pageable);

    /**
     * Trouve les mouvements par type
     * 
     * @param movementType Type de mouvement
     * @return Liste des mouvements
     */
    List<StockMovement> findByMovementType(String movementType);

    /**
     * Trouve les mouvements par type avec pagination
     * 
     * @param movementType Type de mouvement
     * @param pageable     Paramètres de pagination
     * @return Page des mouvements
     */
    Page<StockMovement> findByMovementType(String movementType, Pageable pageable);

    /**
     * Trouve les mouvements entre deux dates
     * 
     * @param startDate Date de début
     * @param endDate   Date de fin
     * @return Liste des mouvements
     */
    List<StockMovement> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Trouve les mouvements entre deux dates avec pagination
     * 
     * @param startDate Date de début
     * @param endDate   Date de fin
     * @param pageable  Paramètres de pagination
     * @return Page des mouvements
     */
    Page<StockMovement> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    /**
     * Trouve les mouvements par produit et type
     * 
     * @param productId    ID du produit
     * @param movementType Type de mouvement
     * @return Liste des mouvements
     */
    List<StockMovement> findByProductIdAndMovementType(Long productId, String movementType);

    /**
     * Trouve les mouvements par produit et type avec pagination
     * 
     * @param productId    ID du produit
     * @param movementType Type de mouvement
     * @param pageable     Paramètres de pagination
     * @return Page des mouvements
     */
    Page<StockMovement> findByProductIdAndMovementType(Long productId, String movementType, Pageable pageable);

    /**
     * Trouve les mouvements récents
     * 
     * @param pageable Paramètres de pagination
     * @return Liste des mouvements récents
     */
    @Query("SELECT sm FROM StockMovement sm ORDER BY sm.createdAt DESC")
    List<StockMovement> findRecentMovements(Pageable pageable);

    /**
     * Trouve les mouvements récents par produit
     * 
     * @param productId ID du produit
     * @param pageable  Paramètres de pagination
     * @return Liste des mouvements récents
     */
    @Query("SELECT sm FROM StockMovement sm WHERE sm.productId = :productId ORDER BY sm.createdAt DESC")
    List<StockMovement> findRecentMovementsByProduct(@Param("productId") Long productId, Pageable pageable);

    /**
     * Calcule le stock total par produit
     * 
     * @param productId ID du produit
     * @return Stock total calculé
     */
    @Query("SELECT COALESCE(SUM(CASE WHEN sm.movementType = 'IN' THEN sm.quantity ELSE -sm.quantity END), 0) FROM StockMovement sm WHERE sm.productId = :productId")
    Integer calculateStockByProduct(@Param("productId") Long productId);

    /**
     * Trouve les mouvements avec une quantité positive
     * 
     * @return Liste des mouvements d'entrée
     */
    @Query("SELECT sm FROM StockMovement sm WHERE sm.quantity > 0")
    List<StockMovement> findInboundMovements();

    /**
     * Trouve les mouvements avec une quantité négative
     * 
     * @return Liste des mouvements de sortie
     */
    @Query("SELECT sm FROM StockMovement sm WHERE sm.quantity < 0")
    List<StockMovement> findOutboundMovements();

    /**
     * Trouve les mouvements par raison
     * 
     * @param reason Raison du mouvement
     * @return Liste des mouvements
     */
    List<StockMovement> findByReason(String reason);

    /**
     * Trouve les mouvements par raison avec pagination
     * 
     * @param reason   Raison du mouvement
     * @param pageable Paramètres de pagination
     * @return Page des mouvements
     */
    Page<StockMovement> findByReason(String reason, Pageable pageable);

    /**
     * Trouve les mouvements mis à jour après un timestamp (pour la synchronisation)
     * 
     * @param timestamp Timestamp de référence
     * @return Liste des mouvements modifiés
     */
    List<StockMovement> findByUpdatedAtAfter(LocalDateTime timestamp);

    /**
     * Trouve les mouvements créés après un timestamp
     * 
     * @param timestamp Timestamp de référence
     * @return Liste des mouvements créés
     */
    List<StockMovement> findByCreatedAtAfter(LocalDateTime timestamp);

    /**
     * Trouve les mouvements par produit et période
     * 
     * @param productId ID du produit
     * @param startDate Date de début
     * @param endDate   Date de fin
     * @return Liste des mouvements
     */
    @Query("SELECT sm FROM StockMovement sm WHERE sm.productId = :productId AND sm.createdAt BETWEEN :startDate AND :endDate ORDER BY sm.createdAt DESC")
    List<StockMovement> findByProductAndPeriod(@Param("productId") Long productId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Calcule les statistiques de mouvement par produit
     * 
     * @param productId ID du produit
     * @param startDate Date de début
     * @param endDate   Date de fin
     * @return Statistiques agrégées
     */
    @Query("SELECT " +
            "COUNT(sm) as totalMovements, " +
            "SUM(CASE WHEN sm.quantity > 0 THEN sm.quantity ELSE 0 END) as totalIn, " +
            "SUM(CASE WHEN sm.quantity < 0 THEN ABS(sm.quantity) ELSE 0 END) as totalOut, " +
            "AVG(sm.quantity) as avgQuantity " +
            "FROM StockMovement sm WHERE sm.productId = :productId AND sm.createdAt BETWEEN :startDate AND :endDate")
    Object[] getMovementStatistics(@Param("productId") Long productId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Trouve tous les types de mouvements distincts
     * 
     * @return Liste des types de mouvements
     */
    @Query("SELECT DISTINCT sm.movementType FROM StockMovement sm WHERE sm.movementType IS NOT NULL ORDER BY sm.movementType")
    List<String> findAllMovementTypes();

    /**
     * Trouve toutes les raisons distinctes
     * 
     * @return Liste des raisons
     */
    @Query("SELECT DISTINCT sm.reason FROM StockMovement sm WHERE sm.reason IS NOT NULL ORDER BY sm.reason")
    List<String> findAllReasons();
}

