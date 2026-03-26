package com.swms.repository;
import com.swms.model.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    Page<ActivityLog> findByProjectIdOrderByCreatedAtDesc(Long projectId, Pageable pageable);
    List<ActivityLog> findTop50ByProjectIdOrderByCreatedAtDesc(Long projectId);
    List<ActivityLog> findTop20ByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("select l from ActivityLog l left join fetch l.user where l.action in :actions order by l.createdAt desc")
    List<ActivityLog> findRecentAuthLogs(@Param("actions") List<ActivityLog.ActionType> actions, Pageable pageable);
}
