import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export enum HoldStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum HoldType {
  WITHDRAW = 'WITHDRAW'
}

export interface Hold {
  _id: string;
  user_id: {
    _id: string;
    username: string;
    email: string;
  };
  transaction_id: string;
  amount: number;
  type: HoldType;
  status: HoldStatus;
  wallet: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class HoldsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  findAll(): Observable<Hold[]> {
    return this.http.get<Hold[]>(`${this.apiUrl}/holds`);
  }

  findPending(): Observable<Hold[]> {
    return this.http.get<Hold[]>(`${this.apiUrl}/holds/pending`);
  }

  approve(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/holds/${id}/approve`, {});
  }

  reject(id: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/holds/${id}/reject`, { reason });
  }

  findByUser(userId: string): Observable<Hold[]> {
    return this.http.get<Hold[]>(`${this.apiUrl}/holds/user/${userId}`);
  }
}
