package com.aziz.studyplanner.Service;

import com.aziz.studyplanner.Entity.Priority;
import com.aziz.studyplanner.Entity.StudyTask;
import com.aziz.studyplanner.Entity.TaskStatus;
import com.aziz.studyplanner.Repository.StudyTaskRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class StudyTaskService {

    private final StudyTaskRepository studyTaskRepository;

    public StudyTaskService(
            StudyTaskRepository studyTaskRepository
    ) {
        this.studyTaskRepository = studyTaskRepository;
    }

    public List<StudyTask> getAllTasks(
            String search,
            String subject,
            TaskStatus status,
            Priority priority
    ) {
        return studyTaskRepository.searchTasks(
                cleanValue(search),
                cleanValue(subject),
                status,
                priority
        );
    }

    public StudyTask getTaskById(Long id) {
        return studyTaskRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Tâche introuvable avec l'identifiant : " + id
                ));
    }

    public StudyTask createTask(StudyTask task) {
        task.setId(null);

        if (task.getPriority() == null) {
            task.setPriority(Priority.MEDIUM);
        }

        if (task.getStatus() == null) {
            task.setStatus(TaskStatus.TODO);
        }

        return studyTaskRepository.save(task);
    }

    public StudyTask updateTask(
            Long id,
            StudyTask newTask
    ) {
        StudyTask existingTask = getTaskById(id);

        existingTask.setTitle(newTask.getTitle());
        existingTask.setDescription(newTask.getDescription());
        existingTask.setSubject(newTask.getSubject());
        existingTask.setStudyDate(newTask.getStudyDate());
        existingTask.setStartTime(newTask.getStartTime());
        existingTask.setDurationMinutes(
                newTask.getDurationMinutes()
        );
        existingTask.setPriority(newTask.getPriority());
        existingTask.setStatus(newTask.getStatus());

        return studyTaskRepository.save(existingTask);
    }

    public StudyTask updateStatus(
            Long id,
            TaskStatus status
    ) {
        StudyTask task = getTaskById(id);

        task.setStatus(status);

        return studyTaskRepository.save(task);
    }

    public void deleteTask(Long id) {
        StudyTask task = getTaskById(id);
        studyTaskRepository.delete(task);
    }

    public Map<String, Long> getStatistics() {
        long total = studyTaskRepository.count();
        long todo = studyTaskRepository.countByStatus(
                TaskStatus.TODO
        );
        long inProgress = studyTaskRepository.countByStatus(
                TaskStatus.IN_PROGRESS
        );
        long completed = studyTaskRepository.countByStatus(
                TaskStatus.COMPLETED
        );

        Map<String, Long> statistics = new LinkedHashMap<>();

        statistics.put("total", total);
        statistics.put("todo", todo);
        statistics.put("inProgress", inProgress);
        statistics.put("completed", completed);

        return statistics;
    }

    private String cleanValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}