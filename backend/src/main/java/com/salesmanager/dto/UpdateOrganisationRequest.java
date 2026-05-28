package com.salesmanager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateOrganisationRequest(
        @NotBlank @Size(max = 150) String name
) {}

