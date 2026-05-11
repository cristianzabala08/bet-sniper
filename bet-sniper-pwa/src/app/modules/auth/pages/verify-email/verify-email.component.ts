import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss',
})
export class VerifyEmailComponent implements OnInit {
  verifyForm: FormGroup;
  isLoading = false;
  isResending = false;
  email: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private toast: ToastService
  ) {
    this.verifyForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.email = params['email'] || '';
      if (!this.email) {
        this.toast.error('No se proporcionó un correo electrónico.');
        this.router.navigate(['/auth/login']);
      }
    });
  }

  onSubmit() {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { code } = this.verifyForm.value;

    this.authService.verifyEmail(this.email, code).subscribe({
      next: () => {
        this.isLoading = false;
        this.toast.success(
          '¡Correo verificado exitosamente! Ya puedes iniciar sesión.'
        );
        this.router.navigate(['/auth/login']);
      },
      error: (errString: string) => {
        this.isLoading = false;
        this.toast.error(errString);
      },
    });
  }

  onResend() {

    if (this.isLoading || this.isResending) return;

    this.isResending = true;
    this.authService.resendEmailVerification(this.email).subscribe({
      next: (res: any) => {
        this.isResending = false;
        this.toast.success(
          res.message || 'Código de verificación reenviado exitosamente'
        );
      },
      error: (err: any) => {
        this.isResending = false;
        // Si err es un string (como parece manejarlo el pipe catchError de authService)
        if (typeof err === 'string') {
          this.toast.error(err);
        } else {
          this.toast.error(err.error?.message || 'Error al reenviar el código');
        }
      },
    });
  }
}
