package com.salesmanager.repository;

import com.salesmanager.entity.SyncConflict;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour la gestion des conflits de synchronisation
 * 
 * @author Sales Manager Team
 * @version 1.0
 */
@Repository
public interface SyncConflictRepository extends JpaRepository<SyncConflict, Long> {

    /**
     * Trouve tous les conflits non résolus
     */
    List<SyncConflict> findByResolvedAtIsNull();

    /**
     * Trouve tous les conflits non résolus pour un utilisateur
     */
    List<SyncConflict> findByUserIdAndResolvedAtIsNull(Long userId);

    /**
     * Trouve tous les conflits d'un utilisateur
     */
    List<SyncConflict> findByUserId(Long userId);

    /**
     * Trouve les conflits par type d'entité
     */
    List<SyncConflict> findByEntityTypeAndResolvedAtIsNull(String entityType);

    /**
     * Trouve les conflits pour une entité spécifique
     */
    List<SyncConflict> findByEntityTypeAndEntityIdAndResolvedAtIsNull(String entityType, String entityId);

    /**
     * Compte les conflits non résolus pour un utilisateur
     */
    @Query("SELECT COUNT(sc) FROM SyncConflict sc WHERE sc.userId = :userId AND sc.resolvedAt IS NULL")
    Long countUnresolvedConflictsByUserId(@Param("userId") Long userId);

    /**
     * Compte les conflits par type
     */
    @Query("SELECT sc.conflictType, COUNT(sc) FROM SyncConflict sc WHERE sc.resolvedAt IS NULL GROUP BY sc.conflictType")
    List<Object[]> countConflictsByType();
}
