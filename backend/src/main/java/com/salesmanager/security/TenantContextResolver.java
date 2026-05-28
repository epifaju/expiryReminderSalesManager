package com.salesmanager.security;

import com.salesmanager.repository.OrganisationMemberRepository;
import com.salesmanager.service.TenantResolutionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Aligne le TenantContext sur le JWT et, si valide, sur les en-têtes X-Organisation-Id / X-Store-Id
 * envoyés par le mobile (évite JWT DEFAULT + headers nouvelle org).
 */
@Component
public class TenantContextResolver {

    private final JwtUtils jwtUtils;
    private final OrganisationMemberRepository organisationMemberRepository;

    public TenantContextResolver(
            JwtUtils jwtUtils,
            OrganisationMemberRepository organisationMemberRepository
    ) {
        this.jwtUtils = jwtUtils;
        this.organisationMemberRepository = organisationMemberRepository;
    }

    public void apply(HttpServletRequest request, Long userId, boolean platformAdmin) {
        TenantContext.clear();

        String jwt = parseBearer(request);
        UUID orgId = null;
        UUID storeId = null;

        if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
            String orgClaim = jwtUtils.getOrganisationIdFromJwtToken(jwt);
            String storeClaim = jwtUtils.getStoreIdFromJwtToken(jwt);
            if (orgClaim != null && !orgClaim.isBlank()) {
                orgId = UUID.fromString(orgClaim);
            }
            if (storeClaim != null && !storeClaim.isBlank()) {
                storeId = UUID.fromString(storeClaim);
            }
        }

        UUID headerOrg = parseUuidHeader(request, "X-Organisation-Id");
        UUID headerStore = parseUuidHeader(request, "X-Store-Id");

        if (headerOrg != null && canAccessOrganisation(userId, platformAdmin, headerOrg)) {
            orgId = headerOrg;
        }
        if (headerStore != null && orgId != null) {
            storeId = headerStore;
        }

        if (orgId != null) {
            TenantContext.setOrganisationId(orgId);
        }
        if (storeId != null) {
            TenantContext.setStoreId(storeId);
        }
    }

    private boolean canAccessOrganisation(Long userId, boolean platformAdmin, UUID organisationId) {
        if (platformAdmin) {
            return true;
        }
        if (userId == null) {
            return false;
        }
        return organisationMemberRepository.findActiveMembershipsWithOrganisationByUserId(userId).stream()
                .anyMatch(m -> organisationId.equals(m.getOrganisation().getId()));
    }

    private static UUID parseUuidHeader(HttpServletRequest request, String headerName) {
        String value = request.getHeader(headerName);
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private static String parseBearer(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (headerAuth != null && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }
}
