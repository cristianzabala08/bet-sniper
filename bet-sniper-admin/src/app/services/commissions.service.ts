import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Commission {
  _id: string;
  transaction_id: string;
  receiver_id:
    | {
        _id: string;
        username: string;
        email: string;
      }
    | string;
  level: number;
  percentage: number;
  amount: number;
  validation_status: 'pending' | 'approved' | 'rejected' | 'skipped';
  reason_if_rejected?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionResponse {
  data: Commission[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class CommissionsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  getUserCommissions(userId: string, page: number = 1, limit: number = 10): Observable<CommissionResponse> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString()).set('userId', userId);

    return this.http.get<CommissionResponse>(`${this.apiUrl}/commissions/admin/all`, { params });
  }

  getAllCommissions(page: number = 1, limit: number = 50, userId?: string): Observable<CommissionResponse> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    if (userId) {
      params = params.set('userId', userId);
    }

    return this.http.get<CommissionResponse>(`${this.apiUrl}/commissions/admin/all`, { params });
  }
}
