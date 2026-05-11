import { Component, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InfoCardsComponent } from 'src/app/shared/components/info-cards/info-cards.component';
import { LogoComponent } from 'src/app/shared/components/logo/logo.component';
import { Web3Service } from 'src/app/core/services/web3.service';
import { UserService } from 'src/app/core/services/user.service';
import { TokenService } from 'src/app/shared/services/jwt-token.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { Router } from '@angular/router';
import { ConfirmationModalComponent } from 'src/app/shared/components/confirmation-modal/confirmation-modal.component';
import { ManualVerifyModalComponent } from 'src/app/shared/components/manual-verify-modal/manual-verify-modal.component';
import { CommonModule } from '@angular/common';
import { PurchaseService } from 'src/app/core/services/purchase.service';
import { PlanPurchaseModalComponent } from 'src/app/shared/components/plan-purchase-modal/plan-purchase-modal.component';

@Component({
  standalone: true,
  selector: 'app-plans-selection',
  templateUrl: './plans-selection.component.html',
  styleUrls: ['./plans-selection.component.scss'],
  imports: [
    CommonModule,
    InfoCardsComponent,
    LogoComponent,
    TranslateModule,
    ConfirmationModalComponent,
    ManualVerifyModalComponent,
    PlanPurchaseModalComponent,
  ],
})
export class PlansSelectionComponent {
  private web3Service = inject(Web3Service);
  private userService = inject(UserService);
  private tokenService = inject(TokenService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private purchaseService = inject(PurchaseService); // Inject Purchase Service

  // Use plans from service to ensure consistency, or keep local if styling differs significantly
  // But for logic, we need to map to Service's plan definition
  plans = this.purchaseService.plans;

  planViewModels = this.plans.map((plan) => {
    let cssClassType = '';
    let iconClass = '';
    let durationNum = plan.label.split(' ')[0];
    let durationUnitKey = '';
    let costLabelKey = 'PLANS.CARD.ACTIVE_BY';
    let features: { icon: string; key: string; bold?: boolean }[] = [];

    switch (plan.name) {
      case 'WEEKLY':
        cssClassType = 'card-weekly';
        iconClass = 'fa-solid fa-star';
        durationUnitKey = 'PLANS.CARD.WEEK';
        costLabelKey = 'PLANS.CARD.ACTIVE_MEMBERSHIP';
        features = [
          {
            icon: 'fa-solid fa-gift',
            key: 'PLANS.CARD.PAY_UP_TO_6_LEVELS',
            bold: true,
          },
          {
            icon: 'fa-regular fa-circle-check',
            key: 'PLANS.CARD.SIGNALS_24_7',
          },
          {
            icon: 'fa-regular fa-circle-check',
            key: 'PLANS.CARD.BOT_AUTOMATIC',
          },
          { icon: 'fa-regular fa-circle-check', key: 'PLANS.CARD.SUPPORT_24' },
        ];
        break;
      case 'BASIC':
        cssClassType = 'card-basic';
        iconClass = 'fa-regular fa-calendar';
        durationUnitKey = 'PLANS.CARD.MONTHS';
        costLabelKey = 'PLANS.CARD.ACTIVE_MEMBERSHIP';
        features = [
          {
            icon: 'fa-regular fa-circle-check',
            key: 'PLANS.CARD.SIGNALS_24_7',
          },
          { icon: 'fa-regular fa-circle-check', key: 'PLANS.CARD.BOT_MANUAL' },
          {
            icon: 'fa-regular fa-circle-check',
            key: 'PLANS.CARD.BOT_AUTOMATIC',
          },
          { icon: 'fa-regular fa-circle-check', key: 'PLANS.CARD.SUPPORT_24' },
        ];
        break;
      case 'AMATEUR':
        cssClassType = 'card-amateur';
        iconClass = 'fa-regular fa-calendar';
        durationUnitKey = 'PLANS.CARD.MONTHS';
        features = [
          {
            icon: 'fa-regular fa-circle-check',
            key: 'PLANS.CARD.SIGNALS_24_7',
          },
          { icon: 'fa-regular fa-circle-check', key: 'PLANS.CARD.BOT_MANUAL' },
          {
            icon: 'fa-regular fa-circle-check',
            key: 'PLANS.CARD.BOT_AUTOMATIC',
          },
          { icon: 'fa-regular fa-circle-check', key: 'PLANS.CARD.SUPPORT_24' },
        ];
        break;
      case 'PRO':
        cssClassType = 'card-pro';
        iconClass = 'fa-regular fa-calendar';
        durationUnitKey = 'PLANS.CARD.MONTHS';
        features = [
          {
            icon: 'fa-regular fa-circle-check',
            key: 'PLANS.CARD.SIGNALS_24_7',
          },
          { icon: 'fa-regular fa-circle-check', key: 'PLANS.CARD.BOT_MANUAL' },
          {
            icon: 'fa-regular fa-circle-check',
            key: 'PLANS.CARD.BOT_AUTOMATIC',
          },
          { icon: 'fa-regular fa-circle-check', key: 'PLANS.CARD.SUPPORT_24' },
        ];
        break;
      case 'EXPERT':
        cssClassType = 'card-expert';
        iconClass = 'fa-solid fa-medal';
        durationUnitKey = 'PLANS.CARD.MONTHS';
        features = [
          {
            icon: 'fa-regular fa-circle-check',
            key: 'PLANS.CARD.SIGNALS_24_7',
          },
          { icon: 'fa-regular fa-circle-check', key: 'PLANS.CARD.BOT_MANUAL' },
          {
            icon: 'fa-regular fa-circle-check',
            key: 'PLANS.CARD.BOT_AUTOMATIC',
          },
          { icon: 'fa-regular fa-circle-check', key: 'PLANS.CARD.SUPPORT_24' },
        ];
        break;
      case 'ELITE':
        cssClassType = 'card-elite';
        iconClass = 'fa-solid fa-crown';
        durationUnitKey = 'PLANS.CARD.MONTHS';
        features = [
          {
            icon: 'fa-regular fa-circle-check',
            key: 'PLANS.CARD.SIGNALS_24_7',
          },
          { icon: 'fa-regular fa-circle-check', key: 'PLANS.CARD.BOT_MANUAL' },
          {
            icon: 'fa-regular fa-circle-check',
            key: 'PLANS.CARD.BOT_AUTOMATIC',
          },
          { icon: 'fa-regular fa-circle-check', key: 'PLANS.CARD.SUPPORT_24' },
        ];
        break;
    }

    return {
      ...plan,
      cssClassType,
      iconClass,
      durationNum,
      durationUnitKey,
      costLabelKey,
      features,
    };
  });

  // Modal State
  isModalVisible: boolean = false;
  modalTitle: string = '';
  modalMessage: string = '';
  modalConfirmText: string = '';
  modalCancelText: string = '';
  selectedPlanIndex: number | null = null;

  // New Purchase Modal State
  isPurchaseModalVisible = false;
  selectedPlanForPurchase: any = null;

  // User State
  currentPlanId: number | null = null; // 0=Weekly, 1=Basic, etc.
  userPoints: number = 0;

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    const userData = this.tokenService.getPayload();
    const username = (userData as any)?.username;

    if (username) {
      this.userService.getUser(username).subscribe({
        next: (user) => {
          if (user.plan !== undefined && user.plan !== null) {
            this.currentPlanId = user.plan;
          }
          if (user.points) {
            this.userPoints = user.points;
          }
        },
        error: (err) => console.error('Error loading user data:', err),
      });
    }
  }

