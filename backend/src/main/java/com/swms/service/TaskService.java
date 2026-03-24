package com.swms.service;
import com.swms.dto.Dtos;
import com.swms.exception.*;
import com.swms.model.*;
import com.swms.repository.*;
import com.swms.websocket.WebSocketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TaskService {
    @Autowired private TaskRepository taskRepo;
    @Autowired private ProjectRepository projectRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private TaskDependencyRepository depRepo;
    @Autowired private ActivityLogService logService;
    @Autowired private WebSocketService wsService;

    @Transactional(readOnly = true)
    public List<Dtos.TaskResponse> getTasksByProject(Long projectId, String search, String status) {
        List<Task> tasks;
        if (search != null && !search.isBlank()) {
            tasks = taskRepo.searchByProjectAndQuery(projectId, search);
        } else {
            tasks = taskRepo.findByProjectIdOrderByPositionAsc(projectId);
        }
        if (status != null && !status.isBlank()) {
            Task.Status s = Task.Status.valueOf(status.toUpperCase());
            tasks = tasks.stream().filter(t -> t.getStatus() == s).collect(Collectors.toList());
        }
        return tasks.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Dtos.TaskResponse getTask(Long id) {
        return toDto(taskRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task", id)));
    }

    @Transactional
    public Dtos.TaskResponse createTask(Dtos.TaskRequest req, User currentUser) {
        var project = projectRepo.findById(req.getProjectId())
            .orElseThrow(() -> new ResourceNotFoundException("Project", req.getProjectId()));
        var task = Task.builder()
            .title(req.getTitle()).description(req.getDescription())
            .status(req.getStatus() != null ? req.getStatus() : Task.Status.TODO)
            .priority(req.getPriority() != null ? req.getPriority() : Task.Priority.MEDIUM)
            .dueDate(req.getDueDate()).project(project).createdBy(currentUser)
            .position(req.getPosition() != null ? req.getPosition() : 0).build();
        if (req.getAssignedUserId() != null) {
            task.setAssignedUser(userRepo.findById(req.getAssignedUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", req.getAssignedUserId())));
        }
        task = taskRepo.save(task);
        logService.log(ActivityLog.ActionType.TASK_CREATED, "Task", task.getId(),
            "Task created: " + task.getTitle(), null, null, currentUser, project);
        var dto = toDto(task);
        wsService.broadcastTaskEvent(project.getId(), "TASK_CREATED", dto, currentUser.getName());
        return dto;
    }

    @Transactional
    public Dtos.TaskResponse updateTask(Long id, Dtos.TaskRequest req, User currentUser) {
        var task = taskRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task", id));
        task.setTitle(req.getTitle());
        if (req.getDescription() != null) task.setDescription(req.getDescription());
        if (req.getPriority() != null) task.setPriority(req.getPriority());
        if (req.getDueDate() != null) task.setDueDate(req.getDueDate());
        if (req.getPosition() != null) task.setPosition(req.getPosition());

        // FIX #3: Handle both assignment AND unassignment (when assignedUserId is null)
        var oldAssignee = task.getAssignedUser();
        if (req.getAssignedUserId() != null) {
            var newAssignee = userRepo.findById(req.getAssignedUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", req.getAssignedUserId()));
            task.setAssignedUser(newAssignee);
            if (oldAssignee == null || !oldAssignee.getId().equals(newAssignee.getId())) {
                logService.log(ActivityLog.ActionType.TASK_ASSIGNED, "Task", task.getId(),
                    "Task assigned to: " + newAssignee.getName(),
                    oldAssignee != null ? oldAssignee.getName() : null, newAssignee.getName(),
                    currentUser, task.getProject());
            }
        } else {
            // assignedUserId explicitly not provided — unassign
            task.setAssignedUser(null);
            if (oldAssignee != null) {
                logService.log(ActivityLog.ActionType.TASK_UNASSIGNED, "Task", task.getId(),
                    "Task unassigned from: " + oldAssignee.getName(),
                    oldAssignee.getName(), null,
                    currentUser, task.getProject());
            }
        }

        task = taskRepo.save(task);
        logService.log(ActivityLog.ActionType.TASK_UPDATED, "Task", task.getId(),
            "Task updated: " + task.getTitle(), null, null, currentUser, task.getProject());
        var dto = toDto(task);
        wsService.broadcastTaskEvent(task.getProject().getId(), "TASK_UPDATED", dto, currentUser.getName());
        return dto;
    }

    @Transactional
    public Dtos.TaskResponse updateTaskStatus(Long id, Dtos.TaskStatusUpdateRequest req, User currentUser) {
        var task = taskRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task", id));
        var newStatus = req.getStatus();

        if (newStatus == Task.Status.IN_PROGRESS || newStatus == Task.Status.DONE) {
            List<TaskDependency> deps = depRepo.findByTaskId(id);
            for (TaskDependency dep : deps) {
                if (dep.getDependsOnTask().getStatus() != Task.Status.DONE) {
                    throw new BadRequestException(
                        "Task '" + task.getTitle() + "' is blocked by '" +
                        dep.getDependsOnTask().getTitle() + "' which is not yet DONE");
                }
            }
        }

        String oldStatus = task.getStatus().name();
        task.setStatus(newStatus);
        if (req.getPosition() != null) task.setPosition(req.getPosition());
        task = taskRepo.save(task);

        logService.log(ActivityLog.ActionType.TASK_STATUS_CHANGED, "Task", task.getId(),
            "Status changed for: " + task.getTitle(), oldStatus, newStatus.name(),
            currentUser, task.getProject());
        var dto = toDto(task);
        wsService.broadcastTaskEvent(task.getProject().getId(), "TASK_STATUS_CHANGED", dto, currentUser.getName());
        return dto;
    }

    @Transactional
    public void deleteTask(Long id, User currentUser) {
        var task = taskRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task", id));
        var project = task.getProject();
        wsService.broadcastTaskEvent(project.getId(), "TASK_DELETED",
            Map.of("id", id, "projectId", project.getId()), currentUser.getName());
        taskRepo.delete(task);
        logService.log(ActivityLog.ActionType.TASK_DELETED, "Task", id,
            "Task deleted: " + task.getTitle(), null, null, currentUser, project);
    }

    @Transactional
    public Dtos.DependencySummary addDependency(Dtos.DependencyRequest req, User currentUser) {
        if (req.getTaskId().equals(req.getDependsOnTaskId()))
            throw new BadRequestException("Task cannot depend on itself");
        if (depRepo.existsByTaskIdAndDependsOnTaskId(req.getTaskId(), req.getDependsOnTaskId()))
            throw new BadRequestException("Dependency already exists");
        if (wouldCreateCycle(req.getTaskId(), req.getDependsOnTaskId()))
            throw new BadRequestException("Adding this dependency would create a circular dependency");

        var task = taskRepo.findById(req.getTaskId())
            .orElseThrow(() -> new ResourceNotFoundException("Task", req.getTaskId()));
        var dependsOn = taskRepo.findById(req.getDependsOnTaskId())
            .orElseThrow(() -> new ResourceNotFoundException("Task", req.getDependsOnTaskId()));

        var dep = TaskDependency.builder().task(task).dependsOnTask(dependsOn)
            .type(req.getType() != null ? req.getType() : TaskDependency.DependencyType.FINISH_TO_START)
            .build();
        dep = depRepo.save(dep);

        logService.log(ActivityLog.ActionType.DEPENDENCY_ADDED, "Task", task.getId(),
            "Dependency added: " + task.getTitle() + " depends on " + dependsOn.getTitle(),
            null, null, currentUser, task.getProject());

        var dto = new Dtos.DependencySummary();
        dto.setId(dep.getId()); dto.setTaskId(task.getId()); dto.setTaskTitle(task.getTitle());
        dto.setDependsOnTaskId(dependsOn.getId()); dto.setDependsOnTaskTitle(dependsOn.getTitle());
        dto.setDependsOnTaskStatus(dependsOn.getStatus().name()); dto.setType(dep.getType().name());
        return dto;
    }

    @Transactional
    public void removeDependency(Long taskId, Long dependsOnTaskId, User currentUser) {
        if (!depRepo.existsByTaskIdAndDependsOnTaskId(taskId, dependsOnTaskId))
            throw new ResourceNotFoundException("Dependency not found");
        depRepo.deleteByTaskIdAndDependsOnTaskId(taskId, dependsOnTaskId);
        var task = taskRepo.findById(taskId).orElseThrow();
        logService.log(ActivityLog.ActionType.DEPENDENCY_REMOVED, "Task", taskId,
            "Dependency removed", null, null, currentUser, task.getProject());
    }

    private boolean wouldCreateCycle(Long taskId, Long dependsOnId) {
        Set<Long> visited = new HashSet<>();
        Queue<Long> queue = new LinkedList<>();
        queue.add(dependsOnId);
        while (!queue.isEmpty()) {
            Long current = queue.poll();
            if (current.equals(taskId)) return true;
            if (!visited.add(current)) continue;
            depRepo.findByTaskId(current).forEach(d -> queue.add(d.getDependsOnTask().getId()));
        }
        return false;
    }

    public Dtos.TaskResponse toDto(Task t) {
        var dto = new Dtos.TaskResponse();
        dto.setId(t.getId()); dto.setTitle(t.getTitle()); dto.setDescription(t.getDescription());
        dto.setStatus(t.getStatus().name()); dto.setPriority(t.getPriority().name());
        dto.setDueDate(t.getDueDate()); dto.setPosition(t.getPosition());
        dto.setProjectId(t.getProject().getId()); dto.setProjectName(t.getProject().getName());
        dto.setCreatedAt(t.getCreatedAt()); dto.setUpdatedAt(t.getUpdatedAt());
        if (t.getAssignedUser() != null) {
            var u = new Dtos.UserSummary();
            u.setId(t.getAssignedUser().getId()); u.setName(t.getAssignedUser().getName());
            u.setEmail(t.getAssignedUser().getEmail()); u.setRole(t.getAssignedUser().getRole().name());
            dto.setAssignedUser(u);
        }
        if (t.getCreatedBy() != null) {
            var u = new Dtos.UserSummary();
            u.setId(t.getCreatedBy().getId()); u.setName(t.getCreatedBy().getName());
            u.setEmail(t.getCreatedBy().getEmail()); dto.setCreatedBy(u);
        }
        List<Dtos.DependencySummary> deps = depRepo.findByTaskId(t.getId()).stream().map(d -> {
            var ds = new Dtos.DependencySummary();
            ds.setId(d.getId()); ds.setTaskId(t.getId()); ds.setTaskTitle(t.getTitle());
            ds.setDependsOnTaskId(d.getDependsOnTask().getId());
            ds.setDependsOnTaskTitle(d.getDependsOnTask().getTitle());
            ds.setDependsOnTaskStatus(d.getDependsOnTask().getStatus().name());
            ds.setType(d.getType().name()); return ds;
        }).collect(Collectors.toList());
        dto.setDependencies(deps);
        dto.setBlocked(deps.stream().anyMatch(d -> !"DONE".equals(d.getDependsOnTaskStatus())));
        return dto;
    }
}
