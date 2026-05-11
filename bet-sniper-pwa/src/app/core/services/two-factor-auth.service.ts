import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ResponseApis } from '../models/response-pagination.model';
import {
  Generate2FAResponse,
  Activate2FARequest,
  Activate2FAResponse,
} from '../models/auth/twofa.model';

@Injectable({
  providedIn: 'root',
})
export class TwoFactorAuthService {
  private apiUrl: string = '/users/2fa';

  constructor(private http: HttpClient) {}

  // Método privado para obtener headers con token de autenticación

  // Generar QR para activar 2FA
  generate2FA(): Observable<ResponseApis<Generate2FAResponse>> {
    return this.http.get<ResponseApis<Generate2FAResponse>>(
      `${this.apiUrl}/generate`,
    );
  }

  // Activar 2FA con el código del authenticator
  activate2FA(code: string): Observable<ResponseApis<Activate2FAResponse>> {
    // const body: Activate2FARequest = { code };
    const body = { token: code };
    return this.http.post<ResponseApis<Activate2FAResponse>>(
      `${this.apiUrl}/enable`,
      body,
    );
  }

  // Opcional: Desactivar 2FA
  disable2FA(code: string): Observable<ResponseApis<any>> {
    return this.http.post<ResponseApis<any>>(`${this.apiUrl}/disable`, {
      code,
    });
  }
}
