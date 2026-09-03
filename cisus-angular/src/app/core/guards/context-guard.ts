import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const contextGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  if (!auth.isAuthenticated()) return inject(Router).createUrlTree(['/login']);
  return auth.hasActiveContext() || inject(Router).createUrlTree(['/cuenta']);
};
