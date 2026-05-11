import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'src/app/core/services/toast.service';
import { UserService } from 'src/app/core/services/user.service';
import { Web3Service } from 'src/app/core/services/web3.service';
import { TokenService } from 'src/app/shared/services/jwt-token.service';
import { firstValueFrom } from 'rxjs';

export interface PlanDefinition {
  id: number;
  name: string;
  price: string;
  label: string;
  internalId: number;
}

@Injectable({
  providedIn: 'root',
})
export class PurchaseService {
  private web3Service = inject(Web3Service);
  private userService = inject(UserService);
  private tokenService = inject(TokenService);
  private toast = inject(ToastService);
  private router = inject(Router);
  // private translate = inject(TranslateService); // Optional if needed for complex msgs

  // Global Loading State
  public isLoading = signal<boolean>(false);
  public loadingMessage = signal<string>('');

  // Centralized Plan Definitions
  readonly plans: PlanDefinition[] = [
    { id: 1, name: 'WEEKLY', price: '50', label: '1 Week', internalId: 0 },
    { id: 2, name: 'BASIC', price: '100', label: '1 Month', internalId: 1 },
    { id: 3, name: 'AMATEUR', price: '250', label: '3 Months', internalId: 2 },
    { id: 4, name: 'PRO', price: '500', label: '6 Months', internalId: 3 },
    { id: 5, name: 'EXPERT', price: '750', label: '9 Months', internalId: 4 },
    { id: 6, name: 'ELITE', price: '1000', label: '12 Months', internalId: 5 },
  ];

  constructor() {}

  async buyPlan(plan: PlanDefinition): Promise<boolean> {
    if (this.isLoading()) return false;

    if (!this.web3Service.isConnected()) {
      this.toast.error('Por favor conecta tu wallet primero');
      await this.web3Service.connectWallet();
      return false;
    }

    const userData = this.tokenService.getPayload();
    const userId = (userData as any)?.id || (userData as any)?._id; // Adjust based on JWT structure
    const username = (userData as any)?.username;

    if (!userId && !username) {
      this.toast.error(
        'No se pudo identificar al usuario. Inicia sesión nuevamente.',
      );
      return false;
    }

    const userIdentifier = userId || username;

    try {
      // Start Loading
      this.isLoading.set(true);
      this.loadingMessage.set(
        `Iniciando compra del plan ${plan.name}... Por favor espera.`,
      );

      this.toast.info(`Iniciando compra...`);

      // 1. Blockchain Transaction
      const receipt = await this.web3Service.buyPlan(
        plan.id,
        plan.price,
        userIdentifier,
      );

      this.loadingMessage.set(
        'Transacción confirmada. Verificando con el servidor...',
      );
      this.toast.success('Transacción en Blockchain exitosa.');

      // 2. Backend Verification
      // Convert Observable to Promise to await completion
      await firstValueFrom(this.userService.purchasePlan(receipt.hash));

      this.toast.success('¡Plan activado correctamente!');
      this.isLoading.set(false);
      this.router.navigate(['/app/dashboard']);
      return true;
    } catch (error: any) {
      console.error('Purchase Error:', error);
      this.isLoading.set(false);

      if (error.reason) {
        this.toast.error(`Error: ${error.reason}`);
      } else if (error.message && error.message.includes('User denied')) {
        this.toast.error('Transacción rechazada por el usuario');
      } else {
        // Backend or logic error
        // If it was backend error, firstValueFrom throws
        this.toast.error('Error al realizar la compra o sincronización.');
      }
      return false;
    }
  }

  async verifyManualTransaction(hash: string): Promise<boolean> {
    if (this.isLoading()) return false;

    if (!hash) {
      this.toast.error('El hash es obligatorio');
      return false;
    }

    try {
      this.isLoading.set(true);
      this.loadingMessage.set('Verificando transacción con el servidor...');
      this.toast.info('Verificando hash...');

      await firstValueFrom(this.userService.purchasePlan(hash));

      this.toast.success('¡Plan activado correctamente!');
      this.isLoading.set(false);

      // Delay to ensure backend propagation (same logic as buyPlan reload)
      // Note: Caller might handle reload, but for safety let's assume reload happens in component
      // or we can navigate here.
      this.router.navigate(['/app/dashboard']);
      return true;
    } catch (error: any) {
      console.error('Manual Verification Error:', error);
      this.isLoading.set(false);
      this.toast.error(
        'Error al verificar el hash. Asegúrate de que seal válido y reciente.',
      );
      return false;
    }
  }

  getPlanByName(name: string): PlanDefinition | undefined {
    return this.plans.find((p) => p.name === name);
  }
}
