package com.salesmanager.dto;

import java.util.UUID;

public record OrganisationListItemDto(
        UUID id,
        String name,
        String role,
        String status
) {}