  openConfirmationModal(planIndex: number) {
    if (this.purchaseService.isLoading()) return; // Check global loading

    // For purchase flow, we use the new PlanPurchaseModalComponent
    // We only check for connection inside the modal now, so we can just open it.

    // However, we might want to keep the upgrade/downgrade logic visual text?
    // The user requirement specifically asked for a 3-step connection/allowance/buy modal.
    // The previous text warnings about "You are downgrading" might be less critical than the strict flow.
    // If we want to preserve them, we could add them to the modal, but let's stick to the prompt.

    this.selectedPlanForPurchase = this.plans[planIndex];
    this.isPurchaseModalVisible = true;
  }

  onModalConfirm() {
    // This is for the generic modal if we still use it (maybe we don't for purchase anymore)
    this.isModalVisible = false;
    if (this.selectedPlanIndex !== null) {
      this.proceedToBuy(this.selectedPlanIndex);
    }
  }

  onModalCancel() {
    this.isModalVisible = false;
    this.selectedPlanIndex = null;
  }

  closePurchaseModal() {
    this.isPurchaseModalVisible = false;
    this.selectedPlanForPurchase = null;
  }

  async proceedToBuy(planIndex: number) {
    // Legacy method if using old modal
    const plan = this.plans[planIndex];
    await this.purchaseService.buyPlan(plan);
  }

  buyPlan(planIndex: number) {
    this.openConfirmationModal(planIndex);
  }

  // Manual Verify Modal Logic
  isVerifyModalVisible: boolean = false;

  openVerifyModal() {
    this.isVerifyModalVisible = true;
  }

  closeVerifyModal() {
    this.isVerifyModalVisible = false;
  }

  async onVerifyTransaction(hash: string) {
    this.isVerifyModalVisible = false;
    await this.purchaseService.verifyManualTransaction(hash);
  }
}
