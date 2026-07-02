import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  StudyTask,
  TaskFilters,
  TaskStatistics,
  TaskStatus
} from '../entity/StudyTask';

@Injectable({
  providedIn: 'root'
})
export class StudyTaskService {

  private readonly apiUrl =
    'http://localhost:8081/api/tasks';

  constructor(private http: HttpClient) {}

  getTasks(filters: TaskFilters = {}): Observable<StudyTask[]> {
    let params = new HttpParams();

    if (filters.search?.trim()) {
      params = params.set(
        'search',
        filters.search.trim()
      );
    }

    if (filters.subject?.trim()) {
      params = params.set(
        'subject',
        filters.subject.trim()
      );
    }

    if (filters.status) {
      params = params.set(
        'status',
        filters.status
      );
    }

    if (filters.priority) {
      params = params.set(
        'priority',
        filters.priority
      );
    }

    return this.http.get<StudyTask[]>(
      this.apiUrl,
      { params }
    );
  }

  getTaskById(id: number): Observable<StudyTask> {
    return this.http.get<StudyTask>(
      `${this.apiUrl}/${id}`
    );
  }

  createTask(task: StudyTask): Observable<StudyTask> {
    return this.http.post<StudyTask>(
      this.apiUrl,
      task
    );
  }

  updateTask(
    id: number,
    task: StudyTask
  ): Observable<StudyTask> {
    return this.http.put<StudyTask>(
      `${this.apiUrl}/${id}`,
      task
    );
  }

  updateStatus(
    id: number,
    status: TaskStatus
  ): Observable<StudyTask> {
    return this.http.patch<StudyTask>(
      `${this.apiUrl}/${id}/status`,
      { status }
    );
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }

  getStatistics(): Observable<TaskStatistics> {
    return this.http.get<TaskStatistics>(
      `${this.apiUrl}/statistics`
    );
  }

  createTasks(tasks: StudyTask[]): Observable<StudyTask[]> {
  return this.http.post<StudyTask[]>(
    `${this.apiUrl}/batch`,
    tasks
  );
}
}
