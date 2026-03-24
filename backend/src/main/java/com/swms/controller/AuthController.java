package com.swms.controller;
import com.swms.dto.Dtos;
import com.swms.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication")
public class AuthController {
    @Autowired private AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<Dtos.AuthResponse> register(@Valid @RequestBody Dtos.RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/login")
    @Operation(summary = "Login and get JWT token")
    public ResponseEntity<Dtos.AuthResponse> login(@Valid @RequestBody Dtos.LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user")
    public ResponseEntity<Dtos.UserSummary> me(java.security.Principal principal) {
        var user = authService.getCurrentUser(principal.getName());
        var dto = new Dtos.UserSummary();
        dto.setId(user.getId()); dto.setName(user.getName());
        dto.setEmail(user.getEmail()); dto.setRole(user.getRole().name());
        return ResponseEntity.ok(dto);
    }
}
