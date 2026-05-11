import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Transaction {
  _id: string;
  user_id:
    | {
        _id: string;
        username: string;
        email: string;
        wallet?: string;
      }
    | string;
  type: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'APPROVED';
  details?: string;
  txHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionResponse {
  data: Transaction[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  getUserTransactions(userId: string, page: number = 1, limit: number = 10): Observable<TransactionResponse> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http.get<TransactionResponse>(`${this.apiUrl}/transactions/admin/user/${userId}`, { params });
  }

  getAllTransactions(page: number = 1, limit: number = 50, filters?: any): Observable<TransactionResponse> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    if (filters) {
      if (filters.userId) params = params.set('userId', filters.userId);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.details) params = params.set('details', filters.details);
    }

    return this.http.get<TransactionResponse>(`${this.apiUrl}/transactions/admin/all`, { params });
  }

  adminPurchasePlan(userId: string, planId: number, txHash?: string): Observable<any> {
    const body: any = { planId };
    if (txHash) {
      body.txHash = txHash;
    }
    return this.http.post(`${this.apiUrl}/transactions/admin/purchase-plan/${userId}`, body);
  }

  manualPurchasePlan(userId: string, txHash: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/transactions/admin/purchase-plan-by-hash/${userId}`, { txHash });
  }
}
