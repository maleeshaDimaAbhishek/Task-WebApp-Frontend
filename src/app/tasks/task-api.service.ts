import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TaskResponseDTO {
  id: number;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  categoryName: string;
  userName: string;
}

export interface CategoryDTO {
  id: number;
  name: string;
}

export interface TaskRequestDTO {
  title: string;
  description?: string;
  status: string;
  categoryId?: number;
  category?: {
    id: number;
  };
}

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private readonly API_URL = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  getAllTasks(): Observable<TaskResponseDTO[]> {
    return this.http.get<TaskResponseDTO[]>(`${this.API_URL}/api/task`);
  }

  createTask(payload: TaskRequestDTO): Observable<TaskResponseDTO> {
    return this.http.post<TaskResponseDTO>(`${this.API_URL}/api/task`, payload);
  }

  updateTask(id: number, payload: TaskRequestDTO): Observable<TaskResponseDTO> {
    return this.http.put<TaskResponseDTO>(`${this.API_URL}/api/task/${id}`, payload);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/api/task/${id}`);
  }

  getAllCategories(): Observable<CategoryDTO[]> {
    return this.http.get<CategoryDTO[]>(`${this.API_URL}/api/category`);
  }
}
