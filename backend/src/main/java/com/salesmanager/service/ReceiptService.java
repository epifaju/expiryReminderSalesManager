package com.salesmanager.service;

import com.salesmanager.entity.Receipt;
import com.salesmanager.entity.Sale;
import com.salesmanager.entity.User;
import com.salesmanager.repository.ReceiptRepository;
import com.salesmanager.repository.SaleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

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

    /**
     * Crée un nouveau reçu pour une vente
     */
    public Receipt createReceipt(Long saleId, User user) {
        logger.info("Création d'un reçu pour la vente ID: {} par l'utilisateur: {}", saleId, user.getUsername());

        // Vérifier que la vente existe
        Sale sale = saleRepository.findById(saleId)
                .orElseThrow(() -> new RuntimeException("Vente non trouvée avec l'ID: " + saleId));

        // Vérifier que l'utilisateur a accès à cette vente
        if (!sale.getCreatedBy().getId().equals(user.getId())) {
            throw new RuntimeException("Accès non autorisé à cette vente");
        }

        // Vérifier qu'un reçu n'existe pas déjà pour cette vente
        if (receiptRepository.existsBySaleId(saleId)) {
            throw new RuntimeException("Un reçu existe déjà pour cette vente");
        }

        // Créer le reçu
        Receipt receipt = new Receipt();
        receipt.setUser(user);
        receipt.setSale(sale);
        receipt.setTotalAmount(sale.getTotalAmount());
        receipt.setTaxAmount(sale.getTaxAmount());
        receipt.setDiscountAmount(sale.getDiscountAmount());
        receipt.setFinalAmount(sale.getFinalAmount());
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
        
        // Générer le QR code après la sauvegarde (quand le receiptNumber est disponible)
        savedReceipt.setQrCodeData(generateQrCodeData(savedReceipt));
        savedReceipt = receiptRepository.save(savedReceipt);

        logger.info("Reçu créé avec succès. ID: {}, Numéro: {}", savedReceipt.getId(), savedReceipt.getReceiptNumber());

        return savedReceipt;
    }

    /**
     * Récupère un reçu par son ID
     */
    @Transactional(readOnly = true)
    public Receipt getReceiptById(Long receiptId, User user) {
        logger.info("Récupération du reçu ID: {} par l'utilisateur: {}", receiptId, user.getUsername());

        return receiptRepository.findByIdAndUser(receiptId, user)
                .orElseThrow(() -> new RuntimeException("Reçu non trouvé avec l'ID: " + receiptId));
    }

    /**
     * Récupère un reçu par son numéro
     */
    @Transactional(readOnly = true)
    public Receipt getReceiptByNumber(String receiptNumber, User user) {
        logger.info("Récupération du reçu numéro: {} par l'utilisateur: {}", receiptNumber, user.getUsername());

        return receiptRepository.findByReceiptNumberAndUser(receiptNumber, user)
                .orElseThrow(() -> new RuntimeException("Reçu non trouvé avec le numéro: " + receiptNumber));
    }

    /**
     * Récupère tous les reçus d'un utilisateur
     */
    @Transactional(readOnly = true)
    public List<Receipt> getUserReceipts(User user) {
        logger.info("Récupération de tous les reçus pour l'utilisateur: {}", user.getUsername());

        return receiptRepository.findByUserOrderByCreatedAtDesc(user);
    }

    /**
     * Génère le PDF d'un reçu
     */
    public byte[] generateReceiptPdf(Long receiptId, User user) {
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

            // Générer le PDF
            byte[] pdfBytes = receiptPdfService.generatePdf(receipt);

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
    public byte[] generateReceiptPdfByNumber(String receiptNumber, User user) {
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

            // Générer le PDF
            byte[] pdfBytes = receiptPdfService.generatePdf(receipt);

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
        
        LocalDateTime twentyFourHoursAgo = LocalDateTime.now().minusHours(24);
        return receiptRepository.findRecentlyDownloadedByUser(user, twentyFourHoursAgo);
    }

    /**
     * Génère les données QR code pour un reçu
     */
    private String generateQrCodeData(Receipt receipt) {
        // Format simple pour le QR code
        return String.format("RECEIPT:%s:%s:%s", 
            receipt.getReceiptNumber(), 
            receipt.getFinalAmount().toString(),
            receipt.getCreatedAt().toString());
    }
}
