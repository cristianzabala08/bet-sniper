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
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  recoveryForm: FormGroup;
  isLoading = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private toast: ToastService,
  ) {
    this.recoveryForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      token: ['', Validators.required], // Campo oculto para el token
    });
  }

  ngOnInit() {
    // Capturar el token de los query params
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      if (token) {
        this.recoveryForm.patchValue({ token });
      } else {
        // Si no hay token, redirigir o mostrar error
        this.toast.error('Token de recuperación no válido');
        this.router.navigate(['/auth/forgot-password']);
      }
    });
  }

  onSubmit() {
    if (this.recoveryForm.invalid) {
      this.recoveryForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { newPassword, token } = this.recoveryForm.value;

    // Aquí llamarías a tu servicio para resetear la contraseña
    this.authService.resetPassword(token, newPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.toast.success('Contraseña restablecida exitosamente');
        this.router.navigate(['/auth/login']);
      },
      error: (errString: string) => {
        this.isLoading = false;
        this.errorMessage = errString;
        this.toast.error(this.errorMessage);
      },
    });
  }
}
