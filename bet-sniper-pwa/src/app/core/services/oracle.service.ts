import { Injectable, inject } from '@angular/core';
import { UserService } from 'src/app/core/services/user.service';
import { TokenService } from 'src/app/shared/services/jwt-token.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OracleService {
  private userService = inject(UserService);
  private tokenService = inject(TokenService);

  constructor() {}

  async ask(query: string): Promise<string> {
    // Simulate network delay for "Thinking" effect
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const lowerQuery = query.toLowerCase();
    const userData = this.tokenService.getPayload();
    const username = (userData as any)?.username;

    // --- SMART LOCAL RESPONSES (Mocking Backend Intelligence) ---

    // 1. Referrals
    if (
      lowerQuery.includes('referido') ||
      lowerQuery.includes('referrals') ||
      lowerQuery.includes('red')
    ) {
      if (username) {
        try {
          const stats = await firstValueFrom(
            this.userService.getReferrals(username)
          );
          return `Actualmente tienes ${stats.referralsCount} referidos directos y ${stats.referralsNetwork} en tu red total.`;
        } catch (e) {
          return 'No pude obtener tus datos de referidos en este momento.';
        }
      }
      return 'Necesito saber quién eres para ver tus referidos.';
    }

    // 2. Balance / Transactions
    if (
      lowerQuery.includes('balance') ||
      lowerQuery.includes('saldo') ||
      lowerQuery.includes('dinero')
    ) {
      if (username) {
        try {
          const user = await firstValueFrom(this.userService.getUser(username));
          return `Tu balance actual es de ${user.balance || 0} USDT y tienes ${
            user.points || 0
          } puntos.`;
        } catch (e) {
          return 'No pude recuperar tu balance.';
        }
      }
    }

    // 3. Greeting
    if (lowerQuery.includes('hola') || lowerQuery.includes('hello')) {
      return `¡Hola ${
        username || 'viajero'
      }! Soy tu Oráculo Bet Sniper. ¿En qué puedo ayudarte hoy?`;
    }

    // 4. Default Fallback
    return 'Entiendo tu pregunta, pero por el momento solo tengo acceso a datos básicos de tu cuenta. Pronto estaré conectado a una superinteligencia global.';
  }
}
