import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { CommonModule } from '@angular/common';
import { ResponseApis } from 'src/app/core/models/response-pagination.model';
import { UserToken } from 'src/app/core/models/auth/token.model';
import { ToastService } from 'src/app/core/services/toast.service';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationsService } from 'src/app/core/services/notifications.service';
import { LangDropdownComponent } from 'src/app/shared/components/lang-dropdown/lang-dropdown.component';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    LangDropdownComponent,
  ],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  showPassword = false;
  errorMessage: string = '';
  isLoading = false;

  // 🔥 Nuevas variables de estado
  is2faRequired = false;
  tempToken: string = '';

  // ── Luz de cursor sobre el panel (glow que sigue al mouse) ──
  mouseX = 50;
  mouseY = 50;

  private reducedMotion = false;
  private rafId: number | null = null;
  private pendingEvent: MouseEvent | null = null;
  private pendingBox: HTMLElement | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toast: ToastService,
    private notificationsService: NotificationsService,
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      twoFactor: [''],
      rememberMe: [false],
    });
  }

  // 2. Al iniciar, verificamos si hay un usuario guardado
  ngOnInit() {
    const savedUser = localStorage.getItem('rememberedUser');
    if (savedUser) {
      this.loginForm.patchValue({
        username: savedUser,
        rememberMe: true,
      });
    }

    this.reducedMotion =
      typeof window !== 'undefined' &&
      !!window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  ngOnDestroy() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  onBoxMouseMove(event: MouseEvent, box: HTMLElement) {
    if (this.reducedMotion) return;
    this.pendingEvent = event;
    this.pendingBox = box;
    if (this.rafId !== null) return;
    this.rafId = requestAnimationFrame(() => this.applyMouseMove());
  }

  private applyMouseMove() {
    this.rafId = null;
    const event = this.pendingEvent;
    const box = this.pendingBox;
    if (!event || !box) return;

    const rect = box.getBoundingClientRect();
    const ratioX = (event.clientX - rect.left) / rect.width;
    const ratioY = (event.clientY - rect.top) / rect.height;

    this.mouseX = Math.min(100, Math.max(0, ratioX * 100));
    this.mouseY = Math.min(100, Math.max(0, ratioY * 100));
  }

  onBoxMouseLeave() {
    this.mouseX = 50;
    this.mouseY = 50;
  }

  onSubmit() {
    if (
      this.loginForm.controls['username'].invalid ||
      this.loginForm.controls['password'].invalid
    ) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // CASO 1: Si ya nos pidieron 2FA, llamamos al endpoint de verificar
    if (this.is2faRequired) {
      this.verifyTwoFactorCode();
      return;
    }

    // 3. Lógica para guardar o borrar el usuario ANTES de enviar el login
    const { username, rememberMe } = this.loginForm.value;

    if (rememberMe) {
      localStorage.setItem('rememberedUser', username);
    } else {
      localStorage.removeItem('rememberedUser');
    }

    // Continuar con el login normal...
    const credentials = {
      username: username,
      password: this.loginForm.value.password,
    };

    this.authService.login(credentials).subscribe({
      next: (response: ResponseApis<UserToken>) => {
        const data = response.data;

        // ¿El servidor pide 2FA?
        if (data.require2fa) {
          this.is2faRequired = true;
          this.tempToken = data.token; // Guardamos el token temporal
          this.isLoading = false;

          // Hacemos el campo de 2FA obligatorio dinámicamente
          this.loginForm.controls['twoFactor'].setValidators([
            Validators.required,
            Validators.minLength(6),
          ]);
          this.loginForm.controls['twoFactor'].updateValueAndValidity();

          // Opcional: Enfocar el input de 2FA o limpiar el password por seguridad
          this.loginForm.controls['password'].disable(); // Deshabilitar password para que no lo editen
        } else {
          // Login exitoso directo (usuario sin 2FA)
          this.handleSuccessLogin(data.token);
        }
      },
      error: (err) => {
        this.handleError(err);
      },
    });
  }

  // Método separado para el segundo endpoint
  verifyTwoFactorCode() {
    const code = this.loginForm.value.twoFactor;

    // Llamada al servicio que conecta con 'auth/verify-2fa'
    // Nota: Debes crear este método verify2fa en tu AuthService de Angular
    this.authService.verify2fa(this.tempToken, code).subscribe({
      next: (response: any) => {
        this.handleSuccessLogin(response.data.token);
      },
      error: (err: any) => {
        this.errorMessage = 'Código 2FA incorrecto';
        this.isLoading = false;
        this.handleError(err);
      },
    });
  }

  handleSuccessLogin(token: string) {
    this.notificationsService
      .createNotification('Ha hecho Login en el sistema')
      .subscribe({
        next: () => console.log('Login notification created'),
        error: (e) => console.error('Failed to create login notification', e),
      });
    this.isLoading = false;
    this.router.navigate(['/app/dashboard']);
  }

  handleError(err: any) {
    console.error('Error', err);
    this.isLoading = false;

    // Redirigir si el email no está verificado
    if (err.error?.message === 'EMAIL_NOT_VERIFIED') {
      const email = err.error.email;
      this.toast.showError('Debes verificar tu correo antes de entrar.');
      this.router.navigate(['/auth/verify-email'], { queryParams: { email } });
      return;
    }

    this.errorMessage =
      err.error?.message || 'Usuario o contraseña incorrectos';
    this.toast.error(this.errorMessage);
  }
}
