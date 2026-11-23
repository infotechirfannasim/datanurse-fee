import {HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {inject} from '@angular/core';
import {Router} from '@angular/router';
import {throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {AuthService} from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const token = authService.getToken();

    let authReq = req.clone({
        setHeaders: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'x-client-type': 'web'
        }
    });

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // Session ended or expired: there is no refresh token any more, so the user logs in again.
            if (error.status === 401 && token && !req.url.includes('auth/logout')) {
                authService.clearAuth();
                router.navigate(['/auth/login']);
            }
            return throwError(() => error);
        })
    );
};
