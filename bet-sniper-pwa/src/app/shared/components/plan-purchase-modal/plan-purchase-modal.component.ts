import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  OnChanges,
  SimpleChanges,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Web3Service } from 'src/app/core/services/web3.service';
import {
  PurchaseService,
  PlanDefinition,
} from 'src/app/core/services/purchase.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-plan-purchase-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './plan-purchase-modal.component.html',
  styleUrls: ['./plan-purchase-modal.component.scss'],
})
export class PlanPurchaseModalComponent implements OnChanges {
  @Input() isVisible: boolean = false;
  @Input() plan: PlanDefinition | null = null;
  @Output() close = new EventEmitter<void>();

  private web3Service = inject(Web3Service);
  private purchaseService = inject(PurchaseService);
  private toast = inject(ToastService);

  currentStep = signal<number>(1);
  isLoading = signal<boolean>(false);

  // Step status helpers
  isWalletConnected = this.web3Service.isConnected;

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['isVisible'] && this.isVisible && this.plan) {
      this.resetState();
      await this.checkStatus();
    }
  }

  resetState() {
    this.currentStep.set(1);
    this.isLoading.set(false);
  }

  async checkStatus() {
    if (!this.plan) return;

    this.isLoading.set(true);
    try {
      // Step 1: Check Wallet
      if (!this.web3Service.isConnected()) {
        this.currentStep.set(1);
        this.isLoading.set(false);
        return;
      }

      // Step 2: Check Allowance
      const allowanceStr = await this.web3Service.checkAllowance(
        this.web3Service.PASARELA_ADDRESS
      );

      const price = parseFloat(this.plan.price);
      const allowance = parseFloat(allowanceStr);

      if (allowance < price) {
        this.currentStep.set(2);
      } else {
        this.currentStep.set(3);
      }
    } catch (error) {
      console.error('Error checking status', error);
      this.toast.error('Error verificando estado de la wallet');
    } finally {
      this.isLoading.set(false);
    }
  }

  constructor() {
    effect(() => {
      // Subscribe to signals
      const connected = this.web3Service.isConnected();
      const address = this.web3Service.address();

      // Check if we should re-validate
      // untracked ensures we don't create circular dependencies if checkStatus reads signals
      // although we explicitly read them above to trigger the effect.
      if (this.isVisible && this.plan) {
        // We call checkStatus to update the steps based on new signal state
        this.checkStatus();
      }
    });
  }

  async connectWallet() {
    this.isLoading.set(true);
    try {
      await this.web3Service.connectWallet();
      // Effect will handle the status update when isConnected signal changes
    } catch (error) {
      console.error('Connection error', error);
      this.isLoading.set(false);
    }
  }

  async approveToken() {
    if (!this.plan) return;
    this.isLoading.set(true);
    try {
      await this.web3Service.approveToken(
        this.web3Service.PASARELA_ADDRESS,
        this.plan.price
      );
      this.toast.success('Aprobación exitosa. Ahora puedes comprar.');
      await this.checkStatus();
    } catch (error) {
      console.error('Approval error', error);
      this.toast.error('Error en la aprobación. Intenta de nuevo.');
      this.isLoading.set(false);
    }
  }

  async purchasePlan() {
    if (!this.plan) return;

    // We don't set local isLoading because the purchaseService handles global loading
    // and we might want to close the modal or keep it open?
    // The user requirement says "ultimo paso en el modal el de compra".
    // Usually clicking buy triggers the service which handles the transaction.
    // We can keep the modal open or close it.
    // IF we close it, the service Toast/Loading will show.
    // Let's call the service and then close.

    // Actually, purchaseService.buyPlan is async.
    // If we want to show loading IN the modal, we can.

    this.isLoading.set(true);
    const success = await this.purchaseService.buyPlan(this.plan);
    this.isLoading.set(false);

    if (success) {
      this.onClose();
    }
  }

  onClose() {
    this.close.emit();
  }
}
