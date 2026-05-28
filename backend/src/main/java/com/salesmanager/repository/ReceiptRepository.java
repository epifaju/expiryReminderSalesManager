package com.salesmanager.repository;

import com.salesmanager.entity.Receipt;
import com.salesmanager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReceiptRepository extends JpaRepository<Receipt, Long> {

    /**
     * Trouve un reçu par son numéro unique
     */
    Optional<Receipt> findByReceiptNumber(String receiptNumber);
    Optional<Receipt> findByReceiptNumberAndOrganisation_Id(String receiptNumber, UUID organisationId);
    Optional<Receipt> findByReceiptNumberAndOrganisation_IdAndStore_Id(String receiptNumber, UUID organisationId, UUID storeId);

    /**
     * Trouve tous les reçus d'un utilisateur donné
     */
    List<Receipt> findByUserOrderByCreatedAtDesc(User user);
    List<Receipt> findByUserAndOrganisation_IdOrderByCreatedAtDesc(User user, UUID organisationId);
    List<Receipt> findByOrganisation_IdOrderByCreatedAtDesc(UUID organisationId);
    List<Receipt> findByOrganisation_IdAndStore_IdOrderByCreatedAtDesc(UUID organisationId, UUID storeId);

    /**
     * Trouve un reçu par son ID et l'utilisateur (sécurité)
     */
    Optional<Receipt> findByIdAndUser(Long id, User user);
    Optional<Receipt> findByIdAndUserAndOrganisation_Id(Long id, User user, UUID organisationId);
    Optional<Receipt> findByIdAndOrganisation_Id(Long id, UUID organisationId);
    Optional<Receipt> findByIdAndOrganisation_IdAndStore_Id(Long id, UUID organisationId, UUID storeId);

    /**
     * Trouve un reçu par son numéro et l'utilisateur (sécurité)
     */
    Optional<Receipt> findByReceiptNumberAndUser(String receiptNumber, User user);
    Optional<Receipt> findByReceiptNumberAndUserAndOrganisation_Id(String receiptNumber, User user, UUID organisationId);

    /**
     * Trouve tous les reçus d'une vente donnée
     */
    List<Receipt> findBySaleId(Long saleId);
    List<Receipt> findBySaleIdAndOrganisation_Id(Long saleId, UUID organisationId);

    /**
     * Compte le nombre de reçus générés par un utilisateur
     */
    @Query("SELECT COUNT(r) FROM Receipt r WHERE r.user = :user")
    long countByUser(@Param("user") User user);
    @Query("SELECT COUNT(r) FROM Receipt r WHERE r.user = :user AND r.organisation.id = :organisationId")
    long countByUserAndOrganisation(@Param("user") User user, @Param("organisationId") UUID organisationId);

    /**
     * Trouve les reçus téléchargés récemment (dernières 24h)
     */
    @Query("SELECT r FROM Receipt r WHERE r.user = :user AND r.downloadedAt >= :twentyFourHoursAgo ORDER BY r.downloadedAt DESC")
    List<Receipt> findRecentlyDownloadedByUser(@Param("user") User user, @Param("twentyFourHoursAgo") java.time.LocalDateTime twentyFourHoursAgo);
    @Query("SELECT r FROM Receipt r WHERE r.user = :user AND r.organisation.id = :organisationId AND r.downloadedAt >= :twentyFourHoursAgo ORDER BY r.downloadedAt DESC")
    List<Receipt> findRecentlyDownloadedByUserAndOrganisation(@Param("user") User user,
                                                              @Param("organisationId") UUID organisationId,
                                                              @Param("twentyFourHoursAgo") java.time.LocalDateTime twentyFourHoursAgo);

    /**
     * Trouve les reçus par statut et utilisateur
     */
    List<Receipt> findByUserAndStatusOrderByCreatedAtDesc(User user, Receipt.ReceiptStatus status);
    List<Receipt> findByUserAndOrganisation_IdAndStatusOrderByCreatedAtDesc(User user, UUID organisationId, Receipt.ReceiptStatus status);

    /**
     * Vérifie si un reçu existe pour une vente donnée
     */
    boolean existsBySaleId(Long saleId);
    boolean existsBySaleIdAndOrganisation_Id(Long saleId, UUID organisationId);

    @Query("SELECT r FROM Receipt r LEFT JOIN FETCH r.sale LEFT JOIN FETCH r.user WHERE r.id = :id")
    Optional<Receipt> findByIdWithSaleAndUser(@Param("id") Long id);

    /**
     * Trouve le dernier reçu généré par un utilisateur
     */
    Optional<Receipt> findFirstByUserOrderByCreatedAtDesc(User user);
    Optional<Receipt> findFirstByUserAndOrganisation_IdOrderByCreatedAtDesc(User user, UUID organisationId);
}
