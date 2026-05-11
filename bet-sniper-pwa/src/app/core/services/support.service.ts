import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ResponseApis } from '../models/response-pagination.model';
import { SupportMessageCreate } from '../models/support/support-message.model';
import { TokenService } from 'src/app/shared/services/jwt-token.service';

@Injectable({
  providedIn: 'root',
})
export class SupportService {
  private apiUrl: string = '/support';

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
  ) {}

  createMessage(payload: SupportMessageCreate): Observable<ResponseApis<any>> {
    return this.http
      .post<ResponseApis<any>>(`${this.apiUrl}/messages`, payload)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.error) {
        if (Array.isArray(error.error.message)) {
          errorMessage = error.error.message[0];
        } else if (typeof error.error.message === 'string') {
          errorMessage = error.error.message;
        } else if (error.error.detail) {
          errorMessage = error.error.detail;
        }
      }
    }

    return throwError(() => errorMessage);
  }
}
