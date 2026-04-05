import {Component} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {HttpErrorResponse} from "@angular/common/http";
import {AuthService} from "../../../core/services/auth.service";
import {ForgotPasswordRequest} from "../../../core/models/user.model";
import {ToastService} from "../../../core/services/toast.service";

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['../login/login.component.scss']
})
export class ForgotPasswordComponent {

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  isLoading = false;
  message = '';
  error = '';

  constructor(
      private fb: FormBuilder,
      private authService: AuthService,
      private router: Router,
      private toastService: ToastService
  ) {
  }

  onSubmit() {
    if (this.forgotForm.invalid) return;

    this.isLoading = true;
    this.error = '';
    this.message = '';
    const payload: ForgotPasswordRequest = {
      email: this.forgotForm.value.email as string,
    }
    this.authService.forgotPassword(payload).subscribe({
      next: () => {
        this.message = 'If that email is registered, a reset link has been sent.';
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.error = err.error?.message || err?.message ||'Something went wrong';
        this.toastService.show(this.error, 'error');
        this.isLoading = false;
      }
    });
  }
}
