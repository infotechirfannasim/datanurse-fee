import {Component} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {AuthService} from '../../../core/services/auth.service';
import {ResetPasswordRequest} from "../../../core/models/user.model";
import {ToastService} from "../../../core/services/toast.service";

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['../login/login.component.scss']
})
export class ResetPasswordComponent {

  token: string = '';

  showPassword = false;
  showConfirmPassword = false;

  isLoading = false;
  message = '';
  error = '';

  resetForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  constructor(
      private fb: FormBuilder,
      private route: ActivatedRoute,
      private authService: AuthService,
      private router: Router,
      private toastService: ToastService
  ) {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  passwordsMismatch(): boolean {
    const {password, confirmPassword} = this.resetForm.value;
    return password !== confirmPassword;
  }

  onSubmit() {
    if (this.resetForm.invalid || this.passwordsMismatch()) return;

    this.isLoading = true;
    this.error = '';
    this.message = '';

    const payload: ResetPasswordRequest = {
      token: this.token,
      password: this.resetForm.value.password as string,
      confirmPassword: this.resetForm.value.confirmPassword as string
    };

    this.authService.resetPassword(payload).subscribe({
      next: () => {
        this.message = 'Password reset successful. Redirecting to login...';
        this.isLoading = false;

        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (err: HttpErrorResponse) => {
        this.error = err.error?.message || err?.message || 'Invalid or expired reset link';
        this.toastService.show(this.error, 'error');
        this.isLoading = false;
      }
    });
  }
}
