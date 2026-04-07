import {AfterViewInit, Component, inject, OnDestroy,} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators,} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../../core/services/auth.service';
import {ToastService} from '../../../core/services/toast.service';
import {environment} from '../../../../environments/environment';
import {getError} from "../../../utils/global.utils";
import {RegexConstants} from "../../../utils/regex-constants";

declare global {
  interface Window {
    turnstile: any;
    onTurnstileLoad?: () => void;
  }
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: 'login.component.html',
  styleUrls: ['login.component.scss'],
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;

  turnstileToken = '';
  widgetId: string | null = null;

  errorMessages = {
    email: {
      required: 'Email is required',
      maxlength: 'Max 50 characters',
      email: 'Provide valid email',
      pattern: 'Provide valid email'
    },
    password: {
      required: 'Password is required',
      minlength: 'Min 8 characters',
      maxlength: 'Max 20 characters',
      pattern: 'Include upper, lower, number & special char'
    }
  };

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.maxLength(50), Validators.email, Validators.pattern(RegexConstants.VALID_EMAIL_REGEX),]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
      rememberMe: [false],
    });
  }

  ngOnInit(): void {
    this.turnstileToken = '';
    this.widgetId = null;
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.loadTurnstileWidget();
    }, 100);
  }


  ngOnDestroy(): void {
    try {
      if (window.turnstile && this.widgetId) {
        window.turnstile.remove(this.widgetId);
      }
    } catch (e) {
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  isFieldInvalid(field: string): boolean {
    const formControl = this.loginForm.get(field);
    return !!formControl && formControl.invalid && (formControl.dirty || formControl.touched);
  }

  private loadTurnstileWidget(): void {
    const renderWidget = () => {
      const container = document.getElementById('turnstile-container');
      if (!container || !window.turnstile) return;

      // ← Pehle remove karo agar widget pehle se exist karta ho
      try {
        if (this.widgetId) {
          window.turnstile.remove(this.widgetId);
          this.widgetId = null;
        }
      } catch (e) {
      }

      container.innerHTML = '';

      this.widgetId = window.turnstile.render('#turnstile-container', {
        sitekey: environment.turnstileSiteKey,
        callback: (token: string) => {
          this.turnstileToken = token;
        },
        'expired-callback': () => {
          this.turnstileToken = '';
        },
        'error-callback': () => {
          this.turnstileToken = '';
          this.toastService.show('Captcha load failed. Please try again.', 'error');
        },
        theme: 'light',
        size: 'flexible',
      });
    };

    const waitForTurnstile = () => {
      if (window.turnstile) {
        renderWidget();
      } else {
        setTimeout(waitForTurnstile, 300);
      }
    };

    waitForTurnstile();
  }

  private resetTurnstile(): void {
    this.turnstileToken = '';
    if (window.turnstile && this.widgetId) {
      window.turnstile.reset(this.widgetId);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (!this.turnstileToken) {
      this.toastService.show('Please complete captcha first.', 'warning');
      return;
    }

    this.isLoading = true;

    const payload = {
      ...this.loginForm.value,
      turnstileToken: this.turnstileToken,
      platform: 'web',
    };

    this.authService.login(payload).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.toastService.show(err.message, 'error');
        this.isLoading = false;
        this.resetTurnstile();
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  getErrorMsg(controlName: string, index?: number, field?: string) {
    return getError(this.loginForm, controlName, {
      index,
      field,
      customMessages: this.errorMessages
    });
  }
}
