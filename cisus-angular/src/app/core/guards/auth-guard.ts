import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  return (
    auth.isAuthenticated() ||
    inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })
  );
};
