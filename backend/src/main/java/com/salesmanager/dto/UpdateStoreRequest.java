package com.salesmanager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateStoreRequest(
        @NotBlank @Size(max = 150) String name,
        @Size(max = 255) String address
) {}

