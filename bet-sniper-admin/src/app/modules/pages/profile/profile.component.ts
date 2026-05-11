import { Component, OnInit, inject, TemplateRef, ViewChild } from '@angular/core';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { StaffService } from 'src/app/services/staff.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-profile',
  imports: [SharedModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  private staffService = inject(StaffService);
  private modalService = inject(NgbModal);
  private toastService = inject(ToastService);

  username: string = '';
  email: string = '';
  role: string = '';

  // 2FA Properties
  qrCodeUrl: string = '';
  secret: string = '';
  verificationCode: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  modalRef: NgbModalRef | null = null;

  @ViewChild('activate2FAModal') activate2FAModal!: TemplateRef<any>;

  ngOnInit(): void {
    this.loadUserData();
  }

  /**
   * Recupera los datos del usuario logueado desde localStorage
   */
  loadUserData(): void {
    const userData = localStorage.getItem('user');
    // console.log(userData);
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.username = user.username || '';
        this.email = user.email || '';
        this.role = user.role || '';
      } catch (error) {
        console.error('Error al parsear los datos del usuario:', error);
      }
    }
  }

  /**
   * Abre el modal para activar 2FA y carga el QR
   */
  openActivate2FAModal(): void {
    this.verificationCode = '';
    this.errorMessage = '';
    this.loadQRCode();
    this.modalRef = this.modalService.open(this.activate2FAModal, { centered: true });
  }

  /**
   * Carga el código QR desde el servidor
   */
  loadQRCode(): void {
    this.isLoading = true;
    this.staffService.generate2FA().subscribe({
      next: (res) => {
        if (res && res.qrCodeUrl) {
          this.qrCodeUrl = res.qrCodeUrl;
          this.secret = res.secret;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al generar QR:', err);
        this.errorMessage = 'No se pudo generar el código QR. Intente de nuevo.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Activa el 2FA con el código ingresado
   */
  onActivate2FA(): void {
    if (!this.verificationCode || this.verificationCode.length !== 6) {
      this.errorMessage = 'Ingresa un código de 6 dígitos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.staffService.enable2FA(this.verificationCode).subscribe({
      next: (res) => {
        console.log('2FA activado exitosamente');
        this.toastService.success('2FA activado exitosamente');
        this.isLoading = false;
        this.closeModal();
        // Opcional: Recargar datos del usuario si hay algún flag de 2FA
      },
      error: (err) => {
        console.error('Error al activar 2FA:', err);
        this.errorMessage = 'Código inválido. Intenta nuevamente.';
        this.isLoading = false;
      }
    });
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
      this.modalRef = null;
    }
  }
}
