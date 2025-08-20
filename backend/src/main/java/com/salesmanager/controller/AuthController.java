package com.salesmanager.controller;

import com.salesmanager.dto.JwtResponse;
import com.salesmanager.dto.LoginRequest;
import com.salesmanager.dto.SignupRequest;
import com.salesmanager.exception.ResourceAlreadyExistsException;
import com.salesmanager.security.JwtUtils;
import com.salesmanager.security.UserDetailsImpl;
import com.salesmanager.service.AuthService;
import org.springframework.context.MessageSource;
import org.springframework.security.core.Authentication;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {
    
    private final AuthService authService;
    private final JwtUtils jwtUtils;
    private final MessageSource messageSource;

    public AuthController(AuthService authService, JwtUtils jwtUtils, MessageSource messageSource) {
        this.authService = authService;
        this.jwtUtils = jwtUtils;
        this.messageSource = messageSource;
    }

    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> testConnection() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Backend is running");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
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
        try {
            var response = authService.registerUser(signUpRequest);
            return ResponseEntity.ok(response);
        } catch (ResourceAlreadyExistsException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Conflit de données");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Erreur lors de l'inscription");
            errorResponse.put("message", "Une erreur inattendue s'est produite. Veuillez réessayer.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
