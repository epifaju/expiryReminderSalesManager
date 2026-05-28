package com.salesmanager.dto;

import java.util.UUID;

public record SwitchStoreRequest(
        UUID organisationId,
        UUID storeId
) {}

