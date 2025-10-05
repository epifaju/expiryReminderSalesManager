package com.salesmanager.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.salesmanager.entity.Receipt;
import com.salesmanager.entity.Sale;
import com.salesmanager.entity.SaleItem;
import com.salesmanager.entity.User;
import com.salesmanager.util.MessageHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
public class ReceiptPdfService {

    private static final Logger logger = LoggerFactory.getLogger(ReceiptPdfService.class);

    @Autowired
    private MessageHelper messageHelper;

    // private static final String FONT_PATH = "/fonts/"; // Vous pouvez ajouter des
    // polices personnalisées

    public byte[] generatePdf(Receipt receipt, Locale locale) throws IOException {
        logger.info("Génération du PDF pour le reçu: {}", receipt.getReceiptNumber());

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(outputStream);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document document = new Document(pdfDoc);

        try {
            // Configuration des polices
            PdfFont titleFont = PdfFontFactory.createFont(com.itextpdf.io.font.constants.StandardFonts.HELVETICA_BOLD);
            PdfFont headerFont = PdfFontFactory.createFont(com.itextpdf.io.font.constants.StandardFonts.HELVETICA_BOLD);
            PdfFont normalFont = PdfFontFactory.createFont(com.itextpdf.io.font.constants.StandardFonts.HELVETICA);
            PdfFont smallFont = PdfFontFactory.createFont(com.itextpdf.io.font.constants.StandardFonts.HELVETICA);

            // En-tête du document
            addHeader(document, receipt, titleFont, headerFont, locale);

            // Informations de la transaction
            addTransactionInfo(document, receipt, headerFont, normalFont, locale);

            // Détails des articles
            addItemsTable(document, receipt, headerFont, normalFont, smallFont, locale);

            // Totaux
            addTotals(document, receipt, headerFont, normalFont, locale);

            // Informations de paiement
            addPaymentInfo(document, receipt, headerFont, normalFont, locale);

            // Pied de page
            addFooter(document, receipt, smallFont, locale);

            document.close();

            byte[] pdfBytes = outputStream.toByteArray();
            logger.info("PDF généré avec succès. Taille: {} bytes", pdfBytes.length);

            return pdfBytes;

        } catch (Exception e) {
            logger.error("Erreur lors de la génération du PDF pour le reçu: {}", receipt.getReceiptNumber(), e);
            throw new IOException("Erreur lors de la génération du PDF", e);
        } finally {
            if (document != null) {
                document.close();
            }
        }
    }

    private void addHeader(Document document, Receipt receipt, PdfFont titleFont, PdfFont headerFont, Locale locale) {
        // Titre principal
        String titleText = messageHelper.getMessage("receipt.title", locale);
        Paragraph title = new Paragraph(titleText)
                .setFont(titleFont)
                .setFontSize(24)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20)
                .setFontColor(ColorConstants.DARK_GRAY);

        document.add(title);

        // Informations de l'entreprise
        if (receipt.getCompanyName() != null && !receipt.getCompanyName().isEmpty()) {
            Paragraph companyName = new Paragraph(receipt.getCompanyName())
                    .setFont(headerFont)
                    .setFontSize(16)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(5);
            document.add(companyName);
        }

        // Adresse de l'entreprise
        if (receipt.getCompanyAddress() != null && !receipt.getCompanyAddress().isEmpty()) {
            Paragraph companyAddress = new Paragraph(receipt.getCompanyAddress())
                    .setFont(headerFont)
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(2);
            document.add(companyAddress);
        }

        // Contact de l'entreprise
        if (receipt.getCompanyPhone() != null && !receipt.getCompanyPhone().isEmpty()) {
            String phoneLabel = messageHelper.getMessage("receipt.phone", locale);
            Paragraph companyPhone = new Paragraph(phoneLabel + " " + receipt.getCompanyPhone())
                    .setFont(headerFont)
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(2);
            document.add(companyPhone);
        }

