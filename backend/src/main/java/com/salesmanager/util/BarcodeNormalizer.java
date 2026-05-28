package com.salesmanager.util;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Variantes de code-barres pour recherche / stockage (EAN-13, GTIN-14, GS1 AI 01).
 * Aligné sur la logique mobile (gs1BarcodeParser).
 */
public final class BarcodeNormalizer {

    private BarcodeNormalizer() {
    }

    /** Forme préférée pour persister en base (EAN/GTIN court). */
    public static String canonical(String raw) {
        List<String> variants = candidates(raw);
        return variants.isEmpty() ? "" : variants.get(0);
    }

    public static List<String> candidates(String raw) {
        Set<String> out = new LinkedHashSet<>();
        if (raw == null) {
            return List.of();
        }

        String trimmed = raw.trim();
        if (!trimmed.isEmpty()) {
            out.add(trimmed);
        }

        String digits = trimmed.replaceAll("\\D", "");
        if (digits.isEmpty()) {
            return new ArrayList<>(out);
        }

        out.add(digits);

        if (digits.startsWith("01") && digits.length() >= 16) {
            String gtin14 = digits.substring(2, 16);
            out.add(gtin14);
            if (gtin14.startsWith("0") && gtin14.length() == 14) {
                out.add(gtin14.substring(1, 14));
            }
        }

        if (digits.length() == 14 && digits.startsWith("0")) {
            out.add(digits.substring(1, 14));
        }

        if (digits.length() == 13) {
            out.add("0" + digits);
        }

        if (digits.length() >= 8 && digits.length() <= 13) {
            String noLeadingZeros = digits.replaceFirst("^0+", "");
            if (!noLeadingZeros.isEmpty()) {
                out.add(noLeadingZeros);
            }
        }

        return new ArrayList<>(out);
    }
}
