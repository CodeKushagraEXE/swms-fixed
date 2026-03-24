package com.swms.repository;
import com.swms.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectIdOrderByPositionAsc(Long projectId);
    List<Task> findByAssignedUserId(Long userId);
    long countByProjectIdAndStatus(Long projectId, Task.Status status);
    long countByProjectId(Long projectId);
    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId AND (LOWER(t.title) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(t.description) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Task> searchByProjectAndQuery(@Param("projectId") Long projectId, @Param("q") String query);
}
