package com.salesmanager.service;

import com.salesmanager.entity.Organisation;
import com.salesmanager.entity.OrganisationMember;
import com.salesmanager.entity.OrganisationMemberId;
import com.salesmanager.exception.ForbiddenException;
import com.salesmanager.repository.OrganisationMemberRepository;
import com.salesmanager.repository.OrganisationRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * Contrôle d'accès admin tenant : un ROLE_ADMIN global ne gère que les orgs
 * où il est membre avec le rôle organisation "ADMIN". ROLE_PLATFORM_ADMIN voit tout.
 */
@Service
public class OrganisationAdminAccessService {

    public static final String ORGANISATION_ADMIN_ROLE = "ADMIN";

    private final OrganisationRepository organisationRepository;
    private final OrganisationMemberRepository organisationMemberRepository;

    public OrganisationAdminAccessService(
            OrganisationRepository organisationRepository,
            OrganisationMemberRepository organisationMemberRepository
    ) {
        this.organisationRepository = organisationRepository;
        this.organisationMemberRepository = organisationMemberRepository;
    }

    public boolean isPlatformAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_PLATFORM_ADMIN".equals(a.getAuthority()));
    }

    public void requireManageOrganisation(Long userId, UUID organisationId) {
        if (isPlatformAdmin()) {
            return;
        }
        if (!canManageOrganisation(userId, organisationId)) {
            throw new ForbiddenException("Accès non autorisé à cette organisation");
        }
    }

    public boolean canManageOrganisation(Long userId, UUID organisationId) {
        if (isPlatformAdmin()) {
            return true;
        }
        return organisationMemberRepository.findById(new OrganisationMemberId(organisationId, userId))
                .filter(this::isActiveOrganisationAdmin)
                .isPresent();
    }

    public List<Organisation> listManageableOrganisations(Long userId, boolean activeOnly) {
        if (isPlatformAdmin()) {
            return activeOnly
                    ? organisationRepository.findByIsActiveTrueOrderByNameAsc()
                    : organisationRepository.findAllByOrderByNameAsc();
        }

        List<OrganisationMember> memberships = activeOnly
                ? organisationMemberRepository.findActiveAdminMembershipsByUserId(userId)
                : organisationMemberRepository.findAdminMembershipsByUserId(userId);

        return memberships.stream()
                .map(OrganisationMember::getOrganisation)
                .filter(o -> !activeOnly || Boolean.TRUE.equals(o.getIsActive()))
                .sorted(Comparator.comparing(Organisation::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private boolean isActiveOrganisationAdmin(OrganisationMember member) {
        return isOrganisationAdminRole(member.getRole())
                && "ACTIVE".equalsIgnoreCase(member.getStatus());
    }

    private static boolean isOrganisationAdminRole(String role) {
        if (role == null) {
            return false;
        }
        String normalized = role.trim().toUpperCase();
        return ORGANISATION_ADMIN_ROLE.equals(normalized) || "ORG_ADMIN".equals(normalized);
    }
}
