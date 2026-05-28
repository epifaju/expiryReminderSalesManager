package com.salesmanager.service;

import com.salesmanager.entity.Organisation;
import com.salesmanager.entity.OrganisationMember;
import com.salesmanager.entity.Store;
import com.salesmanager.repository.OrganisationMemberRepository;
import com.salesmanager.repository.OrganisationRepository;
import com.salesmanager.repository.StoreRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * Choisit l'organisation / boutique par défaut au login (évite de rester sur DEFAULT
 * quand l'utilisateur a créé sa propre organisation).
 */
@Service
public class TenantResolutionService {

    public static final UUID DEFAULT_ORG_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    public static final UUID DEFAULT_STORE_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");

    public record TenantContext(UUID organisationId, UUID storeId) {}

    private final OrganisationMemberRepository organisationMemberRepository;
    private final OrganisationRepository organisationRepository;
    private final StoreRepository storeRepository;

    public TenantResolutionService(
            OrganisationMemberRepository organisationMemberRepository,
            OrganisationRepository organisationRepository,
            StoreRepository storeRepository
    ) {
        this.organisationMemberRepository = organisationMemberRepository;
        this.organisationRepository = organisationRepository;
        this.storeRepository = storeRepository;
    }

    public TenantContext resolveForUser(Long userId, boolean platformAdmin) {
        if (platformAdmin) {
            return resolveForPlatformAdmin();
        }
        List<OrganisationMember> memberships = organisationMemberRepository
                .findActiveMembershipsWithOrganisationByUserId(userId);
        if (memberships.isEmpty()) {
            return fallbackDefault();
        }
        OrganisationMember chosen = pickPreferredMembership(memberships);
        UUID orgId = chosen.getOrganisation().getId();
        return new TenantContext(orgId, resolveStoreForOrganisation(orgId));
    }

    public Comparator<OrganisationMember> membershipDisplayOrder() {
        return Comparator
                .comparing((OrganisationMember m) -> DEFAULT_ORG_ID.equals(m.getOrganisation().getId()))
                .thenComparing(m -> m.getOrganisation().getName(), String.CASE_INSENSITIVE_ORDER);
    }

    private TenantContext resolveForPlatformAdmin() {
        List<Organisation> orgs = organisationRepository.findByIsActiveTrueOrderByNameAsc();
        Organisation org = orgs.stream()
                .filter(o -> !DEFAULT_ORG_ID.equals(o.getId()))
                .findFirst()
                .orElse(orgs.isEmpty() ? null : orgs.get(0));
        if (org == null) {
            return fallbackDefault();
        }
        return new TenantContext(org.getId(), resolveStoreForOrganisation(org.getId()));
    }

    private OrganisationMember pickPreferredMembership(List<OrganisationMember> memberships) {
        return memberships.stream()
                .sorted(membershipDisplayOrder())
                .findFirst()
                .orElse(memberships.get(0));
    }

    private UUID resolveStoreForOrganisation(UUID orgId) {
        List<Store> stores = storeRepository.findByOrganisation_IdAndIsActiveTrueOrderByNameAsc(orgId);
        return stores.stream()
                .map(Store::getId)
                .filter(id -> !DEFAULT_STORE_ID.equals(id))
                .findFirst()
                .orElse(stores.isEmpty() ? DEFAULT_STORE_ID : stores.get(0).getId());
    }

    private TenantContext fallbackDefault() {
        return new TenantContext(DEFAULT_ORG_ID, DEFAULT_STORE_ID);
    }
}
