import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { finalize, timeout } from 'rxjs';
import { getAuthErrorMessage } from '../../shared/auth-error.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  private hardStopTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });

    if (this.route.snapshot.queryParamMap.get('registered') === '1') {
      this.successMessage = 'Account created successfully. Please sign in.';
    }
    if (this.route.snapshot.queryParamMap.get('session') === 'expired') {
      this.errorMessage = 'Your session expired or access was denied. Please sign in again.';
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.setHardStopTimer();
    this.cdr.detectChanges();

    this.authService
      .login(this.loginForm.value)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isLoading = false;
          this.clearHardStopTimer();
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.authService.getCurrentUser().subscribe({
            next: (currentUser) => {
              const isAdmin = (currentUser?.status || '').toUpperCase() === 'ADMIN';
              this.errorMessage = '';
              this.cdr.detectChanges();
              void this.router.navigate([isAdmin ? '/dashboard' : '/tasks']);
            },
            error: (err) => {
              this.errorMessage = getAuthErrorMessage(err, 'login');
              this.cdr.detectChanges();
            },
          });
        },
        error: (err) => {
          this.errorMessage = getAuthErrorMessage(err, 'login');
          this.cdr.detectChanges();
        },
      });
  }

  private setHardStopTimer(): void {
    this.clearHardStopTimer();
    this.hardStopTimer = setTimeout(() => {
      if (!this.isLoading) return;
      this.isLoading = false;
      this.errorMessage = 'Sign in is taking too long. Please try again.';
      this.cdr.detectChanges();
    }, 20000);
  }

  private clearHardStopTimer(): void {
    if (!this.hardStopTimer) return;
    clearTimeout(this.hardStopTimer);
    this.hardStopTimer = null;
  }
}
