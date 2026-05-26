package com.salesmanager.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;

public record UpdateProfileRequest(
        @Email(message = "Email invalide")
        String email,
        @Pattern(regexp = "EUR|USD|XOF", message = "Devise non supportée")
        String preferredCurrency,
        String preferredLanguage
) {}
