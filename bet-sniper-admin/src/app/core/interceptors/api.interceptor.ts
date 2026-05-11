import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { JwtService } from '../services/jwt.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private baseUrl = environment.apiBaseUrl;

  constructor(
    private jwtService: JwtService,
    private router: Router
  ) {
    console.log(`LOG Connecting to backend: ${this.baseUrl}`);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let authReq = req;

    // Append Base URL if request is not absolute
    if (!req.url.startsWith('http')) {
      authReq = req.clone({ url: `${this.baseUrl}${req.url}` });
    }

    const token = this.jwtService.getToken();
    if (token) {
      authReq = authReq.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.jwtService.destroyToken();
          this.router.navigate(['/admin/login']);
        }
        return throwError(() => error);
      })
    );
  }
}
