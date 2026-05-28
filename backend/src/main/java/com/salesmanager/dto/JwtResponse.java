package com.salesmanager.dto;

import java.util.List;

public record JwtResponse(
    String token,
    Long id,
    String username,
    String email,
    List<String> roles,
    String preferredLanguage,
    String preferredCurrency,
    String organisationId,
    String storeId
) {}
