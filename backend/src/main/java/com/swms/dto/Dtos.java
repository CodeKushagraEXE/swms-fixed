package com.swms.dto;

import com.swms.model.Task;
import com.swms.model.TaskDependency;
import com.swms.model.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public class Dtos {

    @Data public static class RegisterRequest {
        @NotBlank private String name;
        @NotBlank @Email private String email;
        @NotBlank @Size(min=6) private String password;
        private User.Role role = User.Role.EMPLOYEE;
    }

    @Data public static class LoginRequest {
        @NotBlank @Email private String email;
        @NotBlank private String password;
    }

    @Data public static class AuthResponse {
        private String token;
        private String type = "Bearer";
        private Long id;
        private String name;
        private String email;
        private User.Role role;
        public AuthResponse(String token, Long id, String name, String email, User.Role role) {
            this.token = token; this.id = id; this.name = name; this.email = email; this.role = role;
        }
    }

    @Data public static class ProjectRequest {
        @NotBlank private String name;
        private String description;
        private Set<Long> memberIds;
    }

    @Data public static class ProjectResponse {
        private Long id; private String name; private String description;
        private String status; private UserSummary owner; private Set<UserSummary> members;
        private long totalTasks; private long completedTasks; private LocalDateTime createdAt;
    }

    @Data public static class TaskRequest {
        @NotBlank private String title;
        private String description;
        private Task.Status status = Task.Status.TODO;
        private Task.Priority priority = Task.Priority.MEDIUM;
        private Long assignedUserId; private Long projectId;
        private LocalDate dueDate; private Integer position;
    }

    @Data public static class TaskStatusUpdateRequest {
        private Task.Status status;
        private Integer position;
    }

    @Data public static class TaskResponse {
        private Long id; private String title; private String description;
        private String status; private String priority;
        private LocalDate dueDate; private Integer position;
        private Long projectId; private String projectName;
        private UserSummary assignedUser; private UserSummary createdBy;
        private List<DependencySummary> dependencies;
        private LocalDateTime createdAt; private LocalDateTime updatedAt;
        private boolean blocked;
    }

    @Data public static class DependencyRequest {
        private Long taskId; private Long dependsOnTaskId;
        private TaskDependency.DependencyType type;
    }

    @Data public static class DependencySummary {
        private Long id; private Long taskId; private String taskTitle;
        private Long dependsOnTaskId; private String dependsOnTaskTitle;
        private String dependsOnTaskStatus; private String type;
    }

    @Data public static class ActivityLogResponse {
        private Long id; private String action; private String entityType;
        private Long entityId; private String details; private String oldValue; private String newValue;
        private UserSummary user; private LocalDateTime createdAt;
    }

    @Data public static class UserSummary {
        private Long id; private String name; private String email; private String role;
    }

    @Data public static class DashboardStats {
        private long totalProjects; private long totalTasks;
        private long todoTasks; private long inProgressTasks; private long doneTasks;
        private List<ProjectStat> projectStats;
    }

    @Data public static class ProjectStat {
        private Long projectId; private String projectName;
        private long total; private long completed; private long inProgress;
        private double completionPercent;
    }

    @Data public static class WsEvent {
        private String type; private Object payload;
        private Long projectId; private String actorName; private LocalDateTime timestamp;
        public WsEvent(String type, Object payload, Long projectId, String actorName) {
            this.type = type; this.payload = payload; this.projectId = projectId;
            this.actorName = actorName; this.timestamp = LocalDateTime.now();
        }
    }
}
