import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Observable, forkJoin } from 'rxjs';
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
  isLoading = true;
  errorMessage = '';
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

    forkJoin({
      tasks: this.taskApiService.getAllTasks(),
      categories: this.taskApiService.getAllCategories(),
    }).subscribe({
      next: ({ tasks, categories }) => {
        this.totalTasks = tasks.length;
        this.inProgressTasks = tasks.filter((task) => this.isInProgress(task.status)).length;
        this.completedTasks = tasks.filter((task) => this.isCompleted(task.status)).length;
        this.totalCategories = categories.length;
        this.recentTasks = [...tasks]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5);
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage =
          err?.status === 0
            ? 'Cannot reach backend service. Please check your server.'
            : 'Unable to load dashboard data. Please try again.';
        this.isLoading = false;
      },
    });
  }

  private isCompleted(status: string): boolean {
    const normalized = status.toLowerCase();
    return normalized.includes('done') || normalized.includes('complete');
  }

  private isInProgress(status: string): boolean {
    const normalized = status.toLowerCase();
    return normalized.includes('progress') || normalized.includes('doing');
  }
}
