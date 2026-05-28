package com.salesmanager.dto;

import java.util.UUID;

public record StoreListItemDto(
        UUID id,
        UUID organisationId,
        String name,
        String address,
        Boolean isActive
) {}

