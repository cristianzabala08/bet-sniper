import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { StorageService } from '../core/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class StaffAuthService {
  private baseUrl = environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
    private storageService: StorageService
  ) {
    console.log(`LOG Initialized with Backend URL: ${this.baseUrl}`);
  }

  login(credentials: { username: string; password: string }): Observable<any> {
    console.log(`LOG Login attempt for user: ${credentials.username} | Backend: ${this.baseUrl}`);
    return this.http.post('/auth/staff/login', credentials);
  }

  verify2FA(data: { tempToken: string; code: string }): Observable<any> {
    return this.http.post('/auth/staff/verify-2fa', data);
  }

  logout(): void {
    this.storageService.clearStaffSession();
    localStorage.removeItem('user');
    this.router.navigate(['/admin/login']);
  }
}
