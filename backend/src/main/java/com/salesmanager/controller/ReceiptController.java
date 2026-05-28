package com.salesmanager.controller;

import com.salesmanager.entity.Receipt;
import com.salesmanager.entity.User;
import com.salesmanager.security.UserDetailsImpl;
import com.salesmanager.service.ReceiptService;
import com.salesmanager.dto.ReceiptResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/receipts")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ReceiptController {

    @Autowired
    private ReceiptService receiptService;

    /**
     * Crée un nouveau reçu pour une vente
     */
    @PostMapping("/create/{saleId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<?> createReceipt(@PathVariable Long saleId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userDetails.getUser();
        Receipt receipt = receiptService.createReceipt(saleId, user);
        return ResponseEntity.ok(new ReceiptResponse(receipt));
    }

    /**
     * Récupère tous les reçus de l'utilisateur connecté
     */
    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<?> getUserReceipts(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userDetails.getUser();
        List<Receipt> receipts = receiptService.getUserReceipts(user);
        List<ReceiptResponse> receiptResponses = receipts.stream()
                .map(ReceiptResponse::new)
                .toList();
        return ResponseEntity.ok(receiptResponses);
    }

    /**
     * Récupère un reçu par son ID
     */
    @GetMapping("/{receiptId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<?> getReceipt(@PathVariable Long receiptId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userDetails.getUser();
        Receipt receipt = receiptService.getReceiptById(receiptId, user);
        return ResponseEntity.ok(new ReceiptResponse(receipt));
    }

    /**
     * Récupère un reçu par son numéro
     */
    @GetMapping("/number/{receiptNumber}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<?> getReceiptByNumber(@PathVariable String receiptNumber,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userDetails.getUser();
        Receipt receipt = receiptService.getReceiptByNumber(receiptNumber, user);
        return ResponseEntity.ok(new ReceiptResponse(receipt));
    }

    /**
     * Génère et télécharge le PDF d'un reçu
     */
    @GetMapping("/{receiptId}/pdf")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<?> downloadReceiptPdf(@PathVariable Long receiptId,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "Accept-Language", defaultValue = "fr") String acceptLanguage) {
        User user = userDetails.getUser();
        Locale locale = parseLocale(acceptLanguage);
        byte[] pdfBytes = receiptService.generateReceiptPdf(receiptId, user, locale);

        Receipt receipt = receiptService.getReceiptById(receiptId, user);
        String fileName = "receipt_" + receipt.getReceiptNumber() + ".pdf";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", fileName);
        headers.setContentLength(pdfBytes.length);
        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    /**
     * Génère et télécharge le PDF d'un reçu par son numéro
     */
    @GetMapping("/number/{receiptNumber}/pdf")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<?> downloadReceiptPdfByNumber(@PathVariable String receiptNumber,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "Accept-Language", defaultValue = "fr") String acceptLanguage) {
        User user = userDetails.getUser();
        Locale locale = parseLocale(acceptLanguage);
        byte[] pdfBytes = receiptService.generateReceiptPdfByNumber(receiptNumber, user, locale);

        String fileName = "receipt_" + receiptNumber + ".pdf";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", fileName);
        headers.setContentLength(pdfBytes.length);
        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    /**
     * Met à jour les informations d'un reçu
     */
    @PutMapping("/{receiptId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<?> updateReceipt(@PathVariable Long receiptId,
            @RequestBody Receipt receiptUpdate,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userDetails.getUser();
        Receipt updatedReceipt = receiptService.updateReceipt(receiptId, receiptUpdate, user);
        return ResponseEntity.ok(new ReceiptResponse(updatedReceipt));
    }

    /**
     * Supprime un reçu
     */
    @DeleteMapping("/{receiptId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN') or hasRole('PLATFORM_ADMIN')")
    public ResponseEntity<?> deleteReceipt(@PathVariable Long receiptId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userDetails.getUser();
        receiptService.deleteReceipt(receiptId, user);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    /**
     * Parse l'en-tête Accept-Language pour déterminer la locale
     */
    private Locale parseLocale(String acceptLanguage) {
        if (acceptLanguage == null || acceptLanguage.isEmpty()) {
            return Locale.FRENCH;
        }

        // Prendre la première langue de la liste
        String[] languages = acceptLanguage.split(",");
        String primaryLanguage = languages[0].trim().split(";")[0].trim();

        if (primaryLanguage.startsWith("pt")) {
            return new Locale("pt");
        } else if (primaryLanguage.startsWith("fr")) {
            return Locale.FRENCH;
        } else {
            // Par défaut, utiliser le français
            return Locale.FRENCH;
        }
    }
}
