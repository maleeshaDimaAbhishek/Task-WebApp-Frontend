import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { catchError, finalize, Observable, of } from 'rxjs';
import { TaskApiService, TaskResponseDTO } from '../tasks/task-api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  isLoggedIn$: Observable<boolean>;
  isLoading = false;
  tasksLoading = false;
  categoriesLoading = false;
  errorMessage = '';
  categoryErrorMessage = '';
  totalTasks = 0;
  inProgressTasks = 0;
  completedTasks = 0;
  totalCategories = 0;
  recentTasks: TaskResponseDTO[] = [];

  constructor(
    private authService: AuthService,
    private taskApiService: TaskApiService
  ) {
    this.isLoggedIn$ = this.authService.isLoggedIn();
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedInSnapshot()) {
      this.isLoading = false;
      return;
    }

    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.tasksLoading = true;
    this.categoriesLoading = true;
    this.errorMessage = '';
    this.categoryErrorMessage = '';

    this.taskApiService
      .getAllTasks()
      .pipe(finalize(() => {
        this.tasksLoading = false;
        this.updateOverallLoading();
      }))
      .subscribe({
        next: (tasks) => {
          this.totalTasks = tasks.length;
          this.inProgressTasks = tasks.filter((task) => this.isInProgress(task.status)).length;
          this.completedTasks = tasks.filter((task) => this.isCompleted(task.status)).length;
          this.recentTasks = [...tasks]
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            .slice(0, 5);
        },
        error: (err) => {
          this.errorMessage =
            err?.status === 0
              ? 'Cannot reach backend service. Please check your server.'
              : 'Unable to load task data. Please try again.';
        },
      });

    this.taskApiService
      .getAllCategories()
      .pipe(
        catchError((err) => {
          this.categoryErrorMessage =
            err?.status === 0
              ? 'Cannot reach backend service for categories.'
              : 'Unable to load category data.';
          return of([]);
        }),
        finalize(() => {
          this.categoriesLoading = false;
          this.updateOverallLoading();
        })
      )
      .subscribe((categories) => {
        this.totalCategories = categories.length;
      });
  }

  private updateOverallLoading(): void {
    this.isLoading = this.tasksLoading || this.categoriesLoading;
  }

  private isCompleted(status: string): boolean {
    const normalized = (status || '').toLowerCase();
    return normalized.includes('done') || normalized.includes('complete');
  }

  private isInProgress(status: string): boolean {
    const normalized = (status || '').toLowerCase();
    return normalized.includes('progress') || normalized.includes('doing');
  }
}
