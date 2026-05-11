import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface User {
  _id?: string;
  fullname: string;
  username: string;
  email: string;
  wallet: string;
  password?: string;
  created: number;
  lastupdated: number;
  loginAttempts: number;
  lockUntil: number;
  activated: boolean;
  plan: 'NONE' | 'WEEKLY' | 'BASIC' | 'AMATEUR' | 'PRO' | 'EXPERT' | 'ELITE';
  referredBy: string | null;
  points: number;
  referralsCount: number;
  referrals: string[];
  usertype: string;
  twoFactorEnabled: boolean;
  acceptTerms: boolean;
  resetPasswordToken: string | null;
  resetPasswordExpires: Date | null;
  avatar: string;
  sponsor_id: string;
  membership_expiration: Date;
  direct_referrals_count: number;
  wallet_address: string;
  status: 'active' | 'expired';
  loginSessionId: string;
}

export interface UserResponse {
  data: User[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  findAll(page: number = 1, limit: number = 50, search: string = ''): Observable<UserResponse> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    console.log(`LOG [UsersService] findAll() - page: ${page}, limit: ${limit}, search: ${search}`);

    if (search) {
      params = params.set('search', search); // Assuming backend supports search, though not in provided snippet
    }

    return this.http.get<UserResponse>(`${this.apiUrl}/users/admin/list`, { params });
  }

  blockUser(id: string, activated: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/admin/${id}/block`, { activated });
  }

  updateUser(id: string, data: any): Observable<any> {
    // console.log(`LOG [UsersService] updateUser() - id: ${id}, data: ${data}`);
    return this.http.put(`${this.apiUrl}/users/admin/${id}`, data);
  }

  changePassword(id: string, password: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/admin/${id}/password`, { password });
  }

  findOneById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/admin/${id}`);
  }

  adminReset2FA(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/admin/${id}/2fa/reset`, {});
  }

  checkEmailAvailability(id: string, email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/admin/${id}/${email}`);
  }
}
