import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TwoFactorAuthService } from 'src/app/core/services/two-factor-auth.service';
import { TokenService } from 'src/app/shared/services/jwt-token.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-activate-2fa-modal',
  templateUrl: './activate-2fa-modal.component.html',
  styleUrls: ['./activate-2fa-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class Activate2faModalComponent implements OnInit {
  verificationCode: string = '';
  qrCodeUrl: string = '';
  secret: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  @Output() close = new EventEmitter<void>();
  @Output() twoFactorActivated = new EventEmitter<void>();

  constructor(
    private twoFactorService: TwoFactorAuthService,
    private tokenService: TokenService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadQRCode();
  }

  loadQRCode(): void {
    this.isLoading = true;

    this.twoFactorService.generate2FA().subscribe({
      next: (response) => {
        this.qrCodeUrl = response.data.qrCodeUrl;
        this.secret = response.data.secret;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al generar QR:', error);
        console.error('Error completo:', JSON.stringify(error));
        this.errorMessage = 'Error al cargar el código QR';
        this.isLoading = false;
      },
    });
  }

  onSubmit(): void {
    const userData = this.tokenService.getPayload();

    if (!this.verificationCode || this.verificationCode.length !== 6) {
      this.errorMessage = 'Ingresa un código de 6 dígitos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.twoFactorService.activate2FA(this.verificationCode).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.toast.success('2FA habilitado exitosamente');
        this.twoFactorActivated.emit();
        this.closeModal();
      },
      error: (error) => {
        console.error('Error al activar 2FA:', error);
        this.errorMessage = 'Código inválido. Intenta nuevamente.';
        this.toast.error('Error al activar 2FA. Verifica el código.');
        this.isLoading = false;
      },
    });
  }

  closeModal(): void {
    this.close.emit();
  }
}
