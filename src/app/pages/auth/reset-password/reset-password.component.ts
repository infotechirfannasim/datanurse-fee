import {Component} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {AuthService} from '../../../core/services/auth.service';
import {ToastService} from "../../../core/services/toast.service";
import {getError, passwordMatchValidator} from "../../../utils/global.utils";
import {RegexConstants} from "../../../utils/regex-constants";
import {HttpErrorResponse} from "@angular/common/http";

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['../login/login.component.scss']
})
export class ResetPasswordComponent {
  mode: 'reset' | 'set' = 'reset';
  token: string = '';
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  message = '';
  error = '';

  resetForm = this.fb.group({
        password: ['', [Validators.required,
          Validators.minLength(8),
          Validators.maxLength(20),
          Validators.pattern(RegexConstants.PASSWORD_REGEX)]],
        confirmPassword: ['', [Validators.required]]
      },
      {
        validators: passwordMatchValidator('password', 'confirmPassword')
      }
  );

  errorMessages = {
    password: {
      required: 'Password is required',
      minlength: 'Min 8 characters',
      maxlength: 'Max 20 characters',
      pattern: 'Include upper, lower, number & special char'
    },
    confirmPassword: {required: 'Confirm password is required', mismatch: 'Passwords must be same'}
  };

  constructor(
      private fb: FormBuilder,
      private route: ActivatedRoute,
      private authService: AuthService,
      private router: Router,
      private toastService: ToastService
  ) {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    const currentUrl = this.router.url;
    this.mode = currentUrl.includes('reset-password') ? 'reset' : 'set';
    console.log(this.mode)
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

    const payload = {
      token: this.token,
      password: this.resetForm.value.password!,
      confirmPassword: this.resetForm.value.confirmPassword!
    };

    const request$ =
        this.mode === 'set'
            ? this.authService.setPassword(payload)
            : this.authService.resetPassword(payload);

    request$.subscribe({
      next: () => {
        this.message =
            this.mode === 'set'
                ? 'Password set successfully'
                : 'Password reset successful';
        this.isLoading = false;
        this.toastService.show(
            'Password reset successful! You can now login with your new password.',
            'success'
        );
        setTimeout(() => this.router.navigate(['/auth/login']), 500);
      },
      error: (err: HttpErrorResponse) => {
        this.error = err.error?.message || err.message || 'Something went wrong';
        this.isLoading = false;
        this.toastService.show(this.error, 'error');
      }
    });
  }

  getErrorMsg(controlName: string, index?: number, field?: string) {
    return getError(this.resetForm, controlName, {
      index,
      field,
      customMessages: this.errorMessages
    });
  }
}
