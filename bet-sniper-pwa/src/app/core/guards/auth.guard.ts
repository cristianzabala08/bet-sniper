import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from 'src/app/shared/services/jwt-token.service';

export const authGuard: CanActivateFn = (route, state) => {
  
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (tokenService.isLoggedIn()) {
    // Si el usuario está logueado, dejamos pasar
    return true;
  } else {
  
    router.navigate(['/auth/login']);
    return false;
  }
};