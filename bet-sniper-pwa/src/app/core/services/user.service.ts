import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApis } from '../models/response-pagination.model';
import { UserToken } from '../models/auth/token.model';
import { TokenService } from 'src/app/shared/services/jwt-token.service';
import { LoginModel } from '../models/auth/credentials.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private _accountsBaseUrl: string = '/auth';

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
  ) {}

  public postUser(
    email: string,
    password: string,
  ): Observable<ResponseApis<UserToken>> {
    let body: LoginModel = {
      username: email,
      password: password,
    };
    return this.http.post<ResponseApis<UserToken>>(
      `${this._accountsBaseUrl}/signin`,
      body,
    );
  }

  public updateAvatar(avatar: string): Observable<ResponseApis<any>> {
    return this.http.post<ResponseApis<any>>(
      `${this._accountsBaseUrl}/update-avatar`,
      { avatar },
    );
  }

  public updatePassword(password: string): Observable<ResponseApis<any>> {
    return this.http.post<ResponseApis<any>>(
      `${this._accountsBaseUrl}/change-password`,
      { password },
    );
  }

  public updateWallet(wallet: string): Observable<ResponseApis<any>> {
    return this.http.post<ResponseApis<any>>('/users/include-wallet', {
      wallet,
    });
  }

  public getUser(username: string): Observable<any> {
    const timestamp = new Date().getTime();
    return this.http.get<any>(`/users/${username}?t=${timestamp}`);
  }

  public getReferrals(username: string): Observable<any> {
    const timestamp = new Date().getTime();
    return this.http.get<any>(`/users/referrals/${username}?t=${timestamp}`);
  }

  public purchasePlan(hash: string): Observable<any> {
    // Ensure checking where this endpoint actually lives. The plan said /users/upgrade-bot.
    // Assuming it's protected.
    return this.http.post<any>('/transactions/purchase-plan', { txHash: hash });
  }

  public getMyNetwork(): Observable<any> {
    return this.http.get<any>('/users/network');
  }

  public getReferralTree(username: string): Observable<any[]> {
    return this.http.get<any[]>(`/users/tree/${username}`);
  }
}
