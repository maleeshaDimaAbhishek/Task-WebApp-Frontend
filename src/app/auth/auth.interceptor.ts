import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();
  const isAuthEndpoint =
    req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register');

  if (!token) {
    return next(req).pipe(
      catchError((err) => {
        if ((err?.status === 401 || err?.status === 403) && !isAuthEndpoint) {
          authService.logout();
          router.navigate(['/login'], { queryParams: { session: 'expired' } });
        }
        return throwError(() => err);
      })
    );
  }

  // Clone the request — HttpRequest objects are immutable
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq).pipe(
    catchError((err) => {
      if ((err?.status === 401 || err?.status === 403) && !isAuthEndpoint) {
        authService.logout();
        router.navigate(['/login'], { queryParams: { session: 'expired' } });
      }
      return throwError(() => err);
    })
  );
};
