package com.salesmanager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Ajoute un membre à une organisation.
 * role/status sont stockés en String côté DB (organisation_members).
 */
public record AddOrganisationMemberRequest(
        @NotNull Long userId,
        @NotBlank @Size(max = 50) String role,
        @Size(max = 50) String status
) {}

