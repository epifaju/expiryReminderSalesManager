package com.salesmanager.dto;

import java.util.Set;

public record SignupRequest(
    String username,
    String email,
    String password,
    Set<String> roles
) {}
