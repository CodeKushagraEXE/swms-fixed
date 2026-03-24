package com.swms.service;
import com.swms.dto.Dtos;
import com.swms.exception.*;
import com.swms.model.*;
import com.swms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProjectService {
    @Autowired private ProjectRepository projectRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private TaskRepository taskRepo;
    @Autowired private ActivityLogService logService;

    @Transactional(readOnly = true)
    public List<Dtos.ProjectResponse> getAllProjects(User currentUser) {
        List<Project> projects = currentUser.getRole() == User.Role.ADMIN
            ? projectRepo.findAll()
            : projectRepo.findAllByUserId(currentUser.getId());
        return projects.stream().map(p -> toDto(p, true)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Dtos.ProjectResponse getProject(Long id, User currentUser) {
        var project = projectRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Project", id));
        checkAccess(project, currentUser);
        return toDto(project, true);
    }

    @Transactional
    public Dtos.ProjectResponse createProject(Dtos.ProjectRequest req, User currentUser) {
        var project = Project.builder()
            .name(req.getName()).description(req.getDescription())
            .owner(currentUser).build();
        if (req.getMemberIds() != null) {
            Set<User> members = new HashSet<>(userRepo.findAllById(req.getMemberIds()));
            project.setMembers(members);
        }
        project = projectRepo.save(project);
        logService.log(ActivityLog.ActionType.PROJECT_CREATED, "Project", project.getId(),
            "Project created: " + project.getName(), null, null, currentUser, project);
        return toDto(project, false);
    }

    @Transactional
    public Dtos.ProjectResponse updateProject(Long id, Dtos.ProjectRequest req, User currentUser) {
        var project = projectRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Project", id));
        checkOwnerOrAdmin(project, currentUser);
        project.setName(req.getName());
        if (req.getDescription() != null) project.setDescription(req.getDescription());
        if (req.getMemberIds() != null) {
            project.setMembers(new HashSet<>(userRepo.findAllById(req.getMemberIds())));
        }
        project = projectRepo.save(project);
        logService.log(ActivityLog.ActionType.PROJECT_UPDATED, "Project", project.getId(),
            "Project updated: " + project.getName(), null, null, currentUser, project);
        return toDto(project, false);
    }

    @Transactional
    public void deleteProject(Long id, User currentUser) {
        var project = projectRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Project", id));
        checkOwnerOrAdmin(project, currentUser);
        projectRepo.delete(project);
    }

    @Transactional
    public Dtos.ProjectResponse addMember(Long projectId, Long userId, User currentUser) {
        var project = projectRepo.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        checkOwnerOrAdmin(project, currentUser);
        var user = userRepo.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User", userId));
        project.getMembers().add(user);
        project = projectRepo.save(project);
        logService.log(ActivityLog.ActionType.PROJECT_MEMBER_ADDED, "Project", project.getId(),
            "Member added: " + user.getName(), null, null, currentUser, project);
        return toDto(project, false);
    }

    public Dtos.ProjectResponse toDto(Project p, boolean withStats) {
        var dto = new Dtos.ProjectResponse();
        dto.setId(p.getId()); dto.setName(p.getName()); dto.setDescription(p.getDescription());
        dto.setStatus(p.getStatus().name()); dto.setCreatedAt(p.getCreatedAt());
        var owner = new Dtos.UserSummary();
        owner.setId(p.getOwner().getId()); owner.setName(p.getOwner().getName());
        owner.setEmail(p.getOwner().getEmail()); owner.setRole(p.getOwner().getRole().name());
        dto.setOwner(owner);
        dto.setMembers(p.getMembers().stream().map(m -> {
            var us = new Dtos.UserSummary();
            us.setId(m.getId()); us.setName(m.getName()); us.setEmail(m.getEmail());
            us.setRole(m.getRole().name()); return us;
        }).collect(Collectors.toSet()));
        if (withStats) {
            dto.setTotalTasks(taskRepo.countByProjectId(p.getId()));
            dto.setCompletedTasks(taskRepo.countByProjectIdAndStatus(p.getId(), Task.Status.DONE));
        }
        return dto;
    }

    private void checkAccess(Project project, User user) {
        if (user.getRole() == User.Role.ADMIN) return;
        boolean isOwner = project.getOwner().getId().equals(user.getId());
        boolean isMember = project.getMembers().stream().anyMatch(m -> m.getId().equals(user.getId()));
        if (!isOwner && !isMember) throw new AccessDeniedException("No access to this project");
    }

    private void checkOwnerOrAdmin(Project project, User user) {
        if (user.getRole() == User.Role.ADMIN) return;
        if (!project.getOwner().getId().equals(user.getId()))
            throw new AccessDeniedException("Only project owner or admin can do this");
    }
}
