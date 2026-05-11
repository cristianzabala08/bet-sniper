import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { RegisterData } from 'src/app/core/models/auth/registerData.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    TranslateModule,
  ],
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {
    this.registerForm = this.fb.group(
      {
        sponsorUsername: [''],

        // 1. Fullname: Solo letras y espacios (Igual que tu DTO)
        fullName: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.pattern(/^[a-zA-Z\s]+$/),
          ],
        ],

        // 2. Username: Alphanumérico (Igual que IsAlphanumeric)
        username: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.pattern(/^[a-zA-Z0-9]+$/),
          ],
        ],

        // 3. Email: Validación estándar
        email: ['', [Validators.required, Validators.email]],
        emailVerify: ['', [Validators.required, Validators.email]],

        // 4. Password: Min 8 caracteres (Tu DTO pide 8, antes tenías 6)
        password: ['', [Validators.required, Validators.minLength(8)]],

        repeatPassword: ['', Validators.required],
        acceptTerms: [false, Validators.requiredTrue],
      },
      { validators: [this.passwordMatchValidator, this.emailMatchValidator] }
    );
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const ref = params['ref'];
      if (ref) {
        this.registerForm.patchValue({
          sponsorUsername: ref,
        });
      }
    });
  }

  // Extraje el validador a un método de clase para mantenerlo limpio
  passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password');
    const repeatPassword = control.get('repeatPassword');

    // Solo validamos si ambos campos tienen valor para no molestar antes de tiempo
    if (!password || !repeatPassword) return null;

    return password.value !== repeatPassword.value
      ? { passwordMismatch: true }
      : null;
  }

  emailMatchValidator(control: AbstractControl) {
    const email = control.get('email');
    const emailVerify = control.get('emailVerify');

    // Solo validamos si ambos campos tienen valor para no molestar antes de tiempo
    if (!email || !emailVerify) return null;

    return email.value !== emailVerify.value ? { emailMismatch: true } : null;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched(); // Esto hará que se iluminen los errores en rojo
      return;
    }

    this.isLoading = true;
    const formData = this.registerForm.value;

    const registerPayload: RegisterData = {
      fullname: formData.fullName,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      acceptTerms: formData.acceptTerms,
    };

    // Solo enviar el referido si tiene contenido real
    if (formData.sponsorUsername && formData.sponsorUsername.trim() !== '') {
      registerPayload.referredBy = formData.sponsorUsername.trim();
    }

    this.authService.register(registerPayload).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/auth/verify-email'], {
          queryParams: { email: formData.email },
        });
        this.toast.success('¡Registro exitoso! Por favor verifica tu correo.');
      },
      error: (errString: string) => {
        this.isLoading = false;
        this.errorMessage = errString;

        // Intentar traducir el error si es una clave conocida
        const translationKey = `ERRORS.${errString}`;
        this.translate.get(translationKey).subscribe({
          next: (translatedMsg) => {
            // Si la traducción devuelve la misma clave, significa que no existe
            // En ese caso, mostramos el mensaje original (fallback)
            const finalMsg =
              translatedMsg !== translationKey ? translatedMsg : errString;
            this.toast.error(finalMsg);
          },
          error: () => {
            this.toast.error(errString);
          },
        });
      },
    });
  }

  // Getter corto para usar 'f.username' en el HTML
  get f() {
    return this.registerForm.controls;
  }

  get passwordMatchError() {
    return (
      this.registerForm.errors?.['passwordMismatch'] &&
      this.registerForm.get('repeatPassword')?.touched
    );
  }

  get emailMatchError() {
    return (
      this.registerForm.errors?.['emailMismatch'] &&
      this.registerForm.get('emailVerify')?.touched
    );
  }
}
