package com.swms.controller;

import com.swms.dto.Dtos;
import com.swms.service.ActivityLogService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/logs")
@Tag(name = "Admin Audit")
public class AdminAuditController {
    @Autowired private ActivityLogService logService;

    @GetMapping("/auth")
    public ResponseEntity<List<Dtos.ActivityLogResponse>> getAuthLogs() {
        return ResponseEntity.ok(logService.getRecentAuthLogs());
    }
}