        if (receipt.getCompanyEmail() != null && !receipt.getCompanyEmail().isEmpty()) {
            String emailLabel = messageHelper.getMessage("receipt.email", locale);
            Paragraph companyEmail = new Paragraph(emailLabel + " " + receipt.getCompanyEmail())
                    .setFont(headerFont)
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20);
            document.add(companyEmail);
        }

        // Séparateur
        document.add(new LineSeparator(new com.itextpdf.kernel.pdf.canvas.draw.SolidLine())
                .setMarginBottom(15));
    }

    private void addTransactionInfo(Document document, Receipt receipt, PdfFont headerFont, PdfFont normalFont,
            Locale locale) {
        Table infoTable = new Table(2).setWidth(UnitValue.createPercentValue(100));

        // Numéro de reçu
        String receiptNumberLabel = messageHelper.getMessage("receipt.receiptNumber", locale);
        infoTable.addCell(createCell(receiptNumberLabel, headerFont, true));
        infoTable.addCell(createCell(receipt.getReceiptNumber(), normalFont, false));

        // Date de vente
        String saleDate = receipt.getSale().getSaleDate().format(
                DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"));
        String dateLabel = messageHelper.getMessage("receipt.date", locale);
        infoTable.addCell(createCell(dateLabel, headerFont, true));
        infoTable.addCell(createCell(saleDate, normalFont, false));

        // Vendeur
        if (receipt.getUser() != null) {
            String sellerName = receipt.getUser().getFirstName() + " " + receipt.getUser().getLastName();
            String soldByLabel = messageHelper.getMessage("receipt.soldBy", locale);
            infoTable.addCell(createCell(soldByLabel, headerFont, true));
            infoTable.addCell(createCell(sellerName, normalFont, false));
        }

        document.add(infoTable);
        document.add(new Paragraph().setMarginBottom(15));
    }

    private void addItemsTable(Document document, Receipt receipt, PdfFont headerFont, PdfFont normalFont,
            PdfFont smallFont, Locale locale) {
        // En-tête du tableau des articles
        String itemsTitleText = messageHelper.getMessage("receipt.itemsTitle", locale);
        Paragraph itemsTitle = new Paragraph(itemsTitleText)
                .setFont(headerFont)
                .setFontSize(12)
                .setMarginBottom(10)
                .setFontColor(ColorConstants.DARK_GRAY);
        document.add(itemsTitle);

        Table itemsTable = new Table(5).setWidth(UnitValue.createPercentValue(100));

        // En-têtes des colonnes
        String itemLabel = messageHelper.getMessage("receipt.item", locale);
        String quantityLabel = messageHelper.getMessage("receipt.quantity", locale);
        String unitPriceLabel = messageHelper.getMessage("receipt.unitPrice", locale);
        String discountLabel = messageHelper.getMessage("receipt.discount", locale);
        String totalLabel = messageHelper.getMessage("receipt.total", locale);

        itemsTable.addHeaderCell(createHeaderCell(itemLabel, headerFont));
        itemsTable.addHeaderCell(createHeaderCell(quantityLabel, headerFont));
        itemsTable.addHeaderCell(createHeaderCell(unitPriceLabel, headerFont));
        itemsTable.addHeaderCell(createHeaderCell(discountLabel, headerFont));
        itemsTable.addHeaderCell(createHeaderCell(totalLabel, headerFont));

        // Articles
        List<SaleItem> items = receipt.getSale().getSaleItems();
        for (SaleItem item : items) {
            itemsTable.addCell(createCell(item.getProduct().getName(), normalFont, false));
            itemsTable.addCell(createCell(String.valueOf(item.getQuantity()), normalFont, false));
            itemsTable.addCell(createCell(formatCurrency(item.getUnitPrice(), locale), normalFont, false));
            itemsTable.addCell(createCell(formatCurrency(item.getDiscount(), locale), normalFont, false));
            itemsTable.addCell(createCell(formatCurrency(item.getSubtotal(), locale), normalFont, false));
        }

        document.add(itemsTable);
        document.add(new Paragraph().setMarginBottom(15));
    }

    private void addTotals(Document document, Receipt receipt, PdfFont headerFont, PdfFont normalFont, Locale locale) {
        Table totalsTable = new Table(2).setWidth(UnitValue.createPercentValue(60))
                .setHorizontalAlignment(HorizontalAlignment.RIGHT);

        // Sous-total
        String subtotalLabel = messageHelper.getMessage("receipt.subtotal", locale);
        totalsTable.addCell(createCell(subtotalLabel, headerFont, true));
        totalsTable.addCell(createCell(formatCurrency(receipt.getTotalAmount(), locale), normalFont, false));

        // Remise
        if (receipt.getDiscountAmount() != null && receipt.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            String discountLabel = messageHelper.getMessage("receipt.discountAmount", locale);
            totalsTable.addCell(createCell(discountLabel, headerFont, true));
            totalsTable
                    .addCell(createCell("-" + formatCurrency(receipt.getDiscountAmount(), locale), normalFont, false));
        }

        // TVA
        if (receipt.getTaxAmount() != null && receipt.getTaxAmount().compareTo(BigDecimal.ZERO) > 0) {
            String taxLabel = messageHelper.getMessage("receipt.tax", locale);
            totalsTable.addCell(createCell(taxLabel, headerFont, true));
            totalsTable.addCell(createCell(formatCurrency(receipt.getTaxAmount(), locale), normalFont, false));
        }

        // Total final
        String totalAmountLabel = messageHelper.getMessage("receipt.totalAmount", locale);
        totalsTable.addCell(createCell(totalAmountLabel, headerFont, true)
                .setBackgroundColor(ColorConstants.LIGHT_GRAY));
        totalsTable.addCell(createCell(formatCurrency(receipt.getFinalAmount(), locale), headerFont, false)
                .setBackgroundColor(ColorConstants.LIGHT_GRAY));

        document.add(totalsTable);
        document.add(new Paragraph().setMarginBottom(15));
    }

    private void addPaymentInfo(Document document, Receipt receipt, PdfFont headerFont, PdfFont normalFont,
            Locale locale) {
        if (receipt.getPaymentMethod() != null) {
            Table paymentTable = new Table(2).setWidth(UnitValue.createPercentValue(100));

            String paymentMethodLabel = messageHelper.getMessage("receipt.paymentMethod", locale);
            paymentTable.addCell(createCell(paymentMethodLabel, headerFont, true));
            paymentTable
                    .addCell(createCell(getPaymentMethodText(receipt.getPaymentMethod(), locale), normalFont, false));

            document.add(paymentTable);
            document.add(new Paragraph().setMarginBottom(15));
        }
    }

    private void addFooter(Document document, Receipt receipt, PdfFont smallFont, Locale locale) {
        // Séparateur
        document.add(new LineSeparator(new com.itextpdf.kernel.pdf.canvas.draw.SolidLine())
                .setMarginTop(20).setMarginBottom(15));

        // Notes
        if (receipt.getNotes() != null && !receipt.getNotes().isEmpty()) {
            String notesLabel = messageHelper.getMessage("receipt.notes", locale);
            Paragraph notes = new Paragraph(notesLabel + " " + receipt.getNotes())
                    .setFont(smallFont)
                    .setFontSize(9)
                    .setMarginBottom(10);
            document.add(notes);
        }

        // Mentions légales
        String legalTextContent = messageHelper.getMessage("receipt.legalText", locale);
        Paragraph legalText = new Paragraph(legalTextContent)
                .setFont(smallFont)
                .setFontSize(8)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(10)
                .setFontColor(ColorConstants.GRAY);

        document.add(legalText);

        // QR Code (si disponible)
        if (receipt.getQrCodeData() != null && !receipt.getQrCodeData().isEmpty()) {
            String qrCodeText = messageHelper.getMessage("receipt.qrCode", locale);
            Paragraph qrInfo = new Paragraph(qrCodeText)
                    .setFont(smallFont)
                    .setFontSize(8)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(ColorConstants.GRAY);
            document.add(qrInfo);
        }

        // Timestamp de génération
        String generatedAtLabel = messageHelper.getMessage("receipt.generatedAt", locale);
        String generatedAt = generatedAtLabel + " " + receipt.getCreatedAt().format(
                DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm:ss"));
        Paragraph timestamp = new Paragraph(generatedAt)
                .setFont(smallFont)
                .setFontSize(7)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(ColorConstants.GRAY);

        document.add(timestamp);
    }

    private Cell createCell(String text, PdfFont font, boolean bold) {
        Cell cell = new Cell().add(new Paragraph(text).setFont(font));
        if (bold) {
            cell.setFont(font);
        }
        return cell;
    }

    private Cell createHeaderCell(String text, PdfFont font) {
        return new Cell()
                .add(new Paragraph(text).setFont(font))
                .setBackgroundColor(ColorConstants.LIGHT_GRAY)
                .setTextAlignment(TextAlignment.CENTER);
    }

    private String formatCurrency(BigDecimal amount, Locale locale) {
        if (amount == null) {
            return "0,00 €";
        }

        // Utiliser la locale appropriée pour le formatage des devises
        Locale currencyLocale = locale.getLanguage().equals("pt") ? new Locale("pt", "PT") : Locale.FRANCE;
        NumberFormat formatter = NumberFormat.getCurrencyInstance(currencyLocale);
        return formatter.format(amount);
    }

    private String getPaymentMethodText(Sale.PaymentMethod paymentMethod, Locale locale) {
        String key = "payment." + paymentMethod.name().toLowerCase();
        return messageHelper.getMessage(key, locale);
    }
}
