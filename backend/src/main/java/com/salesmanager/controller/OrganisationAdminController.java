package com.salesmanager.controller;

import com.salesmanager.dto.AddOrganisationMemberRequest;
import com.salesmanager.dto.CreateOrganisationRequest;
import com.salesmanager.dto.CreateStoreRequest;
import com.salesmanager.dto.OrganisationDto;
import com.salesmanager.dto.OrganisationMemberDto;
import com.salesmanager.dto.StoreDto;
import com.salesmanager.dto.UpdateOrganisationMemberRequest;
import com.salesmanager.dto.UpdateOrganisationRequest;
import com.salesmanager.dto.UpdateStoreRequest;
import com.salesmanager.entity.Organisation;
import com.salesmanager.entity.OrganisationMember;
import com.salesmanager.entity.OrganisationMemberId;
import com.salesmanager.entity.Store;
import com.salesmanager.entity.User;
import com.salesmanager.exception.NotFoundException;
import com.salesmanager.repository.OrganisationMemberRepository;
import com.salesmanager.repository.OrganisationRepository;
import com.salesmanager.repository.StoreRepository;
import com.salesmanager.repository.UserRepository;
import com.salesmanager.security.UserDetailsImpl;
import com.salesmanager.service.OrganisationAdminAccessService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;
import java.util.UUID;

/**
 * Endpoints admin pour gérer Organisations / Stores / Members (multi-tenant SaaS).
 */
@RestController
@RequestMapping("/admin/organisations")
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasRole('ADMIN') or hasRole('PLATFORM_ADMIN')")
public class OrganisationAdminController {

    private final OrganisationRepository organisationRepository;
    private final StoreRepository storeRepository;
    private final OrganisationMemberRepository organisationMemberRepository;
    private final UserRepository userRepository;
    private final OrganisationAdminAccessService organisationAdminAccessService;

    @PersistenceContext
    private EntityManager entityManager;

