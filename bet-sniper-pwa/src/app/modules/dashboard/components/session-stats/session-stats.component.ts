import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { UserService } from 'src/app/core/services/user.service';
import { TokenService } from 'src/app/shared/services/jwt-token.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { PurchaseService } from 'src/app/core/services/purchase.service';
// Interfaz para el tiempo restante
interface RemainingTime {
  months: number;
  days: number;
  hours: number;
}

@Component({
  standalone: true,
  imports: [CommonModule, TranslateModule, RouterModule],
  selector: 'app-session-stats',
  templateUrl: './session-stats.component.html',
  styleUrls: ['./session-stats.component.scss'],
})
export class SessionStatsComponent implements OnInit {
  referralsCount: number = 0;
  referralsNetwork: number = 0;
  newReferralsCount: number = 0;
  username: string = '';

  pointsBalance: number = 0;
  currentPlan: string | null = null;
  membershipExpiration: string | null = null;

  // Datos procesados para la UI
  planLabel: string = '';
  timeLeft: RemainingTime = { months: 0, days: 0, hours: 0 };

  // Diccionario de planes
  readonly plans = [
    { name: 'WEEKLY', label: 'DASHBOARD.CARDBAR.PLANS.WEEKLY' }, // Usamos llaves de traducción
    { name: 'BASIC', label: 'DASHBOARD.CARDBAR.PLANS.MONTHLY' },
    { name: 'AMATEUR', label: 'DASHBOARD.CARDBAR.PLANS.3MONTHS' },
    { name: 'PRO', label: 'DASHBOARD.CARDBAR.PLANS.6MONTHS' },
    { name: 'EXPERT', label: 'DASHBOARD.CARDBAR.PLANS.9MONTHS' },
    { name: 'ELITE', label: 'DASHBOARD.CARDBAR.PLANS.12MONTHS' },
  ];

  constructor(
    private userService: UserService,
    private tokenService: TokenService,
    private toast: ToastService,
    private purchaseService: PurchaseService, // Inject PurchaseService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    const userData = this.tokenService.getPayload();
    this.username = (userData as any)?.username;

    if (this.username) {
      // 1. Get Referrals Stats
      this.userService.getReferrals(this.username).subscribe({
        next: (res) => {
          this.referralsCount = res.referralsCount || 0;
          this.referralsNetwork = res.referralsNetwork || 0;
          this.newReferralsCount = res.referralsMonth || 0;
        },
        error: (err) => {
          console.error('Error loading referrals data:', err);
        },
      });

      // 2. Get User Details (Plan, Balance, etc.)
      this.userService.getUser(this.username).subscribe({
        next: (user) => {
          this.pointsBalance = user.points || 0;
          this.currentPlan = user.plan || null;
          this.membershipExpiration = user.membership_expiration || null;

          // Procesar datos una vez recibidos
          this.processPlanDetails();
          this.calculateTimeRemaining();
        },
        error: (err) => {
          console.error('Error loading user data:', err);
        },
      });
    }
  }

  dateFormateWithTime(date: string) {
    const dateObj = new Date(date);
    return dateObj.toLocaleString();
  }

  private processPlanDetails() {
    if (this.currentPlan) {
      const planInfo = this.plans.find((p) => p.name === this.currentPlan);
      this.planLabel = planInfo ? planInfo.label : this.currentPlan;
    }
  }

  private calculateTimeRemaining() {
    if (!this.membershipExpiration) return;

    const now = new Date().getTime();
    const expirationTime = new Date(this.membershipExpiration).getTime();

    // Check if date is valid
    if (isNaN(expirationTime)) {
      console.error('Invalid expiration date:', this.membershipExpiration);
      return;
    }

    const diff = expirationTime - now;

    if (diff > 0) {
      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const totalDays = Math.floor(totalHours / 24);

      this.timeLeft = {
        months: Math.floor(totalDays / 30),
        days: totalDays % 30,
        hours: totalHours % 24,
      };
    } else {
      // Plan expirado
      this.timeLeft = { months: 0, days: 0, hours: 0 };
    }
  }

  async renewMembership() {
    if (!this.currentPlan) {
      this.toast.error('No tienes un plan activo para renovar.');
      return;
    }

    const plan = this.purchaseService.getPlanByName(this.currentPlan);

    if (plan) {
      const success = await this.purchaseService.buyPlan(plan);
      if (success) {
        // Wait briefly for backend propagation
        this.toast.info('Actualizando información de tu membresía...');
        await new Promise((resolve) => setTimeout(resolve, 1500));
        this.loadDashboardData();
      }
    } else {
      console.error('Plan not found for name:', this.currentPlan);
      this.toast.error('No se pudo identificar el plan actual.');
    }
  }

  copyReferralLink() {
    if (!this.username) {
      this.toast.error('No se pudo obtener el nombre de usuario');
      return;
    }

    const referralLink = `${window.location.origin}/auth/register?ref=${this.username}`;
    navigator.clipboard.writeText(referralLink).then(
      () => {
        this.toast.success('Link de referido copiado al portapapeles');
      },
      (err) => {
        console.error('Could not copy text: ', err);
        this.toast.error('Error al copiar el link');
      },
    );
  }
}
