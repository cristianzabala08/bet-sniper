import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface AuditLog {
  _id: string;
  operation: string;
  user_id: string; // Or populate object if backend populates it
  details?: any;
  ip_address?: string;
  user_agent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogResponse {
  rows: AuditLog[];
  totalRow: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  findByPagination(page: number = 1, limit: number = 50): Observable<AuditLogResponse> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http.get<AuditLogResponse>(`${this.apiUrl}/audit/logs`, { params });
  }
}
