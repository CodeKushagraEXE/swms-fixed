package com.swms.controller;
import com.swms.dto.Dtos;
import com.swms.service.AuthService;
import com.swms.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@Tag(name = "Tasks")
public class TaskController {
    @Autowired private TaskService taskService;
    @Autowired private AuthService authService;

    @GetMapping("/project/{projectId}")
    @Operation(summary = "Get all tasks in a project")
    public ResponseEntity<List<Dtos.TaskResponse>> getByProject(
            @PathVariable Long projectId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(taskService.getTasksByProject(projectId, search, status));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get task by ID")
    public ResponseEntity<Dtos.TaskResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTask(id));
    }

    @PostMapping
    @Operation(summary = "Create a new task")
    public ResponseEntity<Dtos.TaskResponse> create(@Valid @RequestBody Dtos.TaskRequest req, Principal p) {
        return ResponseEntity.ok(taskService.createTask(req, authService.getCurrentUser(p.getName())));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a task")
    public ResponseEntity<Dtos.TaskResponse> update(@PathVariable Long id,
            @Valid @RequestBody Dtos.TaskRequest req, Principal p) {
        return ResponseEntity.ok(taskService.updateTask(id, req, authService.getCurrentUser(p.getName())));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update task status (Kanban drag-drop)")
    public ResponseEntity<Dtos.TaskResponse> updateStatus(@PathVariable Long id,
            @RequestBody Dtos.TaskStatusUpdateRequest req, Principal p) {
        return ResponseEntity.ok(taskService.updateTaskStatus(id, req, authService.getCurrentUser(p.getName())));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a task")
    public ResponseEntity<Void> delete(@PathVariable Long id, Principal p) {
        taskService.deleteTask(id, authService.getCurrentUser(p.getName()));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/dependency")
    @Operation(summary = "Add task dependency")
    public ResponseEntity<Dtos.DependencySummary> addDependency(
            @RequestBody Dtos.DependencyRequest req, Principal p) {
        return ResponseEntity.ok(taskService.addDependency(req, authService.getCurrentUser(p.getName())));
    }

    @DeleteMapping("/{taskId}/dependency/{dependsOnId}")
    @Operation(summary = "Remove task dependency")
    public ResponseEntity<Void> removeDependency(@PathVariable Long taskId,
            @PathVariable Long dependsOnId, Principal p) {
        taskService.removeDependency(taskId, dependsOnId, authService.getCurrentUser(p.getName()));
        return ResponseEntity.noContent().build();
    }
}
