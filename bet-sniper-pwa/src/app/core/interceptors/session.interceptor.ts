import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';
import { TokenService } from 'src/app/shared/services/jwt-token.service';
import { catchError, throwError } from 'rxjs';

export const sessionInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastService = inject(ToastService);
  const tokenService = inject(TokenService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Check for 401 Unauthorized
      if (error.status === 401) {
        // Check specific error message from backend
        // Accessing error.error.message based on standard NestJS/User structure
        const errorMessage = error.error?.message;

        if (errorMessage === 'SESSION_EXPIRED_DUPLICATE_LOGIN') {
          // 1. Clear Session
          tokenService.removeToken();
          localStorage.clear();

          // 2. Show Notification
          // We can use the translation key we just added
          // Note: ToastService might handle translation or raw text.
          // If ToastService expects raw text, logic might be needed to translate first
          // or just send the key if the notification component translates it.
          // Based on usage "toast.error('Error string')", it likely takes string.
          // For now, I'll send a user-friendly hardcoded message or try to use TranslateService if available in Toast.
          // Better: Use a clear message. The key is for the UI, but here we are in TS.
          // Let's assume we want to show the translated message if possible, but injecting TranslateService here is fine.

          toastService.error(
            'Tu sesión ha caducado porque se inició sesión en otro dispositivo.'
          );

          // 3. Redirect to Login
          router.navigate(['/auth/login']);
        }
      }

      return throwError(() => error);
    })
  );
};
