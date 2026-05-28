package com.salesmanager.controller;

import com.salesmanager.dto.JwtResponse;
import com.salesmanager.dto.LoginRequest;
import com.salesmanager.dto.SignupRequest;
import com.salesmanager.dto.SwitchStoreRequest;
import com.salesmanager.exception.ResourceAlreadyExistsException;
import com.salesmanager.repository.OrganisationMemberRepository;
import com.salesmanager.repository.StoreRepository;
import com.salesmanager.security.JwtUtils;
import com.salesmanager.security.UserDetailsImpl;
import com.salesmanager.service.AuthService;
import com.salesmanager.service.TenantResolutionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    
    private final AuthService authService;
    private final JwtUtils jwtUtils;
    private final OrganisationMemberRepository organisationMemberRepository;
    private final StoreRepository storeRepository;
    private final TenantResolutionService tenantResolutionService;

    public AuthController(
            AuthService authService,
            JwtUtils jwtUtils,
            OrganisationMemberRepository organisationMemberRepository,
            StoreRepository storeRepository,
            TenantResolutionService tenantResolutionService
    ) {
        this.authService = authService;
        this.jwtUtils = jwtUtils;
        this.organisationMemberRepository = organisationMemberRepository;
        this.storeRepository = storeRepository;
        this.tenantResolutionService = tenantResolutionService;
    }

    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> testConnection() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Backend is running");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/signin")
    public ResponseEntity<JwtResponse> authenticateUser(@RequestBody LoginRequest loginRequest) {
        Authentication authentication = authService.authenticateUser(loginRequest);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        boolean platformAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> "ROLE_PLATFORM_ADMIN".equals(a.getAuthority()));
        TenantResolutionService.TenantContext tenant = tenantResolutionService.resolveForUser(
                userDetails.getId(), platformAdmin);
        UUID orgId = tenant.organisationId();
        UUID storeId = tenant.storeId();
        var jwt = jwtUtils.generateJwtToken(userDetails, orgId, storeId);
        var roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .toList();
        
        var user = userDetails.getUser();
        return ResponseEntity.ok(new JwtResponse(
                jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                roles,
                user.getPreferredLanguage(),
                user.getPreferredCurrency(),
                orgId.toString(),
                storeId.toString()));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signUpRequest) {
        try {
            var response = authService.registerUser(signUpRequest);
            return ResponseEntity.ok(response);
        } catch (ResourceAlreadyExistsException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Conflit de données");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
        } catch (Exception e) {
            log.error("Unexpected signup error for username={}", signUpRequest.username(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Erreur lors de l'inscription");
            errorResponse.put("message", "Une erreur inattendue s'est produite. Veuillez réessayer.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Retourne un nouveau JWT portant orgId/storeId.
     * Le client mobile appelle cet endpoint après sélection d'organisation/boutique.
     */
    @PostMapping("/switch-store")
    public ResponseEntity<JwtResponse> switchStore(@RequestBody SwitchStoreRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl userDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UUID organisationId = request.organisationId();
        UUID storeId = request.storeId();
        if (organisationId == null || storeId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        boolean platformAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> "ROLE_PLATFORM_ADMIN".equals(a.getAuthority()));
        if (!platformAdmin) {
            boolean isMember = organisationMemberRepository.findByUser_Id(userDetails.getId()).stream()
                    .anyMatch(m -> organisationId.equals(m.getOrganisation().getId())
                            && "ACTIVE".equalsIgnoreCase(m.getStatus()));
            if (!isMember) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        var store = storeRepository.findById(storeId).orElse(null);
        if (store == null || store.getOrganisation() == null || !organisationId.equals(store.getOrganisation().getId())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        var jwt = jwtUtils.generateJwtToken(userDetails, organisationId, storeId);
        var roles = userDetails.getAuthorities().stream().map(a -> a.getAuthority()).toList();
        var user = userDetails.getUser();

        return ResponseEntity.ok(new JwtResponse(
                jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                roles,
                user.getPreferredLanguage(),
                user.getPreferredCurrency(),
                organisationId.toString(),
                storeId.toString()
        ));
    }
}