    public OrganisationAdminController(
            OrganisationRepository organisationRepository,
            StoreRepository storeRepository,
            OrganisationMemberRepository organisationMemberRepository,
            UserRepository userRepository,
            OrganisationAdminAccessService organisationAdminAccessService
    ) {
        this.organisationRepository = organisationRepository;
        this.storeRepository = storeRepository;
        this.organisationMemberRepository = organisationMemberRepository;
        this.userRepository = userRepository;
        this.organisationAdminAccessService = organisationAdminAccessService;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<OrganisationDto> createOrganisation(@Valid @RequestBody CreateOrganisationRequest request) {
        UserDetailsImpl current = currentUserDetailsOrNull();
        if (current == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findById(current.getId())
                .orElseThrow(() -> new NotFoundException("User not found: " + current.getId()));

        Organisation org = new Organisation();
        org.setId(UUID.randomUUID());
        org.setName(request.name());
        org.setIsActive(true);

        Organisation saved = organisationRepository.save(org);

        // Pro: l'admin qui crée l'organisation devient automatiquement membre,
        // sinon l'écran mobile "Organisation & boutique" ne verra jamais cette org.
        OrganisationMemberId memberId = new OrganisationMemberId(saved.getId(), user.getId());
        if (organisationMemberRepository.findById(memberId).isEmpty()) {
            OrganisationMember member = new OrganisationMember();
            member.setId(memberId);
            member.setOrganisation(saved);
            member.setUser(user);
            member.setRole(OrganisationAdminAccessService.ORGANISATION_ADMIN_ROLE);
            member.setStatus("ACTIVE");
            organisationMemberRepository.save(member);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
    }

    @GetMapping
    public ResponseEntity<List<OrganisationDto>> listOrganisations(
            @RequestParam(name = "activeOnly", defaultValue = "true") boolean activeOnly
    ) {
        UserDetailsImpl current = requireCurrentUser();
        List<Organisation> orgs = organisationAdminAccessService.listManageableOrganisations(
                current.getId(), activeOnly);
        return ResponseEntity.ok(orgs.stream().map(OrganisationAdminController::toDto).toList());
    }

    @GetMapping("/{organisationId}")
    public ResponseEntity<OrganisationDto> getOrganisation(@PathVariable UUID organisationId) {
        requireManageAccess(organisationId);
        Organisation org = organisationRepository.findById(organisationId)
                .orElseThrow(() -> new NotFoundException("Organisation not found: " + organisationId));
        return ResponseEntity.ok(toDto(org));
    }

    @PostMapping("/{organisationId}/stores")
    public ResponseEntity<StoreDto> createStore(
            @PathVariable UUID organisationId,
            @Valid @RequestBody CreateStoreRequest request
    ) {
        requireManageAccess(organisationId);
        Organisation org = organisationRepository.findById(organisationId)
                .orElseThrow(() -> new NotFoundException("Organisation not found: " + organisationId));

        Store store = new Store();
        store.setId(UUID.randomUUID());
        store.setOrganisation(org);
        store.setName(request.name());
        store.setAddress(request.address());
        store.setIsActive(true);

        Store saved = storeRepository.save(store);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
    }

    @GetMapping("/{organisationId}/stores")
    public ResponseEntity<List<StoreDto>> listStores(
            @PathVariable UUID organisationId,
            @RequestParam(name = "activeOnly", defaultValue = "true") boolean activeOnly
    ) {
        requireManageAccess(organisationId);
        organisationRepository.findById(organisationId)
                .orElseThrow(() -> new NotFoundException("Organisation not found: " + organisationId));

        List<Store> stores = activeOnly
                ? storeRepository.findByOrganisation_IdAndIsActiveTrueOrderByNameAsc(organisationId)
                : storeRepository.findByOrganisation_IdOrderByNameAsc(organisationId);

        return ResponseEntity.ok(stores.stream().map(OrganisationAdminController::toDto).toList());
    }

    @GetMapping("/{organisationId}/stores/{storeId}")
    public ResponseEntity<StoreDto> getStore(
            @PathVariable UUID organisationId,
            @PathVariable UUID storeId
    ) {
        requireManageAccess(organisationId);
        organisationRepository.findById(organisationId)
                .orElseThrow(() -> new NotFoundException("Organisation not found: " + organisationId));

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException("Store not found: " + storeId));

        if (store.getOrganisation() == null || store.getOrganisation().getId() == null || !store.getOrganisation().getId().equals(organisationId)) {
            throw new NotFoundException("Store not found in organisation: " + storeId);
        }

        return ResponseEntity.ok(toDto(store));
    }

    @PostMapping("/{organisationId}/members")
    @Transactional
    public ResponseEntity<OrganisationMemberDto> addMember(
            @PathVariable UUID organisationId,
            @Valid @RequestBody AddOrganisationMemberRequest request
    ) {
        requireManageAccess(organisationId);
        Organisation org = organisationRepository.findById(organisationId)
                .orElseThrow(() -> new NotFoundException("Organisation not found: " + organisationId));

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new NotFoundException("User not found: " + request.userId()));

        OrganisationMemberId id = new OrganisationMemberId(org.getId(), user.getId());
        OrganisationMember member = organisationMemberRepository.findById(id).orElseGet(() -> {
            OrganisationMember m = new OrganisationMember();
            m.setId(id);
            m.setOrganisation(org);
            m.setUser(user);
            return m;
        });

        member.setRole(request.role());
        member.setStatus((request.status() == null || request.status().isBlank()) ? "ACTIVE" : request.status());

        OrganisationMember saved = organisationMemberRepository.save(member);

        // Important: OrganisationMember.user est LAZY, éviter d'accéder au proxy ici (sinon 500).
        OrganisationMemberDto dto = new OrganisationMemberDto(
                org.getId(),
                user.getId(),
                user.getUsername(),
                saved.getRole(),
                saved.getStatus()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping("/{organisationId}/members")
    public ResponseEntity<List<OrganisationMemberDto>> listMembers(
            @PathVariable UUID organisationId,
            @RequestParam(name = "activeOnly", defaultValue = "true") boolean activeOnly
    ) {
        requireManageAccess(organisationId);
        organisationRepository.findById(organisationId)
                .orElseThrow(() -> new NotFoundException("Organisation not found: " + organisationId));

        List<OrganisationMember> members = activeOnly
                ? organisationMemberRepository.findActiveByOrganisation_IdOrderByUsername(organisationId)
                : organisationMemberRepository.findByOrganisation_IdOrderByUsername(organisationId);
        return ResponseEntity.ok(members.stream().map(OrganisationAdminController::toDto).toList());
    }

    @GetMapping("/{organisationId}/members/{userId}")
    public ResponseEntity<OrganisationMemberDto> getMember(
            @PathVariable UUID organisationId,
            @PathVariable Long userId
    ) {
        requireManageAccess(organisationId);
        Organisation org = organisationRepository.findById(organisationId)
                .orElseThrow(() -> new NotFoundException("Organisation not found: " + organisationId));

        OrganisationMemberId id = new OrganisationMemberId(org.getId(), userId);
        OrganisationMember member = organisationMemberRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Organisation member not found: " + userId));

        return ResponseEntity.ok(toDto(member));
    }

    @PatchMapping("/{organisationId}/deactivate")
    @Transactional
    public ResponseEntity<Void> deactivateOrganisation(@PathVariable UUID organisationId) {
        requireManageAccess(organisationId);
        Organisation org = organisationRepository.findById(organisationId)
                .orElseThrow(() -> new NotFoundException("Organisation not found: " + organisationId));

        org.setIsActive(false);
        organisationRepository.save(org);
        storeRepository.deactivateAllByOrganisationId(organisationId);
        organisationMemberRepository.deactivateAllByOrganisationId(organisationId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{organisationId}/activate")
    @Transactional
    public ResponseEntity<Void> activateOrganisation(
            @PathVariable UUID organisationId,
            @RequestParam(name = "cascade", defaultValue = "false") boolean cascade
    ) {
        requireManageAccess(organisationId);
        Organisation org = organisationRepository.findById(organisationId)
                .orElseThrow(() -> new NotFoundException("Organisation not found: " + organisationId));

        org.setIsActive(true);
        organisationRepository.save(org);

        // "pro": par défaut on n'active pas automatiquement les stores/members archivés.
        // Optionnellement, l'admin peut demander une réactivation en cascade.
        if (cascade) {
            List<Store> stores = storeRepository.findByOrganisation_IdOrderByNameAsc(organisationId);
            for (Store s : stores) {
                s.setIsActive(true);
            }
            storeRepository.saveAll(stores);

            List<OrganisationMember> members = organisationMemberRepository.findByOrganisation_Id(organisationId);
            for (OrganisationMember m : members) {
                m.setStatus("ACTIVE");
            }
            organisationMemberRepository.saveAll(members);
        }

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{organisationId}")
    @Transactional
    public ResponseEntity<OrganisationDto> updateOrganisation(
            @PathVariable UUID organisationId,
            @Valid @RequestBody UpdateOrganisationRequest request
    ) {
        requireManageAccess(organisationId);
        Organisation org = organisationRepository.findById(organisationId)
                .orElseThrow(() -> new NotFoundException("Organisation not found: " + organisationId));

        org.setName(request.name());
        Organisation saved = organisationRepository.save(org);
        return ResponseEntity.ok(toDto(saved));
    }

    @PatchMapping("/{organisationId}/stores/{storeId}/deactivate")
    @Transactional
    public ResponseEntity<Void> deactivateStore(
            @PathVariable UUID organisationId,
            @PathVariable UUID storeId
    ) {
        requireManageAccess(organisationId);
        organisationRepository.findById(organisationId)
                .orElseThrow(() -> new NotFoundException("Organisation not found: " + organisationId));

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException("Store not found: " + storeId));

        if (store.getOrganisation() == null || store.getOrganisation().getId() == null || !store.getOrganisation().getId().equals(organisationId)) {
            throw new NotFoundException("Store not found in organisation: " + storeId);
        }

        store.setIsActive(false);
        storeRepository.save(store);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{organisationId}/stores/{storeId}/activate")
    @Transactional
    public ResponseEntity<Void> activateStore(
            @PathVariable UUID organisationId,
            @PathVariable UUID storeId
    ) {
        requireManageAccess(organisationId);
        organisationRepository.findById(organisationId)
                .orElseThrow(() -> new NotFoundException("Organisation not found: " + organisationId));

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException("Store not found: " + storeId));

        if (store.getOrganisation() == null || store.getOrganisation().getId() == null || !store.getOrganisation().getId().equals(organisationId)) {
            throw new NotFoundException("Store not found in organisation: " + storeId);
        }

        store.setIsActive(true);
        storeRepository.save(store);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{organisationId}/stores/{storeId}")
    @Transactional
    public ResponseEntity<StoreDto> updateStore(
            @PathVariable UUID organisationId,
            @PathVariable UUID storeId,
            @Valid @RequestBody UpdateStoreRequest request
    ) {
        requireManageAccess(organisationId);
        organisationRepository.findById(organisationId)
                .orElseThrow(() -> new NotFoundException("Organisation not found: " + organisationId));

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new NotFoundException("Store not found: " + storeId));

        if (store.getOrganisation() == null || store.getOrganisation().getId() == null || !store.getOrganisation().getId().equals(organisationId)) {
            throw new NotFoundException("Store not found in organisation: " + storeId);
        }

        store.setName(request.name());
        store.setAddress(request.address());
        Store saved = storeRepository.save(store);
        return ResponseEntity.ok(toDto(saved));
    }

    @PatchMapping("/{organisationId}/members/{userId}/deactivate")
    @Transactional
    public ResponseEntity<Void> deactivateMember(
            @PathVariable UUID organisationId,
            @PathVariable Long userId
    ) {
        requireManageAccess(organisationId);
        Organisation org = organisationRepository.findById(organisationId)
                .orElseThrow(() -> new NotFoundException("Organisation not found: " + organisationId));

        OrganisationMemberId id = new OrganisationMemberId(org.getId(), userId);
        OrganisationMember member = organisationMemberRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Organisation member not found: " + userId));

        member.setStatus("INACTIVE");
        organisationMemberRepository.save(member);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{organisationId}/members/{userId}/activate")
    @Transactional
    public ResponseEntity<Void> activateMember(
            @PathVariable UUID organisationId,
            @PathVariable Long userId
    ) {
        requireManageAccess(organisationId);
        Organisation org = organisationRepository.findById(organisationId)
                .orElseThrow(() -> new NotFoundException("Organisation not found: " + organisationId));

        OrganisationMemberId id = new OrganisationMemberId(org.getId(), userId);
        OrganisationMember member = organisationMemberRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Organisation member not found: " + userId));

        member.setStatus("ACTIVE");
        organisationMemberRepository.save(member);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{organisationId}/members/{userId}")
    @Transactional
    public ResponseEntity<OrganisationMemberDto> updateMember(
            @PathVariable UUID organisationId,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateOrganisationMemberRequest request
    ) {
        requireManageAccess(organisationId);
        Organisation org = organisationRepository.findById(organisationId)
                .orElseThrow(() -> new NotFoundException("Organisation not found: " + organisationId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found: " + userId));

        OrganisationMemberId id = new OrganisationMemberId(org.getId(), userId);
        OrganisationMember member = organisationMemberRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Organisation member not found: " + userId));

        member.setRole(request.role());
        member.setStatus(request.status());
        OrganisationMember saved = organisationMemberRepository.save(member);
        OrganisationMemberDto dto = new OrganisationMemberDto(
                org.getId(),
                user.getId(),
                user.getUsername(),
                saved.getRole(),
                saved.getStatus()
        );
        return ResponseEntity.ok(dto);
    }

    private static OrganisationDto toDto(Organisation o) {
        return new OrganisationDto(o.getId(), o.getName(), o.getIsActive());
    }

    private static StoreDto toDto(Store s) {
        return new StoreDto(
                s.getId(),
                s.getOrganisation() == null ? null : s.getOrganisation().getId(),
                s.getName(),
                s.getAddress(),
                s.getIsActive()
        );
    }

    private static OrganisationMemberDto toDto(OrganisationMember m) {
        return new OrganisationMemberDto(
                m.getOrganisation() == null ? null : m.getOrganisation().getId(),
                m.getUser() == null ? null : m.getUser().getId(),
                m.getUser() == null ? null : m.getUser().getUsername(),
                m.getRole(),
                m.getStatus()
        );
    }

    private void requireManageAccess(UUID organisationId) {
        UserDetailsImpl current = requireCurrentUser();
        organisationAdminAccessService.requireManageOrganisation(current.getId(), organisationId);
    }

    private UserDetailsImpl requireCurrentUser() {
        UserDetailsImpl current = currentUserDetailsOrNull();
        if (current == null) {
            throw new org.springframework.security.access.AccessDeniedException("Not authenticated");
        }
        return current;
    }

    private static UserDetailsImpl currentUserDetailsOrNull() {
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

