import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { StudyTask } from '../entity/StudyTask';

export type StudyDifficulty =
  | 'EASY'
  | 'MEDIUM'
  | 'HARD';

export interface GeneratePlanRequest {
  subject: string;
  examDate: string;
  chapters: string[];
  availableHoursPerDay: number;
  preferredStartTime: string;
  difficulty: StudyDifficulty;
}

export interface GeneratePlanResponse {
  subject?: string;
  examDate?: string;
  taskCount?: number;
  tasks: StudyTask[];
}

@Injectable({
  providedIn: 'root'
})
export class AiPlannerService {

  private readonly apiUrl =
    'http://localhost:5001/api/ai';

  constructor(private http: HttpClient) {}

  generatePlan(
    data: GeneratePlanRequest
  ): Observable<GeneratePlanResponse> {
    return this.http.post<GeneratePlanResponse>(
      `${this.apiUrl}/generate-study-plan`,
      data
    );
  }
}
