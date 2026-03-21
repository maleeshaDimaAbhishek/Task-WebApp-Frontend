import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CategoryDTO,
  TaskApiService,
  TaskRequestDTO,
  TaskResponseDTO,
} from './task-api.service';
import { finalize, forkJoin } from 'rxjs';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css',
})
export class TasksComponent implements OnInit {
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  submitErrorMessage = '';
  tasks: TaskResponseDTO[] = [];
  categories: CategoryDTO[] = [];
  editingTaskId: number | null = null;

  taskForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private taskApiService: TaskApiService
  ) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      status: ['TODO', Validators.required],
      categoryId: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      tasks: this.taskApiService.getAllTasks(),
      categories: this.taskApiService.getAllCategories(),
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ({ tasks, categories }) => {
          this.tasks = [...tasks].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          this.categories = categories;
          if (!this.editingTaskId && categories.length > 0 && !this.taskForm.get('categoryId')?.value) {
            this.taskForm.patchValue({ categoryId: String(categories[0].id) });
          }
        },
        error: (err) => {
          this.errorMessage =
            err?.status === 0
              ? 'Cannot reach backend service. Please check your server.'
              : 'Unable to load tasks.';
        },
      });
  }

  onSubmit(): void {
    this.submitErrorMessage = '';
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      this.submitErrorMessage = 'Please fill required fields.';
      return;
    }

    const payload = this.toRequestPayload();
    this.isSubmitting = true;

    const request$ =
      this.editingTaskId === null
        ? this.taskApiService.createTask(payload)
        : this.taskApiService.updateTask(this.editingTaskId, payload);

    request$
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.resetForm();
          this.loadData();
        },
        error: (err) => {
          const backendMessage =
            (typeof err?.error === 'string' && err.error) ||
            err?.error?.message ||
            err?.error?.error;
          this.submitErrorMessage =
            err?.status === 400
              ? backendMessage || 'Invalid task data. Please check your inputs.'
              : err?.status === 0
                ? 'Cannot reach backend service. Please check your server.'
                : backendMessage || 'Unable to save task.';
        },
      });
  }

  onEdit(task: TaskResponseDTO): void {
    this.editingTaskId = task.id;
    this.submitErrorMessage = '';
    this.taskForm.patchValue({
      title: task.title,
      description: task.description || '',
      status: task.status || 'TODO',
      categoryId: this.getCategoryIdByName(task.categoryName),
    });
  }

  onDelete(task: TaskResponseDTO): void {
    if (!confirm(`Delete task "${task.title}"?`)) {
      return;
    }

    this.submitErrorMessage = '';
    this.taskApiService.deleteTask(task.id).subscribe({
      next: () => {
        if (this.editingTaskId === task.id) {
          this.resetForm();
        }
        this.loadData();
      },
      error: () => {
        this.submitErrorMessage = 'Unable to delete task.';
      },
    });
  }

  onCancelEdit(): void {
    this.resetForm();
  }

  trackByTaskId(_: number, task: TaskResponseDTO): number {
    return task.id;
  }

  getStatusClass(status: string): string {
    const normalized = status.toLowerCase();
    if (normalized.includes('done') || normalized.includes('complete')) return 'done';
    if (normalized.includes('progress') || normalized.includes('doing')) return 'progress';
    return 'todo';
  }

  private toRequestPayload(): TaskRequestDTO {
    const { title, description, status, categoryId } = this.taskForm.getRawValue();
    const trimmedDescription = (description || '').trim();
    const parsedCategoryId = categoryId ? Number(categoryId) : undefined;

    return {
      title: (title || '').trim(),
      description: trimmedDescription || undefined,
      status: status || 'TODO',
      categoryId: Number.isNaN(parsedCategoryId) ? undefined : parsedCategoryId,
      category: Number.isNaN(parsedCategoryId) || parsedCategoryId === undefined
        ? undefined
        : { id: parsedCategoryId },
    };
  }

  private getCategoryIdByName(categoryName: string): string {
    const match = this.categories.find(
      (category) => category.name.toLowerCase() === (categoryName || '').toLowerCase()
    );
    return match ? String(match.id) : '';
  }

  private resetForm(): void {
    this.editingTaskId = null;
    this.taskForm.reset({
      title: '',
      description: '',
      status: 'TODO',
      categoryId: this.categories.length > 0 ? String(this.categories[0].id) : '',
    });
    this.submitErrorMessage = '';
  }
}
