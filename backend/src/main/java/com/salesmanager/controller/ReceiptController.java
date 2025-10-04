package com.salesmanager.controller;

import com.salesmanager.entity.Receipt;
import com.salesmanager.entity.User;
import com.salesmanager.security.UserDetailsImpl;
import com.salesmanager.service.ReceiptService;
import com.salesmanager.dto.ReceiptResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/receipts")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ReceiptController {

    private static final Logger logger = LoggerFactory.getLogger(ReceiptController.class);

    @Autowired
    private ReceiptService receiptService;

    /**
     * Crée un nouveau reçu pour une vente
     */
    @PostMapping("/create/{saleId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> createReceipt(@PathVariable Long saleId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            logger.info("Demande de création de reçu pour la vente ID: {} par l'utilisateur: {}",
                    saleId, userDetails.getUsername());

            User user = userDetails.getUser();
            Receipt receipt = receiptService.createReceipt(saleId, user);

            // Convert to DTO to avoid circular references
            ReceiptResponse receiptResponse = new ReceiptResponse(receipt);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Reçu créé avec succès");
            response.put("receipt", receiptResponse);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            logger.error("Erreur lors de la création du reçu pour la vente ID: {}", saleId, e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Erreur inattendue lors de la création du reçu", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    /**
     * Récupère tous les reçus de l'utilisateur connecté
     */
    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getUserReceipts(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            logger.info("Demande de récupération des reçus par l'utilisateur: {}", userDetails.getUsername());

            User user = userDetails.getUser();
            List<Receipt> receipts = receiptService.getUserReceipts(user);

            // Convert to DTO to avoid infinite recursion
            List<ReceiptResponse> receiptResponses = receipts.stream()
                    .map(ReceiptResponse::new)
                    .collect(java.util.stream.Collectors.toList());

            return ResponseEntity.ok(Map.of("receipts", receiptResponses));

        } catch (Exception e) {
            logger.error("Erreur lors de la récupération des reçus", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    /**
     * Récupère un reçu par son ID
     */
    @GetMapping("/{receiptId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getReceipt(@PathVariable Long receiptId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            logger.info("Demande de récupération du reçu ID: {} par l'utilisateur: {}",
                    receiptId, userDetails.getUsername());

            User user = userDetails.getUser();
            Receipt receipt = receiptService.getReceiptById(receiptId, user);

            return ResponseEntity.ok(receipt);

        } catch (RuntimeException e) {
            logger.error("Erreur lors de la récupération du reçu ID: {}", receiptId, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Erreur inattendue lors de la récupération du reçu", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    /**
     * Récupère un reçu par son numéro
     */
    @GetMapping("/number/{receiptNumber}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getReceiptByNumber(@PathVariable String receiptNumber,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            logger.info("Demande de récupération du reçu numéro: {} par l'utilisateur: {}",
                    receiptNumber, userDetails.getUsername());

            User user = userDetails.getUser();
            Receipt receipt = receiptService.getReceiptByNumber(receiptNumber, user);

            return ResponseEntity.ok(receipt);

        } catch (RuntimeException e) {
            logger.error("Erreur lors de la récupération du reçu numéro: {}", receiptNumber, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Erreur inattendue lors de la récupération du reçu", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    /**
     * Génère et télécharge le PDF d'un reçu
     */
    @GetMapping("/{receiptId}/pdf")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> downloadReceiptPdf(@PathVariable Long receiptId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            logger.info("Demande de téléchargement PDF du reçu ID: {} par l'utilisateur: {}",
                    receiptId, userDetails.getUsername());

            User user = userDetails.getUser();
            byte[] pdfBytes = receiptService.generateReceiptPdf(receiptId, user);

            // Récupérer les informations du reçu pour le nom de fichier
            Receipt receipt = receiptService.getReceiptById(receiptId, user);
            String fileName = "receipt_" + receipt.getReceiptNumber() + ".pdf";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", fileName);
            headers.setContentLength(pdfBytes.length);

            logger.info("PDF généré et envoyé avec succès pour le reçu: {}", receipt.getReceiptNumber());

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);

        } catch (RuntimeException e) {
            logger.error("Erreur lors de la génération du PDF du reçu ID: {}", receiptId, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Erreur inattendue lors de la génération du PDF", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la génération du PDF"));
        }
    }

    /**
     * Génère et télécharge le PDF d'un reçu par son numéro
     */
    @GetMapping("/number/{receiptNumber}/pdf")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> downloadReceiptPdfByNumber(@PathVariable String receiptNumber,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            logger.info("Demande de téléchargement PDF du reçu numéro: {} par l'utilisateur: {}",
                    receiptNumber, userDetails.getUsername());

            User user = userDetails.getUser();
            byte[] pdfBytes = receiptService.generateReceiptPdfByNumber(receiptNumber, user);

            String fileName = "receipt_" + receiptNumber + ".pdf";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", fileName);
            headers.setContentLength(pdfBytes.length);

            logger.info("PDF généré et envoyé avec succès pour le reçu: {}", receiptNumber);

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);

        } catch (RuntimeException e) {
            logger.error("Erreur lors de la génération du PDF du reçu numéro: {}", receiptNumber, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Erreur inattendue lors de la génération du PDF", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la génération du PDF"));
        }
    }

    /**
     * Met à jour les informations d'un reçu
     */
    @PutMapping("/{receiptId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateReceipt(@PathVariable Long receiptId,
            @RequestBody Receipt receiptUpdate,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            logger.info("Demande de mise à jour du reçu ID: {} par l'utilisateur: {}",
                    receiptId, userDetails.getUsername());

            User user = userDetails.getUser();
            Receipt updatedReceipt = receiptService.updateReceipt(receiptId, receiptUpdate, user);

            return ResponseEntity.ok(updatedReceipt);

        } catch (RuntimeException e) {
            logger.error("Erreur lors de la mise à jour du reçu ID: {}", receiptId, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Erreur inattendue lors de la mise à jour du reçu", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }

    /**
     * Supprime un reçu
     */
    @DeleteMapping("/{receiptId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteReceipt(@PathVariable Long receiptId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            logger.info("Demande de suppression du reçu ID: {} par l'utilisateur: {}",
                    receiptId, userDetails.getUsername());

            User user = userDetails.getUser();
            receiptService.deleteReceipt(receiptId, user);

            return ResponseEntity.ok(Map.of("message", "Reçu supprimé avec succès"));

        } catch (RuntimeException e) {
            logger.error("Erreur lors de la suppression du reçu ID: {}", receiptId, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Erreur inattendue lors de la suppression du reçu", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur interne du serveur"));
        }
    }
}
