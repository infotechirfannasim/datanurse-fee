// src/app/core/services/auth.service.ts
import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {
    ApiResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    ResetPasswordRequest,
    User,
} from '../models/user.model';
import {JwtHelperService} from '@auth0/angular-jwt';
import {AppConstants} from '../../utils/app-constants';
import {RequestService} from './request.service';
import {FORGOT_PASS_API_URL, LOGIN_API_URL, RESET_PASS_API_URL, SET_PASS_API_URL} from '../../utils/api.url.constants';
import {ToastService} from "./toast.service";

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);
    private jwtHelper = new JwtHelperService();
    private requestService = inject(RequestService);
    private toastService = inject(ToastService);

    private currentUserSubject = new BehaviorSubject<User | null>(null);
    currentUser$ = this.currentUserSubject.asObservable();

    private apiUrl = this.requestService.getBEAPIServer();

    constructor() {
        this.loadStoredUser();
    }

    login(credentials: LoginRequest): Observable<LoginResponse> {
        return this.http.post<ApiResponse<LoginResponse>>(`${this.apiUrl + LOGIN_API_URL}`, credentials).pipe(
            map((response) => {
                if (response.success) {
                    this.handleAuthentication(response.data);
                    this.toastService.show('Login successful!', 'success');
                    return response.data;
                }
                throw new Error(response.message || 'Login failed');
            }),
            catchError(this.handleError),
        );
    }

    register(userData: RegisterRequest): Observable<User> {
        return this.http.post<ApiResponse<User>>(`${this.apiUrl}/register`, userData).pipe(
            map((response) => {
                if (response.success) {
                    // this.toastr.success('Registration successful!', 'Please verify your email');
                    return response.data;
                }
                throw new Error(response.message || 'Registration failed');
            }),
            catchError(this.handleError),
        );
    }

    forgotPassword(data: ForgotPasswordRequest): Observable<void> {
        return this.http.post<ApiResponse<void>>(`${this.apiUrl + FORGOT_PASS_API_URL}`, data).pipe(
            map((response) => {
                if (response.success) {
                    // this.toastr.success('Password reset email sent!', 'Check your inbox');
                    return response.data;
                }
                throw new Error(response.message || 'Failed to send reset email');
            }),
            catchError(this.handleError),
        );
    }

    resetPassword(data: ResetPasswordRequest): Observable<void> {
        return this.http.post<ApiResponse<void>>(`${this.apiUrl + RESET_PASS_API_URL}`, data).pipe(
            map((response) => {
                if (response.success) {
                    // this.toastr.success('Password reset successful!', 'You can now login');
                    return response.data;
                }
                throw new Error(response.message || 'Failed to reset password');
            }),
            catchError(this.handleError),
        );
    }

    setPassword(data: ResetPasswordRequest): Observable<void> {
        return this.http.post<ApiResponse<void>>(`${this.apiUrl + SET_PASS_API_URL}`, data).pipe(
            map((response) => {
                if (response.success) {
                    // this.toastr.success('Password reset successful!', 'You can now login');
                    return response.data;
                }
                throw new Error(response.message || 'Failed to reset password');
            }),
            catchError(this.handleError),
        );
    }

    changePassword(data: ChangePasswordRequest): Observable<void> {
        return this.http.post<ApiResponse<void>>(`${this.apiUrl}/change-password`, data).pipe(
            map((response) => {
                if (response.success) {
                    // this.toastr.success('Password changed successfully!');
                    return response.data;
                }
                throw new Error(response.message || 'Failed to change password');
            }),
            catchError(this.handleError),
        );
    }

    logout(): void {
        this.clearAuth();
        this.router.navigate(['/auth/login']);
    }

    clearAuth(): void {
        localStorage.clear();
        this.currentUserSubject.next(null);
    }

    refreshToken(): Observable<{ token: string }> {
        const refreshToken = localStorage.getItem('refreshToken');
        return this.http
            .post<ApiResponse<{ token: string }>>(`${this.apiUrl}/refresh-token`, {refreshToken})
            .pipe(
                map((response) => {
                    if (response.success) {
                        localStorage.setItem('token', response.data.token);
                        return response.data;
                    }
                    throw new Error('Failed to refresh token');
                }),
                catchError(this.handleError),
            );
    }

    getToken(): string | null {
        return localStorage.getItem(window.btoa(AppConstants.AUTH_ACCESS_TOKEN));
    }

    isAuthenticated(): boolean {
        const token = this.getToken();
        const userStr = localStorage.getItem(window.btoa(AppConstants.USER_INFO));

        if (!token || !userStr) {
            this.clearAuth();
            return false;
        }

        if (this.jwtHelper.isTokenExpired(token)) {
            this.clearAuth();
            return false;
        }

        try {
            const user = JSON.parse(userStr);
            if (!user || !user.id) {
                this.clearAuth();
                return false;
            }
            return true;
        } catch (e) {
            this.clearAuth();
            return false;
        }
    }

    hasPermission(permission: string): boolean {
        const user = this.currentUserSubject.value;
        if (!user?.role?.permissions) {
            return false;
        }

        // Superadmin usually has '*' → full access
        if (user.role.permissions.includes('*')) {
            return true;
        }

        return user.role.permissions.includes(permission);
    }

    hasAnyPermission(permissions: string[]): boolean {
        return permissions.some(perm => this.hasPermission(perm));
    }

    /*hasRole(roleName: string): boolean {
      const user = this.currentUserSubject.value;
      return user?.roles?.some(role => role.firstName === roleName) || false;
    }*/

    handleAuthentication(response: LoginResponse): void {
        localStorage.setItem(
            window.btoa(AppConstants.AUTH_ACCESS_TOKEN),
            response.tokens.accessToken,
        );
        localStorage.setItem(
            window.btoa(AppConstants.AUTH_REFRESH_TOKEN),
            response.tokens.refreshToken,
        );
        localStorage.setItem(window.btoa(AppConstants.USER_INFO), JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
    }

    set setUser(user: User) {
        const current = this.currentUserSubject.value;

        const mergedUser: User = {
            ...current,
            ...user,
            role: {
                ...current?.role,
                ...user?.role,
                permissions: user?.role?.permissions || current?.role?.permissions || ['']
            }
        };
        this.currentUserSubject.next(mergedUser);
        localStorage.setItem(window.btoa(AppConstants.USER_INFO), JSON.stringify(mergedUser));
    }

    loadStoredUser(): void {
        const userStr = localStorage.getItem(window.btoa(AppConstants.USER_INFO));
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                this.currentUserSubject.next(user);
            } catch (e) {
                this.clearAuth();
            }
        }
    }

    handleError(error: any): Observable<never> {
        let errorMessage = 'An error occurred';

        if (error.error?.message) {
            errorMessage = error.error.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        // this.toastr.error(errorMessage, 'Error');
        return throwError(() => new Error(errorMessage));
    }
}
