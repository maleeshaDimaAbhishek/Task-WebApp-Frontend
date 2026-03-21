import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { firstValueFrom, timeout } from 'rxjs';
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
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });

    if (this.route.snapshot.queryParamMap.get('registered') === '1') {
      this.successMessage = 'Account created successfully. Please sign in.';
    }
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.setHardStopTimer();

    try {
      await firstValueFrom(this.authService.login(this.loginForm.value).pipe(timeout(15000)));
      this.errorMessage = '';
      await this.router.navigate(['/dashboard']);
    } catch (err) {
      this.errorMessage = getAuthErrorMessage(err, 'login');
    } finally {
      this.isLoading = false;
      this.clearHardStopTimer();
    }
  }

  private setHardStopTimer(): void {
    this.clearHardStopTimer();
    this.hardStopTimer = setTimeout(() => {
      if (!this.isLoading) return;
      this.isLoading = false;
      this.errorMessage = 'Sign in is taking too long. Please try again.';
    }, 20000);
  }

  private clearHardStopTimer(): void {
    if (!this.hardStopTimer) return;
    clearTimeout(this.hardStopTimer);
    this.hardStopTimer = null;
  }
}
