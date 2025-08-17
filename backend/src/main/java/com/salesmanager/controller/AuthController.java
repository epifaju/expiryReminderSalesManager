package com.salesmanager.controller;

import com.salesmanager.dto.JwtResponse;
import com.salesmanager.dto.LoginRequest;
import com.salesmanager.dto.SignupRequest;
import com.salesmanager.security.JwtUtils;
import com.salesmanager.security.UserDetailsImpl;
import com.salesmanager.service.AuthService;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {
    
    private final AuthService authService;
    private final JwtUtils jwtUtils;

    public AuthController(AuthService authService, JwtUtils jwtUtils) {
        this.authService = authService;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/signin")
    public ResponseEntity<JwtResponse> authenticateUser(@RequestBody LoginRequest loginRequest) {
        Authentication authentication = authService.authenticateUser(loginRequest);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        var jwt = jwtUtils.generateJwtToken(userDetails);
        var roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .toList();
        
        return ResponseEntity.ok(new JwtResponse(
                jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                roles));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signUpRequest) {
        return ResponseEntity.ok(authService.registerUser(signUpRequest));
    }
}
