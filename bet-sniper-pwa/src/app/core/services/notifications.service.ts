import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenService } from 'src/app/shared/services/jwt-token.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private apiUrl = `${environment.api}/notifications`;

  constructor(private http: HttpClient, private tokenService: TokenService) {}

  getNotifications(): Observable<any[]> {
    const token = this.tokenService.getToken();
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.get<any[]>(this.apiUrl, { headers });
  }

  createNotification(description: string = ''): Observable<any> {
    const token = this.tokenService.getToken();
    const payload = this.tokenService.getPayload();
    const headers = { Authorization: `Bearer ${token}` };

    const body = {
      date: new Date().toISOString(),
      description: description,
      userId: payload?.sub, // ID del usuario desde el token
      status: false,
    };

    return this.http.post<any>(this.apiUrl, body, { headers });
  }

  markAsRead(id: string | number): Observable<any> {
    const token = this.tokenService.getToken();
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers });
  }
}
