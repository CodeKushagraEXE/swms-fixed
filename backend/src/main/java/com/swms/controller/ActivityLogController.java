package com.swms.controller;
import com.swms.dto.Dtos;
import com.swms.service.ActivityLogService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/logs")
@Tag(name = "Activity Logs")
public class ActivityLogController {
    @Autowired private ActivityLogService logService;

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<Dtos.ActivityLogResponse>> getProjectLogs(@PathVariable Long projectId) {
        return ResponseEntity.ok(logService.getProjectLogs(projectId));
    }
}
