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
import {LOGIN_API_URL} from '../../utils/api.url.constants';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);
    private jwtHelper = new JwtHelperService();
    private requestService = inject(RequestService);

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
                    // this.toastr.success('Login successful!', 'Welcome back!');
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
        return this.http.post<ApiResponse<void>>(`${this.apiUrl}/forgot-password`, data).pipe(
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
        return this.http.post<ApiResponse<void>>(`${this.apiUrl}/reset-password`, data).pipe(
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
        /*localStorage.removeItem(AppConstants.AUTH_ACCESS_TOKEN);
        localStorage.removeItem(AppConstants.AUTH_ACCESS_TOKEN);
        localStorage.removeItem(AppConstants.USER_INFO);*/
        localStorage.clear();
        this.currentUserSubject.next(null);
        this.router.navigate(['/auth/login']);
        // this.toastr.info('You have been logged out');
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
        return token ? !this.jwtHelper.isTokenExpired(token) : false;
    }

    hasPermission(permission: string): boolean {
        const user = this.currentUserSubject.value;
        if (!user) return false;
        return true;

        // Check if user has the permission directly or through roles
        /*return user.permissions?.some(p => p.firstName === permission) ||
          user.roles?.some(role => role.permissions?.some(p => p.firstName === permission)) ||
          false;*/
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

    loadStoredUser(): void {
        const userStr = localStorage.getItem(window.btoa(AppConstants.USER_INFO));
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                this.currentUserSubject.next(user);
            } catch (e) {
                console.error('Failed to parse stored user', e);
                this.logout();
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
