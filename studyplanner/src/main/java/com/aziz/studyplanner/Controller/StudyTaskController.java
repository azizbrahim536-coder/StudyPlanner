package com.aziz.studyplanner.Controller;

import com.aziz.studyplanner.Entity.Priority;
import com.aziz.studyplanner.Entity.StudyTask;
import com.aziz.studyplanner.Entity.TaskStatus;
import com.aziz.studyplanner.Service.StudyTaskService;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tasks")
@CrossOrigin(origins = "http://localhost:4201")
public class StudyTaskController {

    private final StudyTaskService studyTaskService;

    public StudyTaskController(
            StudyTaskService studyTaskService
    ) {
        this.studyTaskService = studyTaskService;
    }

    @GetMapping
    public List<StudyTask> getAllTasks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) Priority priority
    ) {
        return studyTaskService.getAllTasks(
                search,
                subject,
                status,
                priority
        );
    }

    @GetMapping("/{id}")
    public StudyTask getTaskById(
            @PathVariable Long id
    ) {
        return studyTaskService.getTaskById(id);
    }

    @GetMapping("/statistics")
    public Map<String, Long> getStatistics() {
        return studyTaskService.getStatistics();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StudyTask createTask(
            @Valid @RequestBody StudyTask task
    ) {
        return studyTaskService.createTask(task);
    }

    @PutMapping("/{id}")
    public StudyTask updateTask(
            @PathVariable Long id,
            @Valid @RequestBody StudyTask task
    ) {
        return studyTaskService.updateTask(id, task);
    }

    @PatchMapping("/{id}/status")
    public StudyTask updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request
    ) {
        String statusValue = request.get("status");

        if (statusValue == null || statusValue.isBlank()) {
            throw new IllegalArgumentException(
                    "Le statut est obligatoire"
            );
        }

        TaskStatus status;

        try {
            status = TaskStatus.valueOf(
                    statusValue.trim().toUpperCase()
            );
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Statut invalide"
            );
        }

        return studyTaskService.updateStatus(id, status);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTask(
            @PathVariable Long id
    ) {
        studyTaskService.deleteTask(id);
    }
}