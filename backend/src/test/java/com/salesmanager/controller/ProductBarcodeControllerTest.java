package com.salesmanager.controller;

import com.salesmanager.entity.Product;
import com.salesmanager.entity.Role;
import com.salesmanager.entity.User;
import com.salesmanager.repository.ProductRepository;
import com.salesmanager.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProductBarcodeControllerTest {

    private static final String TEST_BARCODE = "6194001234567";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void seedProductWithBarcode() {
        if (productRepository.findByBarcode(TEST_BARCODE).isPresent()) {
            return;
        }

        User user = userRepository.findByUsername("admin").orElseGet(() -> {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@test.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setFirstName("Admin");
            admin.setLastName("User");
            admin.setEnabled(true);
            admin.setCreatedAt(LocalDateTime.now());
            admin.setRoles(Set.of(Role.ROLE_ADMIN));
            return userRepository.save(admin);
        });

        Product product = new Product();
        product.setName("Riz 5kg");
        product.setBarcode(TEST_BARCODE);
        product.setPurchasePrice(new BigDecimal("4000"));
        product.setSellingPrice(new BigDecimal("5000"));
        product.setStockQuantity(15);
        product.setMinStockLevel(5);
        product.setIsActive(true);
        product.setCreatedBy(user);
        productRepository.save(product);
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void findByBarcode_returnsApiResponseWithProductDto() throws Exception {
        mockMvc.perform(get("/api/v1/products/barcode/{barcode}", TEST_BARCODE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").isNumber())
                .andExpect(jsonPath("$.data.name").value("Riz 5kg"))
                .andExpect(jsonPath("$.data.barcode").value(TEST_BARCODE))
                .andExpect(jsonPath("$.data.salePrice").value(5000))
                .andExpect(jsonPath("$.data.stockQuantity").value(15))
                .andExpect(jsonPath("$.data.syncStatus").value("SYNCED"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void findByBarcode_unknown_returnsNotFoundApiResponse() throws Exception {
        mockMvc.perform(get("/api/v1/products/barcode/{barcode}", "0000000000000"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data").doesNotExist());
    }
}
