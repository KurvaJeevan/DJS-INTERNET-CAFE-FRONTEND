import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Blocks navigation to protected routes when no token is present.
 * Redirects to /login and remembers the originally requested URL
 * so the user lands back where they intended after signing in.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn) {
    return true;
  }

  router.navigate(['/login'], { queryParams: { redirectTo: state.url } });
  return false;
};

/**
 * Opposite guard — keeps logged-in users out of /login and /landing
 * by sending them straight to the dashboard instead.
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

/** Restricts a route to admin-role users only. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn && auth.currentUser()?.role === 'admin') {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
