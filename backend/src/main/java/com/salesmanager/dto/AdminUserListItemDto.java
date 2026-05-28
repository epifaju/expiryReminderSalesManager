package com.salesmanager.dto;

public record AdminUserListItemDto(
        Long id,
        String username,
        String email,
        String firstName,
        String lastName,
        boolean enabled
) {}

