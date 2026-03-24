package com.swms.controller;
import com.swms.dto.Dtos;
import com.swms.service.AuthService;
import com.swms.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
@Tag(name = "Projects")
public class ProjectController {
    @Autowired private ProjectService projectService;
    @Autowired private AuthService authService;

    @GetMapping
    @Operation(summary = "Get all accessible projects")
    public ResponseEntity<List<Dtos.ProjectResponse>> getAll(Principal p) {
        return ResponseEntity.ok(projectService.getAllProjects(authService.getCurrentUser(p.getName())));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project by ID")
    public ResponseEntity<Dtos.ProjectResponse> getById(@PathVariable Long id, Principal p) {
        return ResponseEntity.ok(projectService.getProject(id, authService.getCurrentUser(p.getName())));
    }

    @PostMapping
    @Operation(summary = "Create a new project")
    public ResponseEntity<Dtos.ProjectResponse> create(@Valid @RequestBody Dtos.ProjectRequest req, Principal p) {
        return ResponseEntity.ok(projectService.createProject(req, authService.getCurrentUser(p.getName())));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a project")
    public ResponseEntity<Dtos.ProjectResponse> update(@PathVariable Long id,
            @Valid @RequestBody Dtos.ProjectRequest req, Principal p) {
        return ResponseEntity.ok(projectService.updateProject(id, req, authService.getCurrentUser(p.getName())));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a project")
    public ResponseEntity<Void> delete(@PathVariable Long id, Principal p) {
        projectService.deleteProject(id, authService.getCurrentUser(p.getName()));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/members/{userId}")
    @Operation(summary = "Add member to project")
    public ResponseEntity<Dtos.ProjectResponse> addMember(@PathVariable Long id, @PathVariable Long userId, Principal p) {
        return ResponseEntity.ok(projectService.addMember(id, userId, authService.getCurrentUser(p.getName())));
    }
}
