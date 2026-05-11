import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }

  async sendPasswordReset(email: string, token: string) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    const url = `${frontendUrl}/reset-password?token=${token}`;
    const from =
      this.configService.get<string>('SMTP_FROM') ||
      'No Reply <noreply@example.com>';

    try {
      const { data, error } = await this.resend.emails.send({
        from,
        to: email,
        subject: 'Recuperación de Contraseña',
        html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4CAF50;">Recupera tu contraseña</h2>
            <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
            <p>Haz clic en el siguiente botón para continuar:</p>
            <a href="${url}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>
            <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
            <p>Este enlace expirará en 1 hora.</p>
        </div>
        `,
      });

      if (error) {
        console.error('Resend error (Password Reset):', error);
      } else {
        console.log('Resend success (Password Reset). ID:', data?.id);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      throw new InternalServerErrorException(
        'Error enviando el correo de recuperación',
      );
    }
  }

  async sendEmailSupport(
    to: string,
    subject: string,
    message: string,
    fromUserId?: string,
    supportMessageId?: string,
  ) {
    const from =
      this.configService.get<string>('SMTP_FROM') ||
      'No Reply <noreply@example.com>';

    try {
      await this.resend.emails.send({
        from,
        to,
        subject: `Soporte - ${subject}`,
        html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4CAF50;">Solicitud recibida</h2>
          <p>Hemos recibido tu mensaje de soporte y fue guardado correctamente.</p>
          ${supportMessageId ? `<p><strong>ID:</strong> ${supportMessageId}</p>` : ''}
          ${fromUserId ? `<p><strong>Usuario:</strong> ${fromUserId}</p>` : ''}
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <p><strong>Asunto:</strong> ${subject}</p>
          <p><strong>Mensaje:</strong></p>
          <div style="white-space: pre-wrap; background: #f7f7f7; padding: 12px; border-radius: 6px;">${message}</div>
          <p style="margin-top: 16px;">Nuestro equipo lo revisará y te responderá lo antes posible.</p>
        </div>
        `,
      });
      console.log(`Support email sent to ${to} via Resend`);
    } catch (error) {
      console.error('Error sending support email:', error);
      throw new InternalServerErrorException(
        'Error enviando el correo de confirmación de soporte',
      );
    }
  }

  async sendEmailVerification(email: string, code: string) {
    const from =
      this.configService.get<string>('SMTP_FROM') || 'soporte@tudominio.com';

    try {
      const { data, error } = await this.resend.emails.send({
        from: from,
        to: email,
        subject: 'Verifica tu Correo Electrónico',
        html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4CAF50; text-align: center;">Verifica tu Cuenta</h2>
            <p>Gracias por registrarte. Para completar tu registro, por favor usa el siguiente código de verificación:</p>
            <div style="background-color: #f7f7f7; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0; color: #4CAF50;">
                ${code}
            </div>
            <p>Este código expirará en 24 horas.</p>
        </div>
        `,
      });

      if (error) {
        console.error('Resend error (Email Verification):', error);
      } else {
        console.log(`Verification email sent to ${email} via Resend. ID:`, data?.id);
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new InternalServerErrorException(
        'Error enviando el correo de verificación',
      );
    }
  }

  async sendWelcome(email: string, fullname: string) {
    try {
      await this.resend.emails.send({
        from:
          this.configService.get<string>('SMTP_FROM') ||
          'No Reply <noreply@example.com>',
        to: email,
        subject: '¡Bienvenido a la Plataforma!',
        html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4CAF50;">Hola, ${fullname}</h2>
            <p>Gracias por registrarte en nuestra plataforma. Estamos emocionados de tenerte con nosotros.</p>
            <p>Si tienes alguna pregunta, no dudes en contactar a nuestro soporte.</p>
            <p style="margin-top: 20px;">Atentamente,<br>El equipo</p>
        </div>
        `,
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  }

  async sendLoginAlert(
    email: string,
    fullname: string,
    ip: string,
    device: string,
  ) {
    try {
      await this.resend.emails.send({
        from:
          this.configService.get<string>('SMTP_FROM') ||
          'No Reply <noreply@example.com>',
        to: email,
        subject: 'Alerta de Inicio de Sesión',
        html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #ff9800;">Nuevo inicio de sesión detectado</h2>
            <p>Hola ${fullname},</p>
            <p>Se ha detectado un nuevo inicio de sesión en tu cuenta.</p>
            <ul>
              <li><strong>Fecha:</strong> ${new Date().toLocaleString()}</li>
              <li><strong>IP:</strong> ${ip}</li>
              <li><strong>Dispositivo:</strong> ${device}</li>
            </ul>
            <p>Si no fuiste tú, por favor cambia tu contraseña inmediatamente y contacta al soporte.</p>
        </div>
        `,
      });
    } catch (error) {
      console.error('Error sending login alert:', error);
    }
  }

  async sendWalletUpdateAlert(
    email: string,
    fullname: string,
    newWallet: string,
  ) {
    try {
      await this.resend.emails.send({
        from:
          this.configService.get<string>('SMTP_FROM') ||
          'No Reply <noreply@example.com>',
        to: email,
        subject: 'Actualización de Wallet',
        html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2196F3;">Tu wallet ha sido actualizada</h2>
            <p>Hola ${fullname},</p>
            <p>Te informamos que la dirección de tu wallet ha sido actualizada correctamente.</p>
            <p><strong>Nueva Wallet:</strong> ${newWallet}</p>
            <p>Si no realizaste este cambio, por favor contacta al soporte inmediatamente.</p>
        </div>
        `,
      });
    } catch (error) {
      console.error('Error sending wallet update alert:', error);
    }
  }

  async send2FAEnabledAlert(email: string, fullname: string) {
    try {
      await this.resend.emails.send({
        from:
          this.configService.get<string>('SMTP_FROM') ||
          'No Reply <noreply@example.com>',
        to: email,
        subject: 'Seguridad 2FA Activada',
        html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4CAF50;">Autenticación de Dos Factores Activada</h2>
            <p>Hola ${fullname},</p>
            <p>La autenticación de dos factores (2FA) ha sido activada exitosamente en tu cuenta.</p>
            <p>Ahora tu cuenta está más segura.</p>
        </div>
        `,
      });
    } catch (error) {
      console.error('Error sending 2FA alert:', error);
    }
  }

  async sendPasswordChangedAlert(email: string, fullname: string) {
    try {
      await this.resend.emails.send({
        from:
          this.configService.get<string>('SMTP_FROM') ||
          'No Reply <noreply@example.com>',
        to: email,
        subject: 'Tu contraseña ha sido cambiada',
        html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #F44336;">Cambio de Contraseña Detectado</h2>
            <p>Hola ${fullname},</p>
            <p>Te informamos que la contraseña de tu cuenta ha sido modificada recientemente.</p>
            <p>Si fuiste tú, puedes ignorar este correo.</p>
            <p><strong>¿No fuiste tú?</strong> Contacta a soporte inmediatamente.</p>
        </div>
        `,
      });
    } catch (error) {
      console.error('Error sending password change alert:', error);
    }
  }
}
