import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode'; // Asegúrate de instalar: npm install jwt-decode
import { UserPayload } from 'src/app/core/models/auth/token.model';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  private readonly TOKEN_KEY = 'auth_token';

  constructor() { }

  // Guardar token
  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  // Obtener token
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Eliminar token (Logout)
  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  // 🔥 MEJORA DE SEGURIDAD AQUÍ
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const payload = this.getPayload();
    if (!payload || !payload.exp) return false;

    // 1. Verificar expiración
    const isExpired = (Math.floor((new Date).getTime() / 1000)) >= payload.exp;
    if (isExpired) {
      this.removeToken();
      return false;
    }

    // 2. 🔥 NUEVO: Verificar que NO sea un token de flujo 2FA incompleto
    // (Asumiendo que tu backend puso { is2faFlow: true } en el payload del token temporal)
    if ((payload as any).is2faFlow) {
      return false; // El token es válido criptográficamente, pero no tiene permisos de acceso total
    }

    return true;
  }

  // Obtener datos del usuario desde el token
  getPayload(): UserPayload | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return jwtDecode<UserPayload>(token);
    } catch (error) {
      return null;
    }
  }

  // Helpers rápidos
  getUserRole(): string | null {
    return this.getPayload()?.role || null;
  }

  getUsername(): string | null {
    return this.getPayload()?.username || null;
  }
}