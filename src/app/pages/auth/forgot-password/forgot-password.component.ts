import {Component} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {HttpErrorResponse} from "@angular/common/http";
import {AuthService} from "../../../core/services/auth.service";
import {ForgotPasswordRequest} from "../../../core/models/user.model";
import {ToastService} from "../../../core/services/toast.service";
import {RegexConstants} from "../../../utils/regex-constants";
import {getError, markAllTouched} from "../../../utils/global.utils";

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [ReactiveFormsModule, RouterLink ],
    templateUrl: './forgot-password.component.html',
    styleUrls: ['../login/login.component.scss']
})
export class ForgotPasswordComponent {
    errorMessages = {
        email: {
            required: 'Email is required',
            maxlength: 'Max 50 characters',
            email: 'Provide valid email',
            pattern: 'Provide valid email'
        },
    };
    forgotForm = this.fb.group({
        email: ['', [Validators.required, Validators.email, Validators.maxLength(50), Validators.pattern(RegexConstants.VALID_EMAIL_REGEX),]]
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
        if (this.forgotForm.invalid) {
            markAllTouched(this.forgotForm)
            return;
        }

        this.isLoading = true;
        this.error = '';
        this.message = '';
        const payload: ForgotPasswordRequest = {
            email: this.forgotForm.value.email as string,
        }
        this.authService.forgotPassword(payload).subscribe({
            next: () => {
                this.message = 'If that email is registered, a reset link has been sent.';
                this.forgotForm.reset();
                this.toastService.show(this.message, 'success');
                this.isLoading = false;
            },
            error: (err: HttpErrorResponse) => {
                this.error = err.error?.message || err?.message ||'Something went wrong';
                this.toastService.show(this.error, 'error');
                this.isLoading = false;
            }
        });
    }

    getErrorMsg(controlName: string, index?: number, field?: string) {
        return getError(this.forgotForm, controlName, {
            index,
            field,
            customMessages: this.errorMessages
        });
    }
}
