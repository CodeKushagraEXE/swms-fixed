package com.swms.controller;
import com.swms.dto.Dtos;
import com.swms.service.AuthService;
import com.swms.service.DashboardService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard")
public class DashboardController {
    @Autowired private DashboardService dashboardService;
    @Autowired private AuthService authService;

    @GetMapping("/stats")
    public ResponseEntity<Dtos.DashboardStats> getStats(Principal p) {
        return ResponseEntity.ok(dashboardService.getStats(authService.getCurrentUser(p.getName())));
    }
}
