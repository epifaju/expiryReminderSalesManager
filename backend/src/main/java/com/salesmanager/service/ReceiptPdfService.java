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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    // private static final String FONT_PATH = "/fonts/"; // Vous pouvez ajouter des
    // polices personnalisées

    public byte[] generatePdf(Receipt receipt) throws IOException {
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
            addHeader(document, receipt, titleFont, headerFont);

            // Informations de la transaction
            addTransactionInfo(document, receipt, headerFont, normalFont);

            // Détails des articles
            addItemsTable(document, receipt, headerFont, normalFont, smallFont);

            // Totaux
            addTotals(document, receipt, headerFont, normalFont);

            // Informations de paiement
            addPaymentInfo(document, receipt, headerFont, normalFont);

            // Pied de page
            addFooter(document, receipt, smallFont);

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

    private void addHeader(Document document, Receipt receipt, PdfFont titleFont, PdfFont headerFont) {
        // Titre principal
        Paragraph title = new Paragraph("REÇU DE VENTE")
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
            Paragraph companyPhone = new Paragraph("Tél: " + receipt.getCompanyPhone())
                    .setFont(headerFont)
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(2);
            document.add(companyPhone);
        }

        if (receipt.getCompanyEmail() != null && !receipt.getCompanyEmail().isEmpty()) {
            Paragraph companyEmail = new Paragraph("Email: " + receipt.getCompanyEmail())
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

    private void addTransactionInfo(Document document, Receipt receipt, PdfFont headerFont, PdfFont normalFont) {
        Table infoTable = new Table(2).setWidth(UnitValue.createPercentValue(100));

        // Numéro de reçu
        infoTable.addCell(createCell("N° Reçu:", headerFont, true));
        infoTable.addCell(createCell(receipt.getReceiptNumber(), normalFont, false));

        // Date de vente
        String saleDate = receipt.getSale().getSaleDate().format(
                DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"));
        infoTable.addCell(createCell("Date:", headerFont, true));
        infoTable.addCell(createCell(saleDate, normalFont, false));

        // Vendeur
        if (receipt.getUser() != null) {
            String sellerName = receipt.getUser().getFirstName() + " " + receipt.getUser().getLastName();
            infoTable.addCell(createCell("Vendu par:", headerFont, true));
            infoTable.addCell(createCell(sellerName, normalFont, false));
        }

        document.add(infoTable);
        document.add(new Paragraph().setMarginBottom(15));
    }

    private void addItemsTable(Document document, Receipt receipt, PdfFont headerFont, PdfFont normalFont,
            PdfFont smallFont) {
        // En-tête du tableau des articles
        Paragraph itemsTitle = new Paragraph("DÉTAIL DES ARTICLES")
                .setFont(headerFont)
                .setFontSize(12)
                .setMarginBottom(10)
                .setFontColor(ColorConstants.DARK_GRAY);
        document.add(itemsTitle);

        Table itemsTable = new Table(5).setWidth(UnitValue.createPercentValue(100));

        // En-têtes des colonnes
        itemsTable.addHeaderCell(createHeaderCell("Article", headerFont));
        itemsTable.addHeaderCell(createHeaderCell("Qté", headerFont));
        itemsTable.addHeaderCell(createHeaderCell("Prix Unitaire", headerFont));
        itemsTable.addHeaderCell(createHeaderCell("Remise", headerFont));
        itemsTable.addHeaderCell(createHeaderCell("Total", headerFont));

        // Articles
        List<SaleItem> items = receipt.getSale().getSaleItems();
        for (SaleItem item : items) {
            itemsTable.addCell(createCell(item.getProduct().getName(), normalFont, false));
            itemsTable.addCell(createCell(String.valueOf(item.getQuantity()), normalFont, false));
            itemsTable.addCell(createCell(formatCurrency(item.getUnitPrice()), normalFont, false));
            itemsTable.addCell(createCell(formatCurrency(item.getDiscount()), normalFont, false));
            itemsTable.addCell(createCell(formatCurrency(item.getSubtotal()), normalFont, false));
        }

        document.add(itemsTable);
        document.add(new Paragraph().setMarginBottom(15));
    }

    private void addTotals(Document document, Receipt receipt, PdfFont headerFont, PdfFont normalFont) {
        Table totalsTable = new Table(2).setWidth(UnitValue.createPercentValue(60))
                .setHorizontalAlignment(HorizontalAlignment.RIGHT);

        // Sous-total
        totalsTable.addCell(createCell("Sous-total:", headerFont, true));
        totalsTable.addCell(createCell(formatCurrency(receipt.getTotalAmount()), normalFont, false));

        // Remise
        if (receipt.getDiscountAmount() != null && receipt.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            totalsTable.addCell(createCell("Remise:", headerFont, true));
            totalsTable.addCell(createCell("-" + formatCurrency(receipt.getDiscountAmount()), normalFont, false));
        }

        // TVA
        if (receipt.getTaxAmount() != null && receipt.getTaxAmount().compareTo(BigDecimal.ZERO) > 0) {
            totalsTable.addCell(createCell("TVA:", headerFont, true));
            totalsTable.addCell(createCell(formatCurrency(receipt.getTaxAmount()), normalFont, false));
        }

        // Total final
        totalsTable.addCell(createCell("TOTAL TTC:", headerFont, true)
                .setBackgroundColor(ColorConstants.LIGHT_GRAY));
        totalsTable.addCell(createCell(formatCurrency(receipt.getFinalAmount()), headerFont, false)
                .setBackgroundColor(ColorConstants.LIGHT_GRAY));

        document.add(totalsTable);
        document.add(new Paragraph().setMarginBottom(15));
    }

    private void addPaymentInfo(Document document, Receipt receipt, PdfFont headerFont, PdfFont normalFont) {
        if (receipt.getPaymentMethod() != null) {
            Table paymentTable = new Table(2).setWidth(UnitValue.createPercentValue(100));

            paymentTable.addCell(createCell("Mode de paiement:", headerFont, true));
            paymentTable.addCell(createCell(getPaymentMethodText(receipt.getPaymentMethod()), normalFont, false));

            document.add(paymentTable);
            document.add(new Paragraph().setMarginBottom(15));
        }
    }

    private void addFooter(Document document, Receipt receipt, PdfFont smallFont) {
        // Séparateur
        document.add(new LineSeparator(new com.itextpdf.kernel.pdf.canvas.draw.SolidLine())
                .setMarginTop(20).setMarginBottom(15));

        // Notes
        if (receipt.getNotes() != null && !receipt.getNotes().isEmpty()) {
            Paragraph notes = new Paragraph("Notes: " + receipt.getNotes())
                    .setFont(smallFont)
                    .setFontSize(9)
                    .setMarginBottom(10);
            document.add(notes);
        }

        // Mentions légales
        Paragraph legalText = new Paragraph(
                "Ce reçu fait foi de votre achat. Conservez-le précieusement.\n" +
                        "Pour toute réclamation, présentez ce reçu dans les 30 jours.")
                .setFont(smallFont)
                .setFontSize(8)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(10)
                .setFontColor(ColorConstants.GRAY);

        document.add(legalText);

        // QR Code (si disponible)
        if (receipt.getQrCodeData() != null && !receipt.getQrCodeData().isEmpty()) {
            Paragraph qrInfo = new Paragraph("QR Code de vérification disponible")
                    .setFont(smallFont)
                    .setFontSize(8)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(ColorConstants.GRAY);
            document.add(qrInfo);
        }

        // Timestamp de génération
        String generatedAt = "Généré le " + receipt.getCreatedAt().format(
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

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) {
            return "0,00 €";
        }

        NumberFormat formatter = NumberFormat.getCurrencyInstance(Locale.FRANCE);
        return formatter.format(amount);
    }

    private String getPaymentMethodText(Sale.PaymentMethod paymentMethod) {
        switch (paymentMethod) {
            case CASH:
                return "Espèces";
            case CARD:
                return "Carte bancaire";
            case MOBILE_MONEY:
                return "Mobile Money";
            case BANK_TRANSFER:
                return "Virement bancaire";
            case CREDIT:
                return "Crédit";
            default:
                return paymentMethod.toString();
        }
    }
}
