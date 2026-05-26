package com.salesmanager.service;

import com.salesmanager.dto.ChangePasswordRequest;
import com.salesmanager.dto.ProfileResponse;
import com.salesmanager.dto.UpdateProfileRequest;
import com.salesmanager.entity.Role;
import com.salesmanager.entity.User;
import com.salesmanager.exception.InvalidPasswordException;
import com.salesmanager.exception.ResourceAlreadyExistsException;
import com.salesmanager.exception.ResourceNotFoundException;
import com.salesmanager.repository.UserRepository;
import com.salesmanager.util.SupportedCurrency;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ProfileService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(Long userId) {
        User user = findUserById(userId);
        return toProfileResponse(user);
    }

    @Transactional
    public ProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = findUserById(userId);

        if (request.email() != null && !request.email().isBlank()) {
            String email = request.email().trim();
            if (userRepository.existsByEmailAndIdNot(email, userId)) {
                throw new ResourceAlreadyExistsException("Email déjà utilisé");
            }
            user.setEmail(email);
        }

        if (request.preferredCurrency() != null && !request.preferredCurrency().isBlank()) {
            user.setPreferredCurrency(SupportedCurrency.normalize(request.preferredCurrency()));
        }

        if (request.preferredLanguage() != null && !request.preferredLanguage().isBlank()) {
            user.setPreferredLanguage(request.preferredLanguage().trim());
        }

        User saved = userRepository.save(user);
        return toProfileResponse(saved);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = findUserById(userId);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new InvalidPasswordException("Mot de passe actuel incorrect");
        }

        if (request.currentPassword().equals(request.newPassword())) {
            throw new InvalidPasswordException("Le nouveau mot de passe doit être différent de l'ancien");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
    }

    public static ProfileResponse toProfileResponse(User user) {
        List<String> roles = user.getRoles().stream()
                .map(Role::name)
                .toList();

        return new ProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                roles,
                user.getPreferredLanguage(),
                user.getPreferredCurrency());
    }
}
