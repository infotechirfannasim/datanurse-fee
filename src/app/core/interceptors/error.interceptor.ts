// src/app/core/interceptors/error.interceptor.ts
import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {Router} from '@angular/router';
import {throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'An error occurred';

            if (error.error instanceof ErrorEvent) {
                // Client-side error
                errorMessage = error.error.message;
            } else {
                // Server-side error
                switch (error.status) {
                    case 400:
                        errorMessage = error.error?.message || 'Bad request';
                        break;
                    case 403:
                        errorMessage = 'You do not have permission to perform this action';
                        router.navigate(['/dashboard']);
                        break;
                    case 404:
                        errorMessage = 'Resource not found';
                        break;
                    case 500:
                        errorMessage = 'Internal server error';
                        break;
                    default:
                        errorMessage = error.error?.message || `Error: ${error.status}`;
                }
            }

            // toastr.error(errorMessage, 'Error');
            return throwError(() => error);
        })
    );
};
