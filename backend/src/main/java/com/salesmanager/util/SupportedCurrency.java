package com.salesmanager.util;

import java.util.Set;

public final class SupportedCurrency {

    public static final String DEFAULT = "EUR";
    public static final Set<String> ALLOWED = Set.of("EUR", "USD", "XOF");

    private SupportedCurrency() {
    }

    public static boolean isValid(String code) {
        return code != null && ALLOWED.contains(code.toUpperCase());
    }

    public static String normalize(String code) {
        if (code == null || code.isBlank()) {
            return DEFAULT;
        }
        String upper = code.trim().toUpperCase();
        if (!ALLOWED.contains(upper)) {
            throw new IllegalArgumentException("Devise non supportée: " + code);
        }
        return upper;
    }
}
