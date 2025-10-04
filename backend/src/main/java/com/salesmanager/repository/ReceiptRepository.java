package com.salesmanager.repository;

import com.salesmanager.entity.Receipt;
import com.salesmanager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReceiptRepository extends JpaRepository<Receipt, Long> {

    /**
     * Trouve un reçu par son numéro unique
     */
    Optional<Receipt> findByReceiptNumber(String receiptNumber);

    /**
     * Trouve tous les reçus d'un utilisateur donné
     */
    List<Receipt> findByUserOrderByCreatedAtDesc(User user);

    /**
     * Trouve un reçu par son ID et l'utilisateur (sécurité)
     */
    Optional<Receipt> findByIdAndUser(Long id, User user);

    /**
     * Trouve un reçu par son numéro et l'utilisateur (sécurité)
     */
    Optional<Receipt> findByReceiptNumberAndUser(String receiptNumber, User user);

    /**
     * Trouve tous les reçus d'une vente donnée
     */
    List<Receipt> findBySaleId(Long saleId);

    /**
     * Compte le nombre de reçus générés par un utilisateur
     */
    @Query("SELECT COUNT(r) FROM Receipt r WHERE r.user = :user")
    long countByUser(@Param("user") User user);

    /**
     * Trouve les reçus téléchargés récemment (dernières 24h)
     */
    @Query("SELECT r FROM Receipt r WHERE r.user = :user AND r.downloadedAt >= :twentyFourHoursAgo ORDER BY r.downloadedAt DESC")
    List<Receipt> findRecentlyDownloadedByUser(@Param("user") User user, @Param("twentyFourHoursAgo") java.time.LocalDateTime twentyFourHoursAgo);

    /**
     * Trouve les reçus par statut et utilisateur
     */
    List<Receipt> findByUserAndStatusOrderByCreatedAtDesc(User user, Receipt.ReceiptStatus status);

    /**
     * Vérifie si un reçu existe pour une vente donnée
     */
    boolean existsBySaleId(Long saleId);

    /**
     * Trouve le dernier reçu généré par un utilisateur
     */
    Optional<Receipt> findFirstByUserOrderByCreatedAtDesc(User user);
}
