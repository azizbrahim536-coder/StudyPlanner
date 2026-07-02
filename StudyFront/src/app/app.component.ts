import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';

import {
  AiPlannerService,
  GeneratePlanRequest,
  StudyDifficulty
} from './service/ai-planner.service';

import {
  Priority,
  StudyTask,
  TaskStatistics,
  TaskStatus
} from './entity/StudyTask';

import {
  StudyTaskService
} from './service/study-task.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {



  tasks: StudyTask[] = [];

  statistics: TaskStatistics = {
    total: 0,
    todo: 0,
    inProgress: 0,
    completed: 0
  };

aiPlanForm: FormGroup;
generatedTasks: StudyTask[] = [];

aiGenerating = false;
aiSaving = false;

aiErrorMessage = '';
aiSuccessMessage = '';

  taskForm: FormGroup;

  searchControl = new FormControl('');
  subjectControl = new FormControl('');
  statusControl = new FormControl('');
  priorityControl = new FormControl('');

  editingId: number | null = null;

  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

constructor(
  private studyTaskService: StudyTaskService,
  private aiPlannerService: AiPlannerService,
  private formBuilder: FormBuilder
) {
  this.taskForm = this.formBuilder.group({
    title: ['', Validators.required],
    description: [''],
    subject: ['', Validators.required],
    studyDate: [this.getToday(), Validators.required],
    startTime: ['18:00', Validators.required],
    durationMinutes: [
      60,
      [
        Validators.required,
        Validators.min(15),
        Validators.max(600)
      ]
    ],
    priority: ['MEDIUM', Validators.required],
    status: ['TODO', Validators.required]
  });

  this.aiPlanForm = this.formBuilder.group({
    subject: [
      '',
      Validators.required
    ],

    examDate: [
      this.getTomorrow(),
      Validators.required
    ],

    chapters: [
      '',
      Validators.required
    ],

    availableHoursPerDay: [
      2,
      [
        Validators.required,
        Validators.min(0.5),
        Validators.max(8)
      ]
    ],

    preferredStartTime: [
      '18:00',
      Validators.required
    ],

    difficulty: [
      'MEDIUM',
      Validators.required
    ]
  });
}

  ngOnInit(): void {
    this.loadTasks();
    this.loadStatistics();
  }

  loadTasks(): void {
    this.loading = true;
    this.errorMessage = '';

    this.studyTaskService.getTasks({
      search: this.searchControl.value ?? '',
      subject: this.subjectControl.value ?? '',
      status: (
        this.statusControl.value ?? ''
      ) as TaskStatus | '',
      priority: (
        this.priorityControl.value ?? ''
      ) as Priority | ''
    }).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.loading = false;
      },

      error: (error) => {
        console.error(error);

        this.errorMessage =
          'Impossible de charger les tâches. Vérifiez que le backend fonctionne.';

        this.loading = false;
      }
    });
  }

  loadStatistics(): void {
    this.studyTaskService.getStatistics().subscribe({
      next: (statistics) => {
        this.statistics = statistics;
      },

      error: (error) => {
        console.error(
          'Erreur statistiques :',
          error
        );
      }
    });
  }

  saveTask(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const formValue = this.taskForm.getRawValue();

    let startTime = String(
      formValue.startTime
    );

    if (startTime.length === 5) {
      startTime += ':00';
    }

    const task: StudyTask = {
      title: String(formValue.title).trim(),

      description: String(
        formValue.description ?? ''
      ).trim(),

      subject: String(
        formValue.subject
      ).trim(),

      studyDate: formValue.studyDate,

      startTime,

      durationMinutes: Number(
        formValue.durationMinutes
      ),

      priority: formValue.priority as Priority,

      status: formValue.status as TaskStatus
    };

    this.saving = true;

    const request = this.editingId === null
      ? this.studyTaskService.createTask(task)
      : this.studyTaskService.updateTask(
          this.editingId,
          task
        );

    request.subscribe({
      next: () => {
        this.successMessage =
          this.editingId === null
            ? 'La tâche a été ajoutée avec succès.'
            : 'La tâche a été modifiée avec succès.';

        this.resetForm();
        this.loadTasks();
        this.loadStatistics();

        this.saving = false;
      },

      error: (error) => {
        console.error(error);

        this.errorMessage =
          'Une erreur est survenue pendant l’enregistrement.';

        this.saving = false;
      }
    });
  }

  editTask(task: StudyTask): void {
    if (task.id === undefined) {
      return;
    }

    this.editingId = task.id;
    this.successMessage = '';
    this.errorMessage = '';

    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      subject: task.subject,
      studyDate: task.studyDate,
      startTime: task.startTime.substring(0, 5),
      durationMinutes: task.durationMinutes,
      priority: task.priority,
      status: task.status
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  deleteTask(task: StudyTask): void {
    if (task.id === undefined) {
      return;
    }

    const confirmed = window.confirm(
      `Voulez-vous supprimer la tâche "${task.title}" ?`
    );

    if (!confirmed) {
      return;
    }

    this.studyTaskService.deleteTask(
      task.id
    ).subscribe({
      next: () => {
        if (this.editingId === task.id) {
          this.resetForm();
        }

        this.successMessage =
          'La tâche a été supprimée.';

        this.loadTasks();
        this.loadStatistics();
      },

      error: (error) => {
        console.error(error);

        this.errorMessage =
          'Impossible de supprimer cette tâche.';
      }
    });
  }

  changeTaskStatus(
    task: StudyTask,
    status: TaskStatus
  ): void {
    if (
      task.id === undefined ||
      task.status === status
    ) {
      return;
    }

    this.studyTaskService.updateStatus(
      task.id,
      status
    ).subscribe({
      next: () => {
        this.loadTasks();
        this.loadStatistics();
      },

      error: (error) => {
        console.error(error);

        this.errorMessage =
          'Impossible de modifier le statut.';
      }
    });
  }

  resetForm(): void {
    this.editingId = null;

    this.taskForm.reset({
      title: '',
      description: '',
      subject: '',
      studyDate: this.getToday(),
      startTime: '18:00',
      durationMinutes: 60,
      priority: 'MEDIUM',
      status: 'TODO'
    });
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.subjectControl.setValue('');
    this.statusControl.setValue('');
    this.priorityControl.setValue('');

    this.loadTasks();
  }

  getPriorityLabel(
    priority: Priority
  ): string {
    const labels: Record<Priority, string> = {
      LOW: 'Faible',
      MEDIUM: 'Moyenne',
      HIGH: 'Élevée'
    };

    return labels[priority];
  }

  getStatusLabel(
    status: TaskStatus
  ): string {
    const labels: Record<TaskStatus, string> = {
      TODO: 'À faire',
      IN_PROGRESS: 'En cours',
      COMPLETED: 'Terminée'
    };

    return labels[status];
  }

  isOverdue(task: StudyTask): boolean {
    return (
      task.status !== 'COMPLETED' &&
      task.studyDate < this.getToday()
    );
  }

  trackTask(
    index: number,
    task: StudyTask
  ): number | undefined {
    return task.id;
  }

  private getToday(): string {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(
      today.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      today.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  generateStudyPlan(): void {
  this.aiErrorMessage = '';
  this.aiSuccessMessage = '';

  if (this.aiPlanForm.invalid) {
    this.aiPlanForm.markAllAsTouched();
    return;
  }

  const value = this.aiPlanForm.getRawValue();

  const chapters = String(value.chapters)
    .split(/[\n,;]+/)
    .map((chapter: string) => chapter.trim())
    .filter((chapter: string) => chapter.length > 0);

  if (chapters.length === 0) {
    this.aiErrorMessage =
      'Ajoutez au moins un chapitre.';
    return;
  }

  const request: GeneratePlanRequest = {
    subject: String(value.subject).trim(),

    examDate: value.examDate,

    chapters,

    availableHoursPerDay: Number(
      value.availableHoursPerDay
    ),

    preferredStartTime:
      value.preferredStartTime,

    difficulty:
      value.difficulty as StudyDifficulty
  };

  this.aiGenerating = true;
  this.generatedTasks = [];

  this.aiPlannerService
    .generatePlan(request)
    .subscribe({
      next: (response) => {
        this.generatedTasks = response.tasks.map(
          task => ({
            ...task,

            startTime:
              task.startTime?.substring(0, 5)
              || '18:00',

            status: 'TODO'
          })
        );

        this.aiSuccessMessage =
          `${this.generatedTasks.length} séances générées.`;

        this.aiGenerating = false;
      },

      error: (error) => {
        console.error('Erreur IA:', error);

        this.aiErrorMessage =
          error?.error?.message ||
          'Impossible de générer le planning.';

        this.aiGenerating = false;
      }
    });
}
private normalizeTime(time: string): string {
  if (!time) {
    return '18:00:00';
  }

  return time.length === 5
    ? `${time}:00`
    : time;
}

private getTomorrow(): string {
  const tomorrow = new Date();

  tomorrow.setDate(
    tomorrow.getDate() + 1
  );

  const year = tomorrow.getFullYear();

  const month = String(
    tomorrow.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    tomorrow.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

removeGeneratedTask(index: number): void {
  this.generatedTasks.splice(index, 1);

  // Actualiser la référence du tableau pour Angular
  this.generatedTasks = [...this.generatedTasks];

  if (this.generatedTasks.length === 0) {
    this.aiSuccessMessage = '';
  }
}

clearGeneratedPlan(): void {
  this.generatedTasks = [];
  this.aiErrorMessage = '';
  this.aiSuccessMessage = '';
}

saveGeneratedPlan(): void {
  this.aiErrorMessage = '';
  this.aiSuccessMessage = '';

  if (this.generatedTasks.length === 0) {
    this.aiErrorMessage =
      'Le planning ne contient aucune tâche.';
    return;
  }

  const containsInvalidTask = this.generatedTasks.some(
    task =>
      !task.title?.trim() ||
      !task.subject?.trim() ||
      !task.studyDate ||
      !task.startTime ||
      Number(task.durationMinutes) < 15
  );

  if (containsInvalidTask) {
    this.aiErrorMessage =
      'Certaines séances contiennent des informations invalides.';
    return;
  }

  const tasksToSave: StudyTask[] =
    this.generatedTasks.map(task => ({
      title: task.title.trim(),

      description:
        task.description?.trim() || '',

      subject: task.subject.trim(),

      studyDate: task.studyDate,

      startTime: this.normalizeTime(
        task.startTime
      ),

      durationMinutes: Number(
        task.durationMinutes
      ),

      priority: task.priority,

      status: 'TODO'
    }));

  this.aiSaving = true;

  this.studyTaskService
    .createTasks(tasksToSave)
    .subscribe({
      next: savedTasks => {
        this.aiSuccessMessage =
          `${savedTasks.length} séances enregistrées avec succès.`;

        this.generatedTasks = [];
        this.aiSaving = false;

        this.loadTasks();
        this.loadStatistics();
      },

      error: error => {
        console.error(
          'Erreur pendant l’enregistrement :',
          error
        );

        this.aiErrorMessage =
          error?.error?.message ||
          'Impossible d’enregistrer le planning.';

        this.aiSaving = false;
      }
    });
}


}
