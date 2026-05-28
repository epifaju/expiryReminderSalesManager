package com.salesmanager.service;

import com.salesmanager.entity.Receipt;
import com.salesmanager.entity.Sale;
import com.salesmanager.entity.User;
import com.salesmanager.entity.Organisation;
import com.salesmanager.entity.Store;
import com.salesmanager.exception.BadRequestException;
import com.salesmanager.exception.ForbiddenException;
import com.salesmanager.exception.NotFoundException;
import com.salesmanager.exception.TenantContextMissingException;
import com.salesmanager.repository.OrganisationMemberRepository;
import com.salesmanager.repository.ReceiptRepository;
import com.salesmanager.repository.SaleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import com.salesmanager.security.TenantContext;

@Service
@Transactional
public class ReceiptService {

    private static final Logger logger = LoggerFactory.getLogger(ReceiptService.class);

    @Autowired
    private ReceiptRepository receiptRepository;

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private ReceiptPdfService receiptPdfService;

    @Autowired
    private OrganisationMemberRepository organisationMemberRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${multitenancy.require-tenant-claims:false}")
    private boolean requireTenantClaims;

    /**
     * Crée un nouveau reçu pour une vente
     */
    public Receipt createReceipt(Long saleId, User user) {
        logger.info("Création d'un reçu pour la vente ID: {} par l'utilisateur: {}", saleId, user.getUsername());

        UUID organisationId = requireOrganisationId();
        UUID storeId = TenantContext.getStoreId();
        requireMembership(user, organisationId);

        // Vérifier que la vente existe
        Sale sale;
        if (isElevated()) {
            sale = saleRepository.findByIdAndOrganisation_Id(saleId, organisationId)
                .orElseThrow(() -> new NotFoundException("Vente non trouvée avec l'ID: " + saleId));
        } else {
            if (storeId == null) {
                throw new BadRequestException("Boutique requise pour accéder aux reçus");
            }
            sale = saleRepository.findByIdAndOrganisation_IdAndStore_Id(saleId, organisationId, storeId)
                    .orElseThrow(() -> new NotFoundException("Vente non trouvée avec l'ID: " + saleId));
        }

        // Idempotent : si un reçu existe déjà pour cette vente, le renvoyer
        if (receiptRepository.existsBySaleIdAndOrganisation_Id(saleId, organisationId)) {
            Receipt existing = receiptRepository.findBySaleIdAndOrganisation_Id(saleId, organisationId).stream()
                    .findFirst()
                    .orElseThrow(() -> new NotFoundException("Reçu introuvable pour la vente: " + saleId));
            return receiptRepository.findByIdWithSaleAndUser(existing.getId()).orElse(existing);
        }

        BigDecimal totalAmount = coalesceAmount(sale.getTotalAmount());
        BigDecimal taxAmount = coalesceAmount(sale.getTaxAmount());
        BigDecimal discountAmount = coalesceAmount(sale.getDiscountAmount());
        BigDecimal finalAmount = sale.getFinalAmount() != null ? sale.getFinalAmount() : totalAmount;

        // Créer le reçu
        Receipt receipt = new Receipt();
        receipt.setUser(user);
        receipt.setSale(sale);
        receipt.setOrganisation(entityManager.getReference(Organisation.class, organisationId));
        if (sale.getStore() != null) {
            receipt.setStore(sale.getStore());
        } else if (storeId != null) {
            receipt.setStore(entityManager.getReference(Store.class, storeId));
        }
        receipt.setTotalAmount(totalAmount);
        receipt.setTaxAmount(taxAmount);
        receipt.setDiscountAmount(discountAmount);
        receipt.setFinalAmount(finalAmount);
        receipt.setPaymentMethod(sale.getPaymentMethod());
        receipt.setCustomerName(sale.getCustomerName());
        receipt.setCustomerPhone(sale.getCustomerPhone());
        receipt.setCustomerEmail(sale.getCustomerEmail());
        receipt.setNotes(sale.getNotes());

        // S'assurer que les dates sont définies
        receipt.setCreatedAt(LocalDateTime.now());
        receipt.setUpdatedAt(LocalDateTime.now());

        // Informations de l'entreprise (peuvent être configurées par l'utilisateur)
        receipt.setCompanyName("Mon Entreprise"); // À personnaliser
        receipt.setCompanyAddress("123 Rue de la Paix, 75001 Paris"); // À personnaliser
        receipt.setCompanyPhone("01 23 45 67 89"); // À personnaliser
        receipt.setCompanyEmail("contact@monentreprise.fr"); // À personnaliser

        // Sauvegarder le reçu d'abord pour générer le numéro de reçu
        Receipt savedReceipt = receiptRepository.save(receipt);

        // Générer le QR code après la sauvegarde (quand le receiptNumber est
        // disponible)
        savedReceipt.setQrCodeData(generateQrCodeData(savedReceipt));
        savedReceipt = receiptRepository.save(savedReceipt);

        Receipt hydrated = receiptRepository.findByIdWithSaleAndUser(savedReceipt.getId())
                .orElse(savedReceipt);

        logger.info("Reçu créé avec succès. ID: {}, Numéro: {}", hydrated.getId(), hydrated.getReceiptNumber());

        return hydrated;
    }

