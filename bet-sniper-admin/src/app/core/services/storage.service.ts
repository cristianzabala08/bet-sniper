import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly STAFF_TOKEN_KEY = 'staff_token';
  private readonly STAFF_USER_KEY = 'staff_user';

  constructor() {}

  clean(): void {
    localStorage.clear();
  }

  public saveStaffToken(token: string): void {
    localStorage.removeItem(this.STAFF_TOKEN_KEY);
    localStorage.setItem(this.STAFF_TOKEN_KEY, token);
  }

  public getStaffToken(): string | null {
    return localStorage.getItem(this.STAFF_TOKEN_KEY);
  }

  public saveStaffUser(user: any): void {
    localStorage.removeItem(this.STAFF_USER_KEY);
    localStorage.setItem(this.STAFF_USER_KEY, JSON.stringify(user));
  }

  public getStaffUser(): any {
    const user = localStorage.getItem(this.STAFF_USER_KEY);
    if (user) {
      return JSON.parse(user);
    }
    return null;
  }

  public isLoggedIn(): boolean {
    const token = localStorage.getItem(this.STAFF_TOKEN_KEY);
    return !!token;
  }

  public clearStaffSession(): void {
    localStorage.removeItem(this.STAFF_TOKEN_KEY);
    localStorage.removeItem(this.STAFF_USER_KEY);
  }
}
