import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenService } from 'src/app/shared/services/jwt-token.service';

export interface Transaction {
  _id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string; // 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE'
  details: string;
  createdAt: string;
  updatedAt?: string;
  txHash?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TransactionsService {
  private apiUrl = '/transactions';

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
  ) {}

  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.apiUrl);
  }

  createTransaction(
    userId: string,
    type: string,
    amount: number,
    status: string,
    details: string,
    extraData?: any,
  ): Observable<Transaction> {
    const body: any = {
      userId,
      type,
      amount,
      status,
      details,
    };
    if (extraData) {
      Object.assign(body, extraData);
    }
    return this.http.post<Transaction>(this.apiUrl, body);
  }

  withdraw(amount: number, code: string): Observable<any> {
    const body = {
      amount,
      code,
    };
    return this.http.post(`${this.apiUrl}/withdraw`, body);
  }

  transfer(amount: number, target: string, code: string): Observable<any> {
    const body = {
      amount,
      target,
      code,
    };
    return this.http.post(`${this.apiUrl}/transfer`, body);
  }
}
