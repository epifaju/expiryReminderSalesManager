package com.salesmanager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateOrganisationMemberRequest(
        @NotBlank @Size(max = 50) String role,
        @NotBlank @Size(max = 50) String status
) {}

