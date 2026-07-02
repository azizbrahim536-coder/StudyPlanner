export type Priority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH';

export type TaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export interface StudyTask {
  id?: number;

  title: string;
  description: string;
  subject: string;

  studyDate: string;
  startTime: string;
  durationMinutes: number;

  priority: Priority;
  status: TaskStatus;

  createdAt?: string;
  updatedAt?: string;
}

export interface TaskStatistics {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
}

export interface TaskFilters {
  search?: string;
  subject?: string;
  status?: TaskStatus | '';
  priority?: Priority | '';
}
