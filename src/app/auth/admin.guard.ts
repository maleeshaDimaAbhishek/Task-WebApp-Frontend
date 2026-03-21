import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedInSnapshot()) {
    return router.createUrlTree(['/login']);
  }

  return authService.getCurrentUser().pipe(
    map((user) => {
      const status = (user?.status || '').toUpperCase();
      return status === 'ADMIN' ? true : router.createUrlTree(['/tasks']);
    }),
    catchError(() => of(router.createUrlTree(['/tasks'])))
  );
};
