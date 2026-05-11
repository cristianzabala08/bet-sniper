import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LogoComponent } from 'src/app/shared/components/logo/logo.component';
import { TokenService } from 'src/app/shared/services/jwt-token.service';
import { SupportService } from 'src/app/core/services/support.service';
import { SupportMessageCreate } from 'src/app/core/models/support/support-message.model';
import { environment } from 'src/environments/environment';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  standalone: true,
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, LogoComponent, TranslateModule],
})
export class ContactComponent {
  supportForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dataUser: TokenService,
    private supportService: SupportService,
    private toast: ToastService,
  ) {
    this.supportForm = this.fb.group({
      subject: ['', [Validators.required]],
      message: ['', [Validators.required]],
    });
  }

  get f() {
    //se usa en html para validar los campos getter
    return this.supportForm.controls;
  }

  sendMessageSupport(): void {
    if (this.supportForm.invalid) {
      this.supportForm.markAllAsTouched();
      return;
    }

    const { subject, message } = this.supportForm.value;
    const to: string = environment.emailSupport;
    const userId = this.dataUser.getPayload()?.sub;
    if (!userId) {
      return;
    }

    const payload: SupportMessageCreate = {
      to,
      subject,
      message,
      userId,
    };

    this.supportService.createMessage(payload).subscribe({
      next: () => {
        this.toast.success('Mensaje enviado correctamente');
        this.supportForm.reset();
      },
      error: () => {
        this.toast.error('Error al enviar el mensaje');
      },
    });
  }
}
