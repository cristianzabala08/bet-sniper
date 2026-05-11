import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { TokenService } from 'src/app/shared/services/jwt-token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const token = tokenService.getToken();

  // Check if request is to our API (either by full URL or relative path)
  let isApiRequest = req.url.startsWith(environment.api);

  // If it's a relative path (e.g. '/auth/login'), we treat it as an API request
  // and prepend the environment API URL
  // EXCEPTION: Translation files and other assets
  if (!req.url.startsWith('http') && !req.url.includes('assets/')) {
    isApiRequest = true;
    req = req.clone({
      url: `${environment.api}${req.url}`,
    });
  }

  if (token && isApiRequest) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req);
};
