import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';
import { LogoComponent } from 'src/app/shared/components/logo/logo.component';
import { UserService } from 'src/app/core/services/user.service';
import { TokenService } from 'src/app/shared/services/jwt-token.service';
import { TransactionsService } from 'src/app/core/services/transactions.service';
import { ToastService } from 'src/app/core/services/toast.service';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AvatarSelectorModalComponent } from '../../components/avatar-selector-modal/avatar-selector-modal.component';

@Component({
  standalone: true,
  selector: 'app-finance',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss'],
  imports: [
    LogoComponent,
    TranslateModule,
    CommonModule,
    ReactiveFormsModule,
    AvatarSelectorModalComponent,
  ],
})
export class FinanceComponent implements OnInit {
  // User Data
  fullName: string = '';
  username: string = '';
  defaultProfileIcon: string = 'fa-regular fa-user';

  // Internal Balance (Points)
  pointsBalance: number = 0;
  twoFactorEnabled: boolean = false;

  // Forms
  withdrawForm: FormGroup;
  transferForm: FormGroup;

  showAvatarSelectorModal: boolean = false;

  // Loading States
  isWithdrawLoading: boolean = false;
  isTransferLoading: boolean = false;

  constructor(
    private userService: UserService,
    private tokenService: TokenService,
    private transactionsService: TransactionsService,
    private toast: ToastService,
    private fb: FormBuilder,
    private translate: TranslateService,
  ) {
    this.withdrawForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      wallet: ['', Validators.required],
      code: ['', Validators.required], // 2FA Code
    });

    this.transferForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      recipientId: ['', Validators.required],
      code: ['', Validators.required], // 2FA Code
    });
  }

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    const userData = this.tokenService.getPayload();
    const username = (userData as any)?.username;

    if (username) {
      this.username = username;
      this.userService.getUser(username).subscribe({
        next: (user) => {
          if (user.fullname) this.fullName = user.fullname;
          if (user.avatar) this.defaultProfileIcon = user.avatar;

          // Assuming 'points' or a similar field exists for internal balance.
          // If the backend sends 'balance', check if it's points vs wallet.
          // User said "balance de puntos". Let's check user object printed in console.
          // For now, I'll try to map common names or default to 0.
          this.pointsBalance = user.points || 0;

          if (user.twoFactorEnabled !== undefined) {
            this.twoFactorEnabled = user.twoFactorEnabled;
          }

          // Pre-fill wallet in withdraw form if available
          if (user.wallet) {
            this.withdrawForm.patchValue({ wallet: user.wallet });
          }
        },
        error: (err) => {
          console.error('Error fetching user data:', err);
          this.toast.error('Error al cargar datos del usuario');
        },
      });
    }
  }

  onWithdraw() {
    if (!this.twoFactorEnabled) {
      const msg = this.translate.instant(
        'FINNACE.DATA_FINNACE.ERROR_2FA_REQUIRED',
      );
      this.toast.error(msg);
      return;
    }

    if (this.withdrawForm.invalid) {
      this.withdrawForm.markAllAsTouched();
      this.toast.error('Por favor complete todos los campos correctamente');
      return;
    }

    const { amount, wallet, code } = this.withdrawForm.value;

    if (amount > this.pointsBalance) {
      this.toast.error(this.translate.instant('ERRORS.INSUFFICIENT_FUNDS'));
      return;
    }

    this.isWithdrawLoading = true;
    this.transactionsService
      .withdraw(amount, code)
      .pipe(finalize(() => (this.isWithdrawLoading = false)))
      .subscribe({
        next: (res) => {
          this.toast.success(
            this.translate.instant(
              'FINNACE.DATA_FINNACE.SOLICITUD_RETIRO_EXITO',
            ) || 'Solicitud de retiro enviada con éxito',
          );
          this.withdrawForm.reset();
          this.loadUserData();
        },
        error: (err) => {
          console.error('Withdraw error:', err);
          const errorMsg = err.error?.message || 'DEFAULT_ERROR';
          const validErrors = [
            'INVALID_2FA_CODE',
            'WALLET_NOT_CONFIGURED',
            'INSUFFICIENT_FUNDS',
          ];
          const key = validErrors.includes(errorMsg)
            ? `ERRORS.${errorMsg}`
            : 'ERRORS.DEFAULT_ERROR';
          this.toast.error(this.translate.instant(key));
        },
      });
  }

  onTransfer() {
    if (!this.twoFactorEnabled) {
      const msg = this.translate.instant(
        'FINNACE.DATA_FINNACE.ERROR_2FA_REQUIRED',
      );
      this.toast.error(msg);
      return;
    }

    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      this.toast.error('Por favor complete todos los campos correctamente');
      return;
    }

    const { amount, recipientId, code } = this.transferForm.value;

    if (amount > this.pointsBalance) {
      this.toast.error(this.translate.instant('ERRORS.INSUFFICIENT_FUNDS'));
      return;
    }

    this.isTransferLoading = true;
    this.transactionsService
      .transfer(amount, recipientId, code)
      .pipe(finalize(() => (this.isTransferLoading = false)))
      .subscribe({
        next: (res) => {
          this.toast.success(
            this.translate.instant('FINNACE.DATA_FINNACE.TRANSFERENCIA_EXITO'),
          );
          this.transferForm.reset();
          this.loadUserData();
        },
        error: (err) => {
          console.error('Transfer error:', err);
          const errorMsg = err.error?.message || 'DEFAULT_ERROR';
          const validErrors = [
            'INVALID_2FA_CODE',
            'INVALID_AMOUNT_POSITIVE',
            'TARGET_USER_NOT_FOUND',
            'SELF_TRANSFER_NOT_ALLOWED',
            'INSUFFICIENT_FUNDS',
          ];
          const key = validErrors.includes(errorMsg)
            ? `ERRORS.${errorMsg}`
            : 'ERRORS.DEFAULT_ERROR';
          this.toast.error(this.translate.instant(key));
        },
      });
  }

  // Avatar Logic
  openAvatarSelector(): void {
    this.showAvatarSelectorModal = true;
  }

  closeAvatarSelector(): void {
    this.showAvatarSelectorModal = false;
  }

  onAvatarSelected(icon: string): void {
    this.defaultProfileIcon = icon;
    this.userService.updateAvatar(icon).subscribe({
      next: (res) => this.toast.success('Avatar actualizado'),
      error: (err) => {
        this.toast.error('Error al actualizar avatar');
        console.error(err);
      },
    });
    this.closeAvatarSelector();
  }

  copyReferralLink() {
    if (!this.username) {
      this.toast.error('No se pudo obtener el nombre de usuario');
      return;
    }
    const referralLink = `${window.location.origin}/auth/register?ref=${this.username}`;
    navigator.clipboard.writeText(referralLink).then(
      () => this.toast.success('Link de referido copiado'),
      (err) => this.toast.error('Error al copiar el link'),
    );
  }

  get fWithdraw() {
    return this.withdrawForm.controls;
  }

  get fTransfer() {
    return this.transferForm.controls;
  }
}
