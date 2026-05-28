package com.salesmanager.dto;

import java.util.UUID;

public record OrganisationMemberDto(
        UUID organisationId,
        Long userId,
        String username,
        String role,
        String status
) {}

