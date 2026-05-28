package com.salesmanager.security;

import java.util.UUID;

/**
 * Contexte tenant (organisation/boutique) dérivé du JWT.
 * ThreadLocal car Spring Security + services sont synchrones par requête HTTP.
 */
public final class TenantContext {
    private TenantContext() {}

    private static final ThreadLocal<UUID> ORG_ID = new ThreadLocal<>();
    private static final ThreadLocal<UUID> STORE_ID = new ThreadLocal<>();

    public static UUID getOrganisationId() {
        return ORG_ID.get();
    }

    public static void setOrganisationId(UUID organisationId) {
        ORG_ID.set(organisationId);
    }

    public static UUID getStoreId() {
        return STORE_ID.get();
    }

    public static void setStoreId(UUID storeId) {
        STORE_ID.set(storeId);
    }

    public static void clear() {
        ORG_ID.remove();
        STORE_ID.remove();
    }
}

