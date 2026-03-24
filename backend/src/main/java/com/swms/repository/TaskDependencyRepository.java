package com.swms.repository;
import com.swms.model.TaskDependency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface TaskDependencyRepository extends JpaRepository<TaskDependency, Long> {
    List<TaskDependency> findByTaskId(Long taskId);
    List<TaskDependency> findByDependsOnTaskId(Long taskId);
    boolean existsByTaskIdAndDependsOnTaskId(Long taskId, Long dependsOnTaskId);
    void deleteByTaskIdAndDependsOnTaskId(Long taskId, Long dependsOnTaskId);
    @Query("SELECT td FROM TaskDependency td WHERE td.task.project.id = :projectId")
    List<TaskDependency> findByProjectId(@Param("projectId") Long projectId);
}
