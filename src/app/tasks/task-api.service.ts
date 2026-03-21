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

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private readonly API_URL = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  getAllTasks(): Observable<TaskResponseDTO[]> {
    return this.http.get<TaskResponseDTO[]>(`${this.API_URL}/api/task`);
  }

  getAllCategories(): Observable<CategoryDTO[]> {
    return this.http.get<CategoryDTO[]>(`${this.API_URL}/api/category`);
  }
}
