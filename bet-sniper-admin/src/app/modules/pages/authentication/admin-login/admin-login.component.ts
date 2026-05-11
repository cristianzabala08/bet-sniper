import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { StaffAuthService } from '../../../../services/staff-auth.service';
import { JwtService } from '../../../../../app/core/services/jwt.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-wrapper">
      <div class="auth-content">
        <div class="auth-bg">
          <span class="r"></span>
          <span class="r s"></span>
          <span class="r s"></span>
          <span class="r"></span>
        </div>
        <div class="card">
          <div class="card-body text-center">
            <div class="mb-4">
              <i class="feather icon-unlock auth-icon"></i>
            </div>
            <h3 class="mb-4">Admin Login</h3>

            <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

            <div *ngIf="!requires2FA">
              <div class="input-group mb-3">
                <input type="text" class="form-control" placeholder="Username" [(ngModel)]="username" />
              </div>
              <div class="input-group mb-4">
                <input type="password" class="form-control" placeholder="Password" [(ngModel)]="password" />
              </div>
              <button class="btn btn-primary mb-4" (click)="login()">Login</button>
            </div>

            <div *ngIf="requires2FA">
              <h5 class="mb-3">Two-Factor Authentication</h5>
              <p class="text-muted">Enter the code from your authenticator app.</p>
              <div class="input-group mb-4">
                <input type="text" class="form-control" placeholder="123456" [(ngModel)]="code" />
              </div>
              <button class="btn btn-primary mb-4" (click)="verify2FA()">Verify</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .auth-wrapper {
        background: #1a1a1a; /* Dark background */
      }
    `
  ]
})
export class AdminLoginComponent {
  username = '';
  password = '';
  code = '';
  requires2FA = false;
  tempToken = '';
  error = '';

  constructor(
    private authService: StaffAuthService,
    private jwtService: JwtService,
    private router: Router
  ) {}

  login() {
    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (res) => {
        if (res.require2fa) {
          this.requires2FA = true;
          this.tempToken = res.tempToken;
          this.error = '';
        } else {
          this.jwtService.saveToken(res.access_token);
          // Navigate to dashboard (placeholder for now)
          localStorage.setItem('user', JSON.stringify(res.user));
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.error = 'Invalid credentials';
        console.error(err);
      }
    });
  }

  verify2FA() {
    this.authService.verify2FA({ tempToken: this.tempToken, code: this.code }).subscribe({
      next: (res) => {
        this.jwtService.saveToken(res.access_token);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error = 'Invalid 2FA Code';
      }
    });
  }
}