    private static BigDecimal coalesceAmount(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    /**
     * Récupère un reçu par son ID
     */
    @Transactional(readOnly = true)
    public Receipt getReceiptById(Long receiptId, User user) {
        logger.info("Récupération du reçu ID: {} par l'utilisateur: {}", receiptId, user.getUsername());

        UUID organisationId = requireOrganisationId();
        requireMembership(user, organisationId);
        if (isElevated()) {
            return receiptRepository.findByIdAndOrganisation_Id(receiptId, organisationId)
                    .orElseThrow(() -> new NotFoundException("Reçu non trouvé avec l'ID: " + receiptId));
        }

        UUID storeId = TenantContext.getStoreId();
        if (storeId == null) {
            throw new BadRequestException("Boutique requise pour accéder aux reçus");
        }
        return receiptRepository.findByIdAndOrganisation_IdAndStore_Id(receiptId, organisationId, storeId)
                .orElseThrow(() -> new NotFoundException("Reçu non trouvé avec l'ID: " + receiptId));
    }

    /**
     * Récupère un reçu par son numéro
     */
    @Transactional(readOnly = true)
    public Receipt getReceiptByNumber(String receiptNumber, User user) {
        logger.info("Récupération du reçu numéro: {} par l'utilisateur: {}", receiptNumber, user.getUsername());

        UUID organisationId = requireOrganisationId();
        requireMembership(user, organisationId);
        if (isElevated()) {
            return receiptRepository.findByReceiptNumberAndOrganisation_Id(receiptNumber, organisationId)
                    .orElseThrow(() -> new NotFoundException("Reçu non trouvé avec le numéro: " + receiptNumber));
        }

        UUID storeId = TenantContext.getStoreId();
        if (storeId == null) {
            throw new BadRequestException("Boutique requise pour accéder aux reçus");
        }
        return receiptRepository.findByReceiptNumberAndOrganisation_IdAndStore_Id(receiptNumber, organisationId, storeId)
                .orElseThrow(() -> new NotFoundException("Reçu non trouvé avec le numéro: " + receiptNumber));
    }

    /**
     * Récupère tous les reçus d'un utilisateur
     */
    @Transactional(readOnly = true)
    public List<Receipt> getUserReceipts(User user) {
        logger.info("Récupération de tous les reçus pour l'utilisateur: {}", user.getUsername());

        UUID organisationId = requireOrganisationId();
        requireMembership(user, organisationId);
        if (isElevated()) {
            return receiptRepository.findByOrganisation_IdOrderByCreatedAtDesc(organisationId);
        }
        UUID storeId = TenantContext.getStoreId();
        if (storeId == null) {
            throw new BadRequestException("Boutique requise pour accéder aux reçus");
        }
        return receiptRepository.findByOrganisation_IdAndStore_IdOrderByCreatedAtDesc(organisationId, storeId);
    }

    /**
     * Génère le PDF d'un reçu
     */
    public byte[] generateReceiptPdf(Long receiptId, User user, Locale locale) {
        logger.info("Génération du PDF pour le reçu ID: {} par l'utilisateur: {}", receiptId, user.getUsername());

        Receipt receipt = getReceiptById(receiptId, user);

        // Vérifier que le reçu peut être téléchargé
        if (!receipt.isDownloadable()) {
            throw new RuntimeException("Ce reçu ne peut pas être téléchargé");
        }

        try {
            // Incrémenter le compteur de téléchargements
            receipt.incrementDownloadCount();
            receiptRepository.save(receipt);

            // Générer le PDF avec la langue appropriée
            String currencyCode = user.getPreferredCurrency() != null ? user.getPreferredCurrency() : "EUR";
            byte[] pdfBytes = receiptPdfService.generatePdf(receipt, locale, currencyCode);

            logger.info("PDF généré avec succès pour le reçu: {}. Taille: {} bytes",
                    receipt.getReceiptNumber(), pdfBytes.length);

            return pdfBytes;

        } catch (Exception e) {
            logger.error("Erreur lors de la génération du PDF pour le reçu: {}", receipt.getReceiptNumber(), e);
            throw new RuntimeException("Erreur lors de la génération du PDF", e);
        }
    }

    /**
     * Génère le PDF d'un reçu par son numéro
     */
    public byte[] generateReceiptPdfByNumber(String receiptNumber, User user, Locale locale) {
        logger.info("Génération du PDF pour le reçu numéro: {} par l'utilisateur: {}", receiptNumber,
                user.getUsername());

        Receipt receipt = getReceiptByNumber(receiptNumber, user);

        // Vérifier que le reçu peut être téléchargé
        if (!receipt.isDownloadable()) {
            throw new RuntimeException("Ce reçu ne peut pas être téléchargé");
        }

        try {
            // Incrémenter le compteur de téléchargements
            receipt.incrementDownloadCount();
            receiptRepository.save(receipt);

            // Générer le PDF avec la langue appropriée
            String currencyCode = user.getPreferredCurrency() != null ? user.getPreferredCurrency() : "EUR";
            byte[] pdfBytes = receiptPdfService.generatePdf(receipt, locale, currencyCode);

            logger.info("PDF généré avec succès pour le reçu: {}. Taille: {} bytes",
                    receipt.getReceiptNumber(), pdfBytes.length);

            return pdfBytes;

        } catch (Exception e) {
            logger.error("Erreur lors de la génération du PDF pour le reçu: {}", receipt.getReceiptNumber(), e);
            throw new RuntimeException("Erreur lors de la génération du PDF", e);
        }
    }

    /**
     * Supprime un reçu
     */
    public void deleteReceipt(Long receiptId, User user) {
        logger.info("Suppression du reçu ID: {} par l'utilisateur: {}", receiptId, user.getUsername());

        Receipt receipt = getReceiptById(receiptId, user);
        receiptRepository.delete(receipt);

        logger.info("Reçu supprimé avec succès: {}", receipt.getReceiptNumber());
    }

    /**
     * Met à jour les informations d'un reçu
     */
    public Receipt updateReceipt(Long receiptId, Receipt receiptUpdate, User user) {
        logger.info("Mise à jour du reçu ID: {} par l'utilisateur: {}", receiptId, user.getUsername());

        Receipt receipt = getReceiptById(receiptId, user);

        // Mettre à jour les champs modifiables
        if (receiptUpdate.getCompanyName() != null) {
            receipt.setCompanyName(receiptUpdate.getCompanyName());
        }
        if (receiptUpdate.getCompanyAddress() != null) {
            receipt.setCompanyAddress(receiptUpdate.getCompanyAddress());
        }
        if (receiptUpdate.getCompanyPhone() != null) {
            receipt.setCompanyPhone(receiptUpdate.getCompanyPhone());
        }
        if (receiptUpdate.getCompanyEmail() != null) {
            receipt.setCompanyEmail(receiptUpdate.getCompanyEmail());
        }
        if (receiptUpdate.getCompanyLogoUrl() != null) {
            receipt.setCompanyLogoUrl(receiptUpdate.getCompanyLogoUrl());
        }
        if (receiptUpdate.getNotes() != null) {
            receipt.setNotes(receiptUpdate.getNotes());
        }

        Receipt updatedReceipt = receiptRepository.save(receipt);

        logger.info("Reçu mis à jour avec succès: {}", updatedReceipt.getReceiptNumber());

        return updatedReceipt;
    }

    /**
     * Récupère les reçus téléchargés récemment (dernières 24h)
     */
    @Transactional(readOnly = true)
    public List<Receipt> getRecentlyDownloadedReceipts(User user) {
        logger.info("Récupération des reçus récemment téléchargés pour l'utilisateur: {}", user.getUsername());

        UUID organisationId = requireOrganisationId();
        requireMembership(user, organisationId);
        LocalDateTime twentyFourHoursAgo = LocalDateTime.now().minusHours(24);
        if (isElevated()) {
            // fallback simple: on garde la version user-scoped pour l'instant (peu utilisée)
            return receiptRepository.findRecentlyDownloadedByUserAndOrganisation(user, organisationId, twentyFourHoursAgo);
        }
        return receiptRepository.findRecentlyDownloadedByUserAndOrganisation(user, organisationId, twentyFourHoursAgo);
    }

    /**
     * Génère les données QR code pour un reçu
     */
    private String generateQrCodeData(Receipt receipt) {
        String number = receipt.getReceiptNumber() != null ? receipt.getReceiptNumber() : "PENDING";
        BigDecimal amount = receipt.getFinalAmount() != null ? receipt.getFinalAmount() : BigDecimal.ZERO;
        String created = receipt.getCreatedAt() != null ? receipt.getCreatedAt().toString() : LocalDateTime.now().toString();
        return String.format("RECEIPT:%s:%s:%s", number, amount.toPlainString(), created);
    }

    private UUID requireOrganisationId() {
        UUID orgId = TenantContext.getOrganisationId();
        if (orgId == null) {
            if (requireTenantClaims) {
                throw new TenantContextMissingException("Missing tenant context (orgId) in JWT");
            }
            return UUID.fromString("00000000-0000-0000-0000-000000000001");
        }
        return orgId;
    }

    private boolean isElevated() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return false;
        }
        return auth.getAuthorities().stream().anyMatch(a -> {
            String role = a.getAuthority();
            return "ROLE_ADMIN".equals(role) || "ROLE_MANAGER".equals(role) || "ROLE_PLATFORM_ADMIN".equals(role);
        });
    }

    private boolean isPlatformAdmin() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return false;
        }
        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_PLATFORM_ADMIN".equals(a.getAuthority()));
    }

    private void requireMembership(User user, UUID organisationId) {
        // Admin plateforme (support/ops): accès sans ligne organisation_members.
        if (isPlatformAdmin()) {
            return;
        }
        boolean isMember = organisationMemberRepository.findByUser_Id(user.getId()).stream()
                .anyMatch(m -> organisationId.equals(m.getOrganisation().getId()));
        if (!isMember) {
            throw new ForbiddenException("Accès non autorisé à cette organisation");
        }
    }
}
