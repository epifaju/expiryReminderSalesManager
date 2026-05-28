package com.salesmanager.dto;

import java.util.UUID;

public record OrganisationDto(
        UUID id,
        String name,
        Boolean isActive
) {}

