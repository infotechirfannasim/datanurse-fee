// src/app/features/auth/register.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h2>Create Account</h2>
          <p class="text-muted">Join us today and get started</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="firstName" class="form-label">First Name</label>
              <input
                type="text"
                class="form-control"
                id="firstName"
                formControlName="firstName"
                [class.is-invalid]="isFieldInvalid('firstName')"
                placeholder="John">
              @if (isFieldInvalid('firstName')) {
                <div class="invalid-feedback">
                  First name is required
                </div>
              }
            </div>

            <div class="col-md-6 mb-3">
              <label for="lastName" class="form-label">Last Name</label>
              <input
                type="text"
                class="form-control"
                id="lastName"
                formControlName="lastName"
                [class.is-invalid]="isFieldInvalid('lastName')"
                placeholder="Doe">
              @if (isFieldInvalid('lastName')) {
                <div class="invalid-feedback">
                  Last name is required
                </div>
              }
            </div>
          </div>

          <div class="mb-3">
            <label for="username" class="form-label">Username</label>
            <input
              type="text"
              class="form-control"
              id="username"
              formControlName="username"
              [class.is-invalid]="isFieldInvalid('username')"
              placeholder="johndoe">
            @if (isFieldInvalid('username')) {
              <div class="invalid-feedback">
                Username is required
              </div>
            }
          </div>

          <div class="mb-3">
            <label for="email" class="form-label">Email address</label>
            <input
              type="email"
              class="form-control"
              id="email"
              formControlName="email"
              [class.is-invalid]="isFieldInvalid('email')"
              placeholder="john@example.com">
            @if (isFieldInvalid('email')) {
              <div class="invalid-feedback">
                Please enter a valid email address
              </div>
            }
          </div>

          <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input
              type="password"
              class="form-control"
              id="password"
              formControlName="password"
              [class.is-invalid]="isFieldInvalid('password')"
              placeholder="Create a password">
            @if (isFieldInvalid('password')) {
              <div class="invalid-feedback">
                Password must be at least 8 characters
              </div>
            }
          </div>

          <div class="mb-3">
            <label for="confirmPassword" class="form-label">Confirm Password</label>
            <input
              type="password"
              class="form-control"
              id="confirmPassword"
              formControlName="confirmPassword"
              [class.is-invalid]="registerForm.hasError('passwordMismatch') && isFieldInvalid('confirmPassword')"
              placeholder="Confirm your password">
            @if (registerForm.hasError('passwordMismatch') && isFieldInvalid('confirmPassword')) {
              <div class="invalid-feedback">
                Passwords do not match
              </div>
            }
          </div>

          <button
            type="submit"
            class="btn btn-primary w-100 mb-3"
            [disabled]="registerForm.invalid || isLoading">
            @if (isLoading) {
              <span class="spinner-border spinner-border-sm me-2"></span>
            }
            Create Account
          </button>

          <div class="text-center">
            <span class="text-muted">Already have an account? </span>
            <a routerLink="/auth/login" class="text-decoration-none">Sign In</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .auth-card {
      background: white;
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      padding: 40px;
      width: 100%;
      max-width: 500px;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 30px;
    }
    .auth-header h2 {
      color: #333;
      font-weight: 600;
      margin-bottom: 10px;
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup;
  isLoading = false;

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password?.value !== confirmPassword?.value) {
      confirmPassword?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  isFieldInvalid(field: string): boolean {
    const formControl = this.registerForm.get(field);
    return !!formControl && formControl.invalid && (formControl.dirty || formControl.touched);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.router.navigate(['/auth/login'], {
          queryParams: { registered: 'true' }
        });
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
