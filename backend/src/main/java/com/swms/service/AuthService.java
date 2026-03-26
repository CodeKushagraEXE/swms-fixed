package com.swms.service;
import com.swms.dto.Dtos;
import com.swms.exception.BadRequestException;
import com.swms.model.ActivityLog;
import com.swms.model.User;
import com.swms.repository.UserRepository;
import com.swms.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    @Autowired private UserRepository userRepo;
    @Autowired private PasswordEncoder encoder;
    @Autowired private JwtUtils jwtUtils;
    @Autowired private AuthenticationManager authManager;
    @Autowired private ActivityLogService logService;

    @Transactional
    public Dtos.AuthResponse register(Dtos.RegisterRequest req) {
        if (userRepo.existsByEmail(req.getEmail()))
            throw new BadRequestException("Email already in use: " + req.getEmail());
        var user = User.builder()
            .name(req.getName()).email(req.getEmail())
            .password(encoder.encode(req.getPassword()))
            .role(req.getRole() != null ? req.getRole() : User.Role.EMPLOYEE)
            .active(true)
            .build();
        user = userRepo.save(user);
        try {
            logService.log(ActivityLog.ActionType.USER_REGISTERED, "User", user.getId(),
                "User registered: " + user.getName(), null, null, user, null);
        } catch (Exception ignored) {
            // Never fail signup if audit logging has an internal issue.
        }
        String token = jwtUtils.generateJwtToken(user.getEmail());
        return new Dtos.AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole());
    }

    public Dtos.AuthResponse login(Dtos.LoginRequest req) {
        Authentication auth = authManager.authenticate(
            new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        var user = userRepo.findByEmail(req.getEmail()).orElseThrow();
        logService.log(ActivityLog.ActionType.USER_LOGGED_IN, "User", user.getId(),
            "User logged in", null, null, user, null);
        String token = jwtUtils.generateJwtToken(user.getEmail());
        return new Dtos.AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole());
    }

    public User getCurrentUser(String email) {
        return userRepo.findByEmail(email).orElseThrow(() ->
            new com.swms.exception.ResourceNotFoundException("User", 0L));
    }
}
