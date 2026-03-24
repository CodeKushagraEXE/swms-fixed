package com.swms.service;
import com.swms.dto.Dtos;
import com.swms.model.*;
import com.swms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {
    @Autowired private ProjectRepository projectRepo;
    @Autowired private TaskRepository taskRepo;

    @Transactional(readOnly = true)
    public Dtos.DashboardStats getStats(User currentUser) {
        List<Project> projects = currentUser.getRole() == User.Role.ADMIN
            ? projectRepo.findAll()
            : projectRepo.findAllByUserId(currentUser.getId());

        long totalTasks = 0, todo = 0, inProgress = 0, done = 0;
        var projectStats = new ArrayList<Dtos.ProjectStat>();

        for (Project p : projects) {
            long t = taskRepo.countByProjectId(p.getId());
            long c = taskRepo.countByProjectIdAndStatus(p.getId(), Task.Status.DONE);
            long ip = taskRepo.countByProjectIdAndStatus(p.getId(), Task.Status.IN_PROGRESS);
            long td = taskRepo.countByProjectIdAndStatus(p.getId(), Task.Status.TODO);
            totalTasks += t; todo += td; inProgress += ip; done += c;

            var ps = new Dtos.ProjectStat();
            ps.setProjectId(p.getId()); ps.setProjectName(p.getName());
            ps.setTotal(t); ps.setCompleted(c); ps.setInProgress(ip);
            ps.setCompletionPercent(t > 0 ? (double) c / t * 100 : 0);
            projectStats.add(ps);
        }

        var stats = new Dtos.DashboardStats();
        stats.setTotalProjects(projects.size()); stats.setTotalTasks(totalTasks);
        stats.setTodoTasks(todo); stats.setInProgressTasks(inProgress); stats.setDoneTasks(done);
        stats.setProjectStats(projectStats);
        return stats;
    }
}
