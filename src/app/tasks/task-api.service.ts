import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';

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
  id?: number;
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
  private readonly tasksCache$ = new BehaviorSubject<TaskResponseDTO[] | null>(null);

  constructor(private http: HttpClient) {}

  getAllTasks(): Observable<TaskResponseDTO[]> {
    return this.http.get<TaskResponseDTO[]>(`${this.API_URL}/api/task`).pipe(
      tap((tasks) => this.tasksCache$.next(tasks))
    );
  }

  getAllTasksForAdmin(): Observable<TaskResponseDTO[]> {
    return this.http.get<TaskResponseDTO[]>(`${this.API_URL}/api/task/admin/all`);
  }

  getCachedTasks(): TaskResponseDTO[] {
    return this.tasksCache$.getValue() ?? [];
  }

  createTask(payload: TaskRequestDTO): Observable<TaskResponseDTO> {
    return this.http.post<TaskResponseDTO>(`${this.API_URL}/api/task`, payload);
  }

  updateTask(id: number, payload: TaskRequestDTO): Observable<TaskResponseDTO> {
    const url = `${this.API_URL}/api/task/${id}`;
    const legacyPayload = this.toLegacyPayload(payload);

    return this.http.put<TaskResponseDTO>(url, payload).pipe(
      catchError((err) => {
        // Some backends expose update with PATCH instead of PUT.
        if (err?.status === 404 || err?.status === 405) {
          return this.http.patch<TaskResponseDTO>(url, payload);
        }

        // Some backends only accept nested category object on update.
        if (err?.status === 400 || err?.status === 415 || err?.status === 500) {
          return this.http.put<TaskResponseDTO>(url, legacyPayload).pipe(
            catchError((legacyErr) => {
              if (legacyErr?.status === 404 || legacyErr?.status === 405) {
                return this.http.patch<TaskResponseDTO>(url, legacyPayload);
              }
              return throwError(() => legacyErr);
            })
          );
        }

        return throwError(() => err);
      })
    );
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/api/task/${id}`);
  }

  getAllCategories(): Observable<CategoryDTO[]> {
    return this.http.get<CategoryDTO[]>(`${this.API_URL}/api/category`);
  }

  private toLegacyPayload(payload: TaskRequestDTO): TaskRequestDTO {
    const { categoryId, category, ...rest } = payload;
    if (category?.id) {
      return { ...rest, id: payload.id, status: payload.status, category };
    }
    if (!categoryId) {
      return { ...rest, id: payload.id, status: payload.status };
    }
    return {
      ...rest,
      id: payload.id,
      status: payload.status,
      category: { id: categoryId },
    };
  }
}
