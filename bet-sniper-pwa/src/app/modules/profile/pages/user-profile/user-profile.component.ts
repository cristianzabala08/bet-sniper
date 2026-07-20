import { Component, effect } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { LogoComponent } from 'src/app/shared/components/logo/logo.component';
import { Activate2faModalComponent } from '../../components/activate-2fa-modal/activate-2fa-modal.component';
import { AvatarSelectorModalComponent } from '../../components/avatar-selector-modal/avatar-selector-modal.component';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { TokenService } from 'src/app/shared/services/jwt-token.service';
import { UserService } from 'src/app/core/services/user.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Router } from '@angular/router';
import { Web3Service } from 'src/app/core/services/web3.service';
// Imports for modal components

@Component({
  standalone: true,
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  imports: [
    LogoComponent,
    TranslateModule,
    Activate2faModalComponent,
    AvatarSelectorModalComponent,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
})
export class UserProfileComponent {
  // Control para mostrar/ocultar el modal
  showActivate2FAModal: boolean = false;
  defaultProfileIcon: string = 'fa-regular fa-user';

  fullName: string = '';
  username: string = '';
  email: string = '';
  twoFactorEnabled: boolean = false;

  // Web3 State
  walletAddress: string | null = null;
  currentBackendWallet: string | null = null; // To track backend state
  isWalletConnected: boolean = false;
  usdtBalance: string = '0';
  displayId: string = '';

  passwordForm: FormGroup;

  constructor(
    private tokenService: TokenService,
    private userService: UserService,
    private toast: ToastService,
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private web3Service: Web3Service,
  ) {
    this.passwordForm = this.fb.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmNewPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator },
    );

    // Web3 Effect for Signals
    effect(() => {
      const connected = this.web3Service.isConnected();
      this.isWalletConnected = connected;

      const address = this.web3Service.address();
      this.walletAddress = address;

      if (connected && address) {
        this.loadWalletDetails();

        // Check if we need to sync with backend
        // Only sync if we have loaded user data (to avoid overwriting with null on init race)
        // OR if we assume loadUserData is fast enough.
        // Safer: Check if address is different from currentBackendWallet
        if (
          this.currentBackendWallet !== null &&
          address.toLowerCase() !== this.currentBackendWallet.toLowerCase()
        ) {
          this.updateUserWallet(address);
        }
      }
    });
  }

  ngOnInit() {
    this.loadUserData();
  }

  loadWalletDetails() {
    this.web3Service
      .getUSDTBalance()
      .then((balance) => {
        this.usdtBalance = balance;
      })
      .catch((err) => {
        console.error('Error fetching balance:', err);
      });
  }

  loadUserData() {
    const userData = this.tokenService.getPayload();
    const username = (userData as any)?.username;

    if (username) {
      this.username = username;
      this.userService.getUser(username).subscribe({
        next: (user) => {
          if (user.avatar) {
            this.defaultProfileIcon = user.avatar;
          }

          if (user.fullname) {
            this.fullName = user.fullname;
          }
          if (user.email) {
            this.email = user.email;
          }

          // Generate Display ID from _id
          const userId = user._id || user.id;
          if (userId) {
            const shortId = userId.substring(userId.length - 6).toUpperCase();
            this.displayId = `USER-${shortId}`;
          }

          // Initialize currentBackendWallet
          if (user.wallet) {
            this.currentBackendWallet = user.wallet;
            // Trigger check in case wallet was already connected before user data loaded
            const address = this.web3Service.address();
            if (
              this.isWalletConnected &&
              address &&
              address.toLowerCase() !== this.currentBackendWallet?.toLowerCase()
            ) {
              this.updateUserWallet(address);
            }
          } else {
            this.currentBackendWallet = ''; // Mark as loaded but empty
            // If connected, sync immediately
            const address = this.web3Service.address();
            if (this.isWalletConnected && address) {
              this.updateUserWallet(address);
            }
          }

          // Check if 2FA is enabled
          if (user.twoFactorEnabled !== undefined) {
            this.twoFactorEnabled = user.twoFactorEnabled;
          }
        },
        error: (err) => {
          console.error('Error al obtener datos del usuario:', err);
          this.toast.error('Error al cargar datos del usuario');
        },
      });
    }
  }

  updateUserWallet(wallet: string) {
    this.userService.updateWallet(wallet).subscribe({
      next: (res: any) => {
        this.currentBackendWallet = wallet;
        const newToken = res?.token;
        if (newToken) this.tokenService.saveToken(newToken);
        this.toast.success('Wallet actualizada correctamente');
      },
      error: (err) => {
        console.error('Error updating wallet:', err);
        if (err.error && err.error.message) {
          // Display backend error message (e.g., "Ese wallet ya está registrado...")
          this.toast.error(err.error.message);
        } else {
          this.toast.error('Error al actualizar la wallet');
        }
      },
    });
  }

  onTwoFactorActivated(): void {
    this.loadUserData();
  }

  onActivate2FA(): void {
    this.showActivate2FAModal = true;
  }

  // --- Logic for Avatar Selector ---
  showAvatarSelectorModal: boolean = false;

  openAvatarSelector(): void {
    this.showAvatarSelectorModal = true;
  }

  closeAvatarSelector(): void {
    this.showAvatarSelectorModal = false;
  }

  onAvatarSelected(icon: string): void {
    this.defaultProfileIcon = icon; // Actualización optimista

    this.userService.updateAvatar(icon).subscribe({
      next: (res) => {
        this.toast.success('Avatar actualizado exitosamente');
      },
      error: (err) => {
        this.toast.error('Error al actualizar avatar');
        console.error('Error al actualizar avatar:', err);
        // Revertir cambio si falla (opcional)
        // this.defaultProfileIcon = 'fa-regular fa-user';
      },
    });

    this.closeAvatarSelector();
  }

  closeActivate2FAModal(): void {
    this.showActivate2FAModal = false;
  }

  passwordMatchValidator(control: AbstractControl) {
    const password = control.get('newPassword');
    const confirmPassword = control.get('confirmNewPassword');

    if (!password || !confirmPassword) return null;

    return password.value !== confirmPassword.value
      ? { passwordMismatch: true }
      : null;
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.toast.error('Por favor corrija los errores en el formulario');
      return;
    }

    const { newPassword } = this.passwordForm.value;

    this.userService.updatePassword(newPassword).subscribe({
      next: (res) => {
        this.toast.success(
          'Contraseña actualizada exitosamente. Por favor inicie sesión nuevamente.',
        );
        this.passwordForm.reset();
        this.authService.logout();
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.toast.error('Error al actualizar la contraseña');
        console.error('Password update error:', err);
      },
    });
  }

  get f() {
    return this.passwordForm.controls;
  }

  get passwordMatchError() {
    return (
      this.passwordForm.errors?.['passwordMismatch'] &&
      this.passwordForm.get('confirmNewPassword')?.touched
    );
  }

  async connectWallet() {
    try {
      await this.web3Service.connectWallet();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      this.toast.error('Error al conectar la billetera');
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
