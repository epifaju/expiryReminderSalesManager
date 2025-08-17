package com.salesmanager.service;

import com.salesmanager.dto.LoginRequest;
import com.salesmanager.dto.SignupRequest;
import com.salesmanager.entity.User;
import com.salesmanager.entity.Role;
import com.salesmanager.exception.ResourceAlreadyExistsException;
import com.salesmanager.repository.UserRepository;
import com.salesmanager.security.UserDetailsImpl;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {
    
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    public AuthService(AuthenticationManager authenticationManager,
                      PasswordEncoder passwordEncoder,
                      UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
    }

    public Authentication authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                loginRequest.username(),
                loginRequest.password()
            )
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        return authentication;
    }

    public User registerUser(SignupRequest signupRequest) {
        if (userRepository.existsByUsername(signupRequest.username())) {
            throw new ResourceAlreadyExistsException("Username already exists");
        }
        
        if (userRepository.existsByEmail(signupRequest.email())) {
            throw new ResourceAlreadyExistsException("Email already in use");
        }

        User user = new User();
        user.setUsername(signupRequest.username());
        user.setEmail(signupRequest.email());
        user.setPassword(passwordEncoder.encode(signupRequest.password()));
        
        Set<Role> roles = new HashSet<>();
        signupRequest.roles().forEach(role -> 
            roles.add(Role.valueOf(role.toUpperCase()))
        );
        user.setRoles(roles);

        return userRepository.save(user);
    }
}
