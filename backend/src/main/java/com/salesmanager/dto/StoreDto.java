package com.salesmanager.dto;

import java.util.UUID;

public record StoreDto(
        UUID id,
        UUID organisationId,
        String name,
        String address,
        Boolean isActive
) {}

