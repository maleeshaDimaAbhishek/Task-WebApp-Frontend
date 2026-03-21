import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, RegisterRequest } from '../auth.service';
import { finalize, timeout } from 'rxjs';
import { getAuthErrorMessage } from '../../shared/auth-error.util';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      name: [''],
      birthDate: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    });
  }

  onSubmit(): void {
    this.isLoading = false;
    this.errorMessage = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      const invalidFields = this.getInvalidFieldNames();
      this.errorMessage =
        invalidFields.length > 0
          ? `Please correct: ${invalidFields.join(', ')}.`
          : 'Please fill all required fields correctly.';
      return;
    }

    const { username, name, birthDate, email, password, confirmPassword } =
      this.registerForm.value;
    if (password !== confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    const payload: RegisterRequest = {
      username,
      birthDate,
      email,
      password,
      name: name || undefined,
      status: 'USER',
    };

    this.isLoading = true;

    this.authService
      .register(payload)
      .pipe(
        timeout(15000),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: () => this.router.navigate(['/login'], { queryParams: { registered: '1' } }),
        error: (err) => (this.errorMessage = getAuthErrorMessage(err, 'register')),
      });
  }

  private getInvalidFieldNames(): string[] {
    const labelMap: Record<string, string> = {
      username: 'Username',
      birthDate: 'Birth Date',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
    };

    return Object.keys(this.registerForm.controls)
      .filter((key) => this.registerForm.get(key)?.invalid)
      .map((key) => labelMap[key] ?? key);
  }
}
