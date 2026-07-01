package com.aziz.studyplanner.Repository;

import com.aziz.studyplanner.Entity.Priority;
import com.aziz.studyplanner.Entity.StudyTask;
import com.aziz.studyplanner.Entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudyTaskRepository
        extends JpaRepository<StudyTask, Long> {

    @Query("""
        SELECT task
        FROM StudyTask task
        WHERE (
            :search IS NULL
            OR LOWER(task.title) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(COALESCE(task.description, ''))
                LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(task.subject)
                LIKE LOWER(CONCAT('%', :search, '%'))
        )
        AND (
            :subject IS NULL
            OR LOWER(task.subject) = LOWER(:subject)
        )
        AND (
            :status IS NULL
            OR task.status = :status
        )
        AND (
            :priority IS NULL
            OR task.priority = :priority
        )
        ORDER BY task.studyDate ASC, task.startTime ASC
        """)
    List<StudyTask> searchTasks(
            @Param("search") String search,
            @Param("subject") String subject,
            @Param("status") TaskStatus status,
            @Param("priority") Priority priority
    );

    long countByStatus(TaskStatus status);
}