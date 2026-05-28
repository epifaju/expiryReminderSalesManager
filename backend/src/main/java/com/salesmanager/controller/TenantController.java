package com.salesmanager.controller;

import com.salesmanager.dto.OrganisationListItemDto;
import com.salesmanager.dto.StoreListItemDto;
import com.salesmanager.repository.OrganisationMemberRepository;
import com.salesmanager.repository.OrganisationRepository;
import com.salesmanager.repository.StoreRepository;
import com.salesmanager.security.UserDetailsImpl;
import com.salesmanager.service.TenantResolutionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping
@CrossOrigin(origins = "*", maxAge = 3600)
public class TenantController {

    private final OrganisationMemberRepository organisationMemberRepository;
    private final OrganisationRepository organisationRepository;
    private final StoreRepository storeRepository;
    private final TenantResolutionService tenantResolutionService;

    public TenantController(
            OrganisationMemberRepository organisationMemberRepository,
            OrganisationRepository organisationRepository,
            StoreRepository storeRepository,
            TenantResolutionService tenantResolutionService
    ) {
        this.organisationMemberRepository = organisationMemberRepository;
        this.organisationRepository = organisationRepository;
        this.storeRepository = storeRepository;
        this.tenantResolutionService = tenantResolutionService;
    }

    @GetMapping("/me/organisations")
    public ResponseEntity<List<OrganisationListItemDto>> myOrganisations() {
        UserDetailsImpl user = currentUserDetailsOrNull();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        boolean isPlatformAdmin = isPlatformAdmin();
        if (isPlatformAdmin) {
            var orgs = organisationRepository.findAllByOrderByNameAsc();
            var result = orgs.stream()
                    .map(o -> new OrganisationListItemDto(
                            o.getId(),
                            o.getName(),
                            "PLATFORM_ADMIN",
                            "ACTIVE"
                    ))
                    .toList();
            return ResponseEntity.ok(result);
        }

        var memberships = organisationMemberRepository.findActiveMembershipsWithOrganisationByUserId(user.getId());
        var result = memberships.stream()
                .sorted(tenantResolutionService.membershipDisplayOrder())
                .map(m -> new OrganisationListItemDto(
                        m.getOrganisation().getId(),
                        m.getOrganisation().getName(),
                        m.getRole(),
                        m.getStatus()
                ))
                .toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/organisations/{organisationId}/stores")
    public ResponseEntity<List<StoreListItemDto>> listStores(@PathVariable UUID organisationId) {
        UserDetailsImpl user = currentUserDetailsOrNull();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (isPlatformAdmin()) {
            var stores = storeRepository.findByOrganisation_IdAndIsActiveTrueOrderByNameAsc(organisationId);
            var result = stores.stream()
                    .map(s -> new StoreListItemDto(
                            s.getId(),
                            organisationId,
                            s.getName(),
                            s.getAddress(),
                            s.getIsActive()
                    ))
                    .toList();
            return ResponseEntity.ok(result);
        }

        boolean isMember = organisationMemberRepository.findActiveMembershipsWithOrganisationByUserId(user.getId()).stream()
                .anyMatch(m -> organisationId.equals(m.getOrganisation().getId()));
        if (!isMember) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        var stores = storeRepository.findByOrganisation_IdAndIsActiveTrueOrderByNameAsc(organisationId);
        var result = stores.stream()
                .map(s -> new StoreListItemDto(
                        s.getId(),
                        organisationId,
                        s.getName(),
                        s.getAddress(),
                        s.getIsActive()
                ))
                .toList();

        return ResponseEntity.ok(result);
    }

    private static boolean isPlatformAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream().anyMatch(a -> "ROLE_PLATFORM_ADMIN".equals(a.getAuthority()));
    }

    private UserDetailsImpl currentUserDetailsOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetailsImpl u) {
            return u;
        }
        return null;
    }
}

