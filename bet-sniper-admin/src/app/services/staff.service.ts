import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export enum StaffRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  EDITOR = 'editor',
  SUPPORT = 'support',
  AUDITOR = 'auditor'
}

export interface CreateStaffDto {
  username: string;
  email: string;
  password?: string;
  role: StaffRole;
}

export interface Staff {
  _id: string;
  username: string;
  email: string;
  role: StaffRole;
  twoFactorEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  create(data: CreateStaffDto): Observable<Staff> {
    return this.http.post<Staff>(`${this.apiUrl}/staff`, data);
  }

  findAll(): Observable<Staff[]> {
    return this.http.get<Staff[]>(`${this.apiUrl}/staff`);
  }

  seedSuperAdmin(): Observable<any> {
    return this.http.post(`${this.apiUrl}/staff/seed`, {});
  }

  profile(): Observable<Staff> {
    return this.http.get<Staff>(`${this.apiUrl}/staff/profile`);
  }

  generate2FA(staffId?: string): Observable<any> {
    // If staffId is not passed, backend uses req.user
    // But endpoint is POST /staff/2fa/generate
    return this.http.post(`${this.apiUrl}/staff/2fa/generate`, {});
  }

  enable2FA(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/staff/2fa/enable`, { token });
  }
}
