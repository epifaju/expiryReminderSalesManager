package com.salesmanager.repository;

import com.salesmanager.entity.SyncLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository pour les logs de synchronisation
 * Gère l'accès aux données des logs de synchronisation
 * 
 * @author Sales Manager Team
 * @version 1.0
 */
@Repository
public interface SyncLogRepository extends JpaRepository<SyncLog, Long> {

    /**
     * Trouve les logs de synchronisation par type
     * 
     * @param syncType Type de synchronisation
     * @return Liste des logs
     */
    List<SyncLog> findBySyncType(String syncType);

    /**
     * Trouve les logs de synchronisation par device
     * 
     * @param deviceId ID du device
     * @return Liste des logs
     */
    List<SyncLog> findByDeviceId(String deviceId);

    /**
     * Trouve les logs de synchronisation depuis une date
     * 
     * @param since Date de début
     * @return Liste des logs
     */
    List<SyncLog> findByTimestampAfter(LocalDateTime since);

    /**
     * Trouve les logs de synchronisation entre deux dates
     * 
     * @param start Date de début
     * @param end   Date de fin
     * @return Liste des logs
     */
    List<SyncLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end);

    /**
     * Trouve les logs de synchronisation par session
     * 
     * @param syncSessionId ID de la session de synchronisation
     * @return Liste des logs
     */
    List<SyncLog> findBySyncSessionId(String syncSessionId);

    /**
     * Trouve les logs de synchronisation avec des erreurs
     * 
     * @return Liste des logs avec erreurs
     */
    @Query("SELECT s FROM SyncLog s WHERE s.errorCount > 0")
    List<SyncLog> findLogsWithErrors();

    /**
     * Trouve les logs de synchronisation avec des conflits
     * 
     * @return Liste des logs avec conflits
     */
    @Query("SELECT s FROM SyncLog s WHERE s.conflictCount > 0")
    List<SyncLog> findLogsWithConflicts();

    /**
     * Trouve les logs de synchronisation récents
     * 
     * @param pageable Pagination pour limiter les résultats
     * @return Liste des logs récents
     */
    @Query("SELECT s FROM SyncLog s ORDER BY s.timestamp DESC")
    List<SyncLog> findRecentLogs(Pageable pageable);

    /**
     * Calcule les statistiques de synchronisation
     * 
     * @param since Date de début
     * @return Statistiques agrégées
     */
    @Query("SELECT " +
            "COUNT(s) as totalSyncs, " +
            "SUM(s.operationsCount) as totalOperations, " +
            "SUM(s.successCount) as totalSuccess, " +
            "SUM(s.errorCount) as totalErrors, " +
            "SUM(s.conflictCount) as totalConflicts, " +
            "AVG(s.processingTimeMs) as avgProcessingTime " +
            "FROM SyncLog s WHERE s.timestamp >= :since")
    Object[] getSyncStatistics(@Param("since") LocalDateTime since);

    /**
     * Trouve les devices les plus actifs
     * 
     * @param since Date de début
     * @param pageable Pagination pour limiter les résultats
     * @return Liste des devices avec leur nombre de synchronisations
     */
    @Query("SELECT s.deviceId, COUNT(s) as syncCount " +
            "FROM SyncLog s WHERE s.timestamp >= :since AND s.deviceId IS NOT NULL " +
            "GROUP BY s.deviceId ORDER BY syncCount DESC")
    List<Object[]> findMostActiveDevices(@Param("since") LocalDateTime since, Pageable pageable);

    /**
     * Trouve les logs de synchronisation par version d'app
     * 
     * @param appVersion Version de l'application
     * @return Liste des logs
     */
    List<SyncLog> findByAppVersion(String appVersion);

    /**
     * Supprime les anciens logs de synchronisation
     * 
     * @param before Date avant laquelle supprimer les logs
     * @return Nombre de logs supprimés
     */
    @Query("DELETE FROM SyncLog s WHERE s.timestamp < :before")
    int deleteOldLogs(@Param("before") LocalDateTime before);
}

