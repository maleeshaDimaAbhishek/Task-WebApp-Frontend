import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedInSnapshot()) {
    return true;
  }
  // Not logged in — redirect to login, preserve the intended URL
  return router.createUrlTree(['/login']);
};