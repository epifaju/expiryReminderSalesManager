package com.salesmanager.config;

import com.salesmanager.entity.Role;
import com.salesmanager.entity.User;
import com.salesmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Créer un utilisateur admin par défaut s'il n'existe pas
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@test.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setFirstName("Admin");
            admin.setLastName("User");
            admin.setEnabled(true);
            admin.setCreatedAt(LocalDateTime.now());
            admin.setRoles(Set.of(Role.ROLE_ADMIN));
            
            userRepository.save(admin);
            System.out.println("✅ Utilisateur admin créé avec succès !");
            System.out.println("   Username: admin");
            System.out.println("   Password: admin123");
        } else {
            System.out.println("ℹ️ Utilisateur admin existe déjà");
        }
    }
}
