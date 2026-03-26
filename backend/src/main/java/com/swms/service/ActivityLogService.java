package com.swms.service;

import com.swms.dto.Dtos.*;
import com.swms.model.ActivityLog;
import com.swms.model.Project;
import com.swms.model.User;
import com.swms.repository.ActivityLogRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ActivityLogService {
    @Autowired private ActivityLogRepository activityLogRepository;

    @Transactional(readOnly = true)
    public List<ActivityLogResponse> getProjectLogs(Long projectId) {
        return activityLogRepository
            .findTop50ByProjectIdOrderByCreatedAtDesc(projectId)
            .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ActivityLogResponse> getRecentProjectLogs(Long projectId) {
        return activityLogRepository.findTop50ByProjectIdOrderByCreatedAtDesc(projectId)
            .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ActivityLogResponse> getRecentAuthLogs() {
        var authActions = Arrays.asList(
            ActivityLog.ActionType.USER_REGISTERED,
            ActivityLog.ActionType.USER_LOGGED_IN
        );
        return activityLogRepository.findRecentAuthLogs(authActions, PageRequest.of(0, 200))
            .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // FIX #2: Changed from default @Transactional (REQUIRED) to REQUIRES_NEW
    // so log entries are never rolled back if the caller's transaction fails.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(ActivityLog.ActionType action,
                    String entityType,
                    Long entityId,
                    String details,
                    String oldValue,
                    String newValue,
                    User user,
                    Project project) {
        ActivityLog log = ActivityLog.builder()
            .action(action)
            .entityType(entityType)
            .entityId(entityId)
            .details(details)
            .oldValue(oldValue)
            .newValue(newValue)
            .user(user)
            .project(project)
            .build();
        activityLogRepository.save(log);
    }

    private ActivityLogResponse toResponse(ActivityLog log) {
        ActivityLogResponse res = new ActivityLogResponse();
        res.setId(log.getId()); res.setAction(log.getAction().name());
        res.setEntityType(log.getEntityType()); res.setEntityId(log.getEntityId());
        res.setDetails(log.getDetails()); res.setOldValue(log.getOldValue());
        res.setNewValue(log.getNewValue()); res.setCreatedAt(log.getCreatedAt());
        if (log.getUser() != null) {
            UserSummary us = new UserSummary();
            us.setId(log.getUser().getId()); us.setName(log.getUser().getName());
            us.setEmail(log.getUser().getEmail()); us.setRole(log.getUser().getRole().name());
            res.setUser(us);
        }
        return res;
    }
}
