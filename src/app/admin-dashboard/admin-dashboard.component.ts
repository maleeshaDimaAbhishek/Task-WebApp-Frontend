import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryDTO, TaskApiService, TaskResponseDTO } from '../tasks/task-api.service';
import { catchError, finalize, of, timeout } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit {
  isLoading = false;
  tasksLoading = false;
  categoriesLoading = false;
  errorMessage = '';
  categoryErrorMessage = '';
  totalTasks = 0;
  inProgressTasks = 0;
  completedTasks = 0;
  totalCategories = 0;
  categories: CategoryDTO[] = [];
  allTasks: TaskResponseDTO[] = [];
  filteredTasks: TaskResponseDTO[] = [];
  categoryOptions: string[] = [];
  selectedCategory = 'ALL';

  constructor(private taskApiService: TaskApiService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.tasksLoading = true;
    this.categoriesLoading = true;
    this.errorMessage = '';
    this.categoryErrorMessage = '';

    this.taskApiService
      .getAllTasksForAdmin()
      .pipe(
        timeout(10000),
        catchError((err) => {
          this.errorMessage =
            err?.name === 'TimeoutError'
              ? 'Task data is taking too long to load. Please try again.'
              : err?.status === 0
                ? 'Cannot reach backend service. Please check your server.'
                : 'Unable to load task data. Please try again.';
          return of([] as TaskResponseDTO[]);
        }),
        finalize(() => {
          this.tasksLoading = false;
          this.updateOverallLoading();
        })
      )
      .subscribe({
        next: (tasks) => {
          const safeTasks = tasks ?? [];
          this.totalTasks = safeTasks.length;
          this.inProgressTasks = safeTasks.filter((task) => this.isInProgress(task.status)).length;
          this.completedTasks = safeTasks.filter((task) => this.isCompleted(task.status)).length;
          this.allTasks = [...safeTasks].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          this.updateCategoryOptions();
          this.applyCategoryFilter();
        },
      });

    this.taskApiService
      .getAllCategories()
      .pipe(
        timeout(10000),
        catchError((err) => {
          this.categoryErrorMessage =
            err?.name === 'TimeoutError'
              ? 'Category data is taking too long to load.'
              : err?.status === 0
              ? 'Cannot reach backend service for categories.'
              : 'Unable to load category data.';
          return of([] as CategoryDTO[]);
        }),
        finalize(() => {
          this.categoriesLoading = false;
          this.updateOverallLoading();
        })
      )
      .subscribe((categories) => {
        this.categories = categories;
        this.totalCategories = categories.length;
        this.updateCategoryOptions();
      });
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.applyCategoryFilter();
  }

  private updateOverallLoading(): void {
    // Categories are supplementary. Keep dashboard usable once tasks are ready.
    this.isLoading = this.tasksLoading;
  }

  private applyCategoryFilter(): void {
    if (this.selectedCategory === 'ALL') {
      this.filteredTasks = [...this.allTasks];
      return;
    }

    const selected = this.selectedCategory.toLowerCase();
    this.filteredTasks = this.allTasks.filter(
      (task) => this.normalizeCategoryName(task.categoryName).toLowerCase() === selected
    );
  }

  private updateCategoryOptions(): void {
    const namesFromCategories = this.categories.map((category) =>
      this.normalizeCategoryName(category.name)
    );
    const namesFromTasks = this.allTasks.map((task) => this.normalizeCategoryName(task.categoryName));
    this.categoryOptions = Array.from(new Set([...namesFromCategories, ...namesFromTasks]))
      .filter((name) => !!name)
      .sort((a, b) => a.localeCompare(b));

    if (
      this.selectedCategory !== 'ALL' &&
      !this.categoryOptions.some(
        (category) => category.toLowerCase() === this.selectedCategory.toLowerCase()
      )
    ) {
      this.selectedCategory = 'ALL';
    }
  }

  private normalizeCategoryName(value: string | null | undefined): string {
    const normalized = (value || '').trim();
    return normalized || 'Uncategorized';
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
