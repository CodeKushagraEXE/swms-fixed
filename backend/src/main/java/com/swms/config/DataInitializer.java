package com.swms.config;

import com.swms.model.User;
import com.swms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUserIfMissingOrInactive(
            "admin@swms.com", "Admin User", User.Role.ADMIN, "admin123");
        seedUserIfMissingOrInactive(
            "manager@swms.com", "Project Manager", User.Role.MANAGER, "manager123");
        seedUserIfMissingOrInactive(
            "dev@swms.com", "Developer", User.Role.EMPLOYEE, "dev123");
    }

    private void seedUserIfMissingOrInactive(String email, String name, User.Role role, String rawPassword) {
        var existing = userRepository.findByEmail(email).orElse(null);
        if (existing == null) {
            userRepository.save(User.builder()
                .name(name).email(email)
                .password(passwordEncoder.encode(rawPassword))
                .role(role)
                .active(true)
                .build());
            return;
        }

        // Ensure demo accounts are usable even if they were created previously as inactive.
        existing.setActive(true);
        existing.setPassword(passwordEncoder.encode(rawPassword));
        existing.setRole(role);
        userRepository.save(existing);
    }
}
