package com.salesmanager.dto;

import java.util.List;

public record ProfileResponse(
        Long id,
        String username,
        String email,
        String firstName,
        String lastName,
        List<String> roles,
        String preferredLanguage,
        String preferredCurrency
) {}
