package com.swms.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "task_dependencies",
    uniqueConstraints = @UniqueConstraint(columnNames = {"task_id", "depends_on_task_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TaskDependency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "depends_on_task_id", nullable = false)
    private Task dependsOnTask;

    @Enumerated(EnumType.STRING)
    private DependencyType type = DependencyType.FINISH_TO_START;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum DependencyType {
        FINISH_TO_START,    // Must finish A before starting B
        FINISH_TO_FINISH,   // Must finish A before finishing B
        START_TO_START,     // Must start A before starting B
        START_TO_FINISH     // Must start A before finishing B
    }
}
