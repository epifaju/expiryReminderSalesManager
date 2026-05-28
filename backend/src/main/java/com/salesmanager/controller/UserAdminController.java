package com.salesmanager.controller;

import com.salesmanager.dto.AdminUserListItemDto;
import com.salesmanager.entity.User;
import com.salesmanager.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Endpoints admin pour retrouver des users (pour memberships).
 */
@RestController
@RequestMapping("/admin/users")
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasRole('ADMIN') or hasRole('PLATFORM_ADMIN')")
public class UserAdminController {

    private final UserRepository userRepository;

    public UserAdminController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Recherche simple par username/email (contains, case-insensitive).
     * Le résultat est volontairement limité (top 20) pour rester "safe" en prod.
     */
    @GetMapping
    public ResponseEntity<List<AdminUserListItemDto>> searchUsers(
            @RequestParam(name = "query", defaultValue = "") String query
    ) {
        String q = query == null ? "" : query.trim();
        if (q.isBlank()) {
            return ResponseEntity.ok(List.of());
        }

        List<User> users = userRepository
                .findTop20ByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrderByUsernameAsc(q, q);

        return ResponseEntity.ok(users.stream().map(UserAdminController::toDto).toList());
    }

    private static AdminUserListItemDto toDto(User u) {
        return new AdminUserListItemDto(
                u.getId(),
                u.getUsername(),
                u.getEmail(),
                u.getFirstName(),
                u.getLastName(),
                u.isEnabled()
        );
    }
}

