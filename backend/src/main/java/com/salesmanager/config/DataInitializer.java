package com.salesmanager.config;

import com.salesmanager.entity.Role;
import com.salesmanager.entity.User;
import com.salesmanager.entity.Product;
import com.salesmanager.entity.Sale;
import com.salesmanager.entity.SaleItem;
import com.salesmanager.repository.UserRepository;
import com.salesmanager.repository.ProductRepository;
import com.salesmanager.repository.SaleRepository;
import com.salesmanager.repository.SaleItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.List;
import java.util.ArrayList;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private SaleItemRepository saleItemRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Créer un utilisateur admin par défaut s'il n'existe pas
        User admin = null;
        if (userRepository.findByUsername("admin").isEmpty()) {
            admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@test.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setFirstName("Admin");
            admin.setLastName("User");
            admin.setEnabled(true);
            admin.setCreatedAt(LocalDateTime.now());
            admin.setRoles(Set.of(Role.ROLE_ADMIN));
            
            admin = userRepository.save(admin);
            System.out.println("✅ Utilisateur admin créé avec succès !");
            System.out.println("   Username: admin");
            System.out.println("   Password: admin123");
        } else {
            admin = userRepository.findByUsername("admin").get();
            System.out.println("ℹ️ Utilisateur admin existe déjà");
        }

        // Créer des produits de démonstration s'ils n'existent pas
        if (productRepository.count() == 0) {
            List<Product> products = new ArrayList<>();
            
            // Produit 1 - Expire dans 2 jours (expire bientôt)
            Product product1 = new Product();
            product1.setName("Smartphone Samsung Galaxy");
            product1.setDescription("Smartphone Android dernière génération");
            product1.setPurchasePrice(new BigDecimal("599.99"));
            product1.setSellingPrice(new BigDecimal("699.99"));
            product1.setStockQuantity(25);
            product1.setMinStockLevel(5);
            product1.setExpiryDate(LocalDate.now().plusDays(2));
            product1.setCategory("Électronique");
            product1.setCreatedAt(LocalDateTime.now());
            products.add(product1);

            // Produit 2 - Expire dans 5 jours (expire bientôt)
            Product product2 = new Product();
            product2.setName("Ordinateur Portable HP");
            product2.setDescription("Laptop 15 pouces, 8GB RAM, 256GB SSD");
            product2.setPurchasePrice(new BigDecimal("799.99"));
            product2.setSellingPrice(new BigDecimal("899.99"));
            product2.setStockQuantity(15);
            product2.setMinStockLevel(3);
            product2.setExpiryDate(LocalDate.now().plusDays(5));
            product2.setCategory("Informatique");
            product2.setCreatedAt(LocalDateTime.now());
            products.add(product2);

            // Produit 3 - Expiré il y a 3 jours (déjà expiré)
            Product product3 = new Product();
            product3.setName("Casque Audio Bluetooth");
            product3.setDescription("Casque sans fil avec réduction de bruit");
            product3.setPurchasePrice(new BigDecimal("99.99"));
            product3.setSellingPrice(new BigDecimal("149.99"));
            product3.setStockQuantity(50);
            product3.setMinStockLevel(10);
            product3.setExpiryDate(LocalDate.now().minusDays(3));
            product3.setCategory("Audio");
            product3.setCreatedAt(LocalDateTime.now());
            products.add(product3);

            // Produit 4 - Expire dans 10 jours (expire bientôt avec 14 jours d'alerte)
            Product product4 = new Product();
            product4.setName("Tablette iPad");
            product4.setDescription("Tablette Apple 10.9 pouces");
            product4.setPurchasePrice(new BigDecimal("399.99"));
            product4.setSellingPrice(new BigDecimal("449.99"));
            product4.setStockQuantity(20);
            product4.setMinStockLevel(5);
            product4.setExpiryDate(LocalDate.now().plusDays(10));
            product4.setCategory("Électronique");
            product4.setCreatedAt(LocalDateTime.now());
            products.add(product4);

            // Produit 5 - Expiré il y a 1 semaine (déjà expiré)
            Product product5 = new Product();
            product5.setName("Montre Connectée");
            product5.setDescription("Smartwatch avec GPS et monitoring santé");
            product5.setPurchasePrice(new BigDecimal("249.99"));
            product5.setSellingPrice(new BigDecimal("299.99"));
            product5.setStockQuantity(30);
            product5.setMinStockLevel(8);
            product5.setExpiryDate(LocalDate.now().minusDays(7));
            product5.setCategory("Wearables");
            product5.setCreatedAt(LocalDateTime.now());
            products.add(product5);

            // Produit 6 - Expire dans 25 jours (expire bientôt avec 30 jours d'alerte)
            Product product6 = new Product();
            product6.setName("Écouteurs Sans Fil");
            product6.setDescription("Écouteurs Bluetooth avec étui de charge");
            product6.setPurchasePrice(new BigDecimal("79.99"));
            product6.setSellingPrice(new BigDecimal("99.99"));
            product6.setStockQuantity(40);
            product6.setMinStockLevel(10);
            product6.setExpiryDate(LocalDate.now().plusDays(25));
            product6.setCategory("Audio");
            product6.setCreatedAt(LocalDateTime.now());
            products.add(product6);

            // Produit 7 - Expire dans 1 an (produit normal)
            Product product7 = new Product();
            product7.setName("Clavier Mécanique");
            product7.setDescription("Clavier gaming RGB avec switches mécaniques");
            product7.setPurchasePrice(new BigDecimal("89.99"));
            product7.setSellingPrice(new BigDecimal("119.99"));
            product7.setStockQuantity(35);
            product7.setMinStockLevel(8);
            product7.setExpiryDate(LocalDate.now().plusYears(1));
            product7.setCategory("Informatique");
            product7.setCreatedAt(LocalDateTime.now());
            products.add(product7);

            products = productRepository.saveAll(products);
            System.out.println("✅ " + products.size() + " produits de démonstration créés !");

            // Créer des ventes de démonstration
            createSampleSales(admin, products);
        } else {
            System.out.println("ℹ️ Produits existent déjà (" + productRepository.count() + " produits)");
        }
    }

    private void createSampleSales(User admin, List<Product> products) {
        if (saleRepository.count() == 0) {
            List<Sale> sales = new ArrayList<>();
            
            // Vente 1 - Il y a 7 jours
            Sale sale1 = new Sale();
            sale1.setCustomerName("Jean Dupont");
            sale1.setCustomerEmail("jean.dupont@email.com");
            sale1.setTotalAmount(new BigDecimal("849.98"));
            sale1.setSaleDate(LocalDateTime.now().minusDays(7));
            sale1.setCreatedAt(LocalDateTime.now().minusDays(7));
            sale1 = saleRepository.save(sale1);

            // Items pour vente 1
            SaleItem item1 = new SaleItem();
            item1.setSale(sale1);
            item1.setProduct(products.get(0)); // Smartphone
            item1.setQuantity(1);
            item1.setUnitPrice(products.get(0).getSellingPrice());
            item1.setSubtotal(products.get(0).getSellingPrice());
            saleItemRepository.save(item1);

            SaleItem item2 = new SaleItem();
            item2.setSale(sale1);
            item2.setProduct(products.get(2)); // Casque
            item2.setQuantity(1);
            item2.setUnitPrice(products.get(2).getSellingPrice());
            item2.setSubtotal(products.get(2).getSellingPrice());
            saleItemRepository.save(item2);

            // Vente 2 - Il y a 3 jours
            Sale sale2 = new Sale();
            sale2.setCustomerName("Marie Martin");
            sale2.setCustomerEmail("marie.martin@email.com");
            sale2.setTotalAmount(new BigDecimal("899.99"));
            sale2.setSaleDate(LocalDateTime.now().minusDays(3));
            sale2.setCreatedAt(LocalDateTime.now().minusDays(3));
            sale2 = saleRepository.save(sale2);

            SaleItem item3 = new SaleItem();
            item3.setSale(sale2);
            item3.setProduct(products.get(1)); // Ordinateur
            item3.setQuantity(1);
            item3.setUnitPrice(products.get(1).getSellingPrice());
            item3.setSubtotal(products.get(1).getSellingPrice());
            saleItemRepository.save(item3);

            // Vente 3 - Aujourd'hui
            Sale sale3 = new Sale();
            sale3.setCustomerName("Pierre Durand");
            sale3.setCustomerEmail("pierre.durand@email.com");
            sale3.setTotalAmount(new BigDecimal("749.98"));
            sale3.setSaleDate(LocalDateTime.now());
            sale3.setCreatedAt(LocalDateTime.now());
            sale3 = saleRepository.save(sale3);

            SaleItem item4 = new SaleItem();
            item4.setSale(sale3);
            item4.setProduct(products.get(3)); // iPad
            item4.setQuantity(1);
            item4.setUnitPrice(products.get(3).getSellingPrice());
            item4.setSubtotal(products.get(3).getSellingPrice());
            saleItemRepository.save(item4);

            SaleItem item5 = new SaleItem();
            item5.setSale(sale3);
            item5.setProduct(products.get(4)); // Montre
            item5.setQuantity(1);
            item5.setUnitPrice(products.get(4).getSellingPrice());
            item5.setSubtotal(products.get(4).getSellingPrice());
            saleItemRepository.save(item5);

            System.out.println("✅ 3 ventes de démonstration créées avec 5 articles !");
        } else {
            System.out.println("ℹ️ Ventes existent déjà (" + saleRepository.count() + " ventes)");
        }
    }
}
