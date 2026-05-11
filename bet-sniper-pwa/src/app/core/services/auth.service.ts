import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { LoginModel } from '../models/auth/credentials.model';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { ResponseApis } from '../models/response-pagination.model';
import { UserToken } from '../models/auth/token.model';
import { RegisterData } from '../models/auth/registerData.model';
import { TokenService } from 'src/app/shared/services/jwt-token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl: string = '/auth';

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
  ) {}

  login(credentials: LoginModel): Observable<ResponseApis<any>> {
    return this.http
      .post<ResponseApis<any>>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          // 🔥 IMPORTANTE: Lógica de guardado condicional
          // Caso A: El usuario tiene 2FA activo (require2fa = true)
          // NO guardamos nada en el LocalStorage todavía. El componente guardará el tempToken en memoria.
          if (response.data.require2fa) {
            return;
          }

          // Caso B: Login directo (No tiene 2FA)
          // Guardamos el token final directamente
          if (response.data.token) {
            this.tokenService.saveToken(response.data.token);
          }
        }),
      );
  }

  verify2fa(
    tempToken: string,
    code: string,
  ): Observable<ResponseApis<UserToken>> {
    return this.http
      .post<ResponseApis<UserToken>>(`${this.apiUrl}/verify-2fa`, {
        tempToken,
        code,
      })
      .pipe(
        tap((response) => {
          if (response && response.data?.token) {
            this.tokenService.saveToken(response.data.token);
          }
        }),
      );
  }

  // Logout
  logout(): void {
    this.tokenService.removeToken();
    localStorage.clear(); // Limpiar todo el storage por seguridad
  }

  register(data: RegisterData): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/register`, data)
      .pipe(catchError(this.handleError));
  }

  recoverPassword(email: string): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/forgot-password`, { email })
      .pipe(catchError(this.handleError));
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/reset-password`, { token, newPassword })
      .pipe(catchError(this.handleError));
  }

  verifyEmail(email: string, code: string): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/verify-email`, { email, code })
      .pipe(catchError(this.handleError));
  }

  resendEmailVerification(email: string): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/resend-verification`, { email })
      .pipe(catchError(this.handleError));
  }


  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente (red, etc.)
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // El backend retornó un código de error (400, 401, 500, etc.)
      if (error.error) {
        // CASO NESTJS CON CLASS-VALIDATOR (Tu caso actual)
        // El backend devuelve: { message: ["Wallet inválida"], ... }
        if (Array.isArray(error.error.message)) {
          // Tomamos el primer error de la lista o los unimos
          errorMessage = error.error.message[0];
        }
        // CASO NESTJS EXCEPCIÓN MANUAL (HttpException)
        // El backend devuelve: { message: "Usuario ya existe", ... }
        else if (typeof error.error.message === 'string') {
          errorMessage = error.error.message;
        }
        // OTROS CASOS (Tu backend a veces usa 'detail')
        else if (error.error.detail) {
          errorMessage = error.error.detail;
        }
      }
    }

    // Retornamos SOLO el texto del error, no el objeto completo
    return throwError(() => errorMessage);
  }
}
