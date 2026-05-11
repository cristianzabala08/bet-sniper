import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { StatusMessage } from 'src/common/status-message.enum';
import { authenticator } from 'otplib';
import { MailService } from '../mail/mail.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(data: CreateUserDto) {
    // 1. Desestructuramos datos. Nota: wallet puede venir undefined
    let { fullname, username, email, password, referredBy, acceptTerms } = data;

    // 2. Normalización básica
    username = username.toLowerCase().trim();
    email = email.toLowerCase().trim();

    if (referredBy) {
      referredBy = referredBy.toLowerCase().trim();
    }

    // 3. Verificar si username existe
    const usernameExists = await this.usersService.findOne(username);
    if (usernameExists) {
      throw new BadRequestException({
        message: StatusMessage.USER_ALREADY_EXISTS,
        detail: 'Username already exists',
      });
    }

    // 4. Verificar si email existe
    const emailExists = await this.usersService.findByEmail(email);
    if (emailExists) {
      throw new BadRequestException({
        message: StatusMessage.EMAIL_ALREADY_EXISTS,
        detail: 'Email already exists',
      });
    }

    let validReferredBy: string | null = null;
    let validSponsorId: string | null = null;

    if (referredBy) {
      // Regex simple para validar formato email
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(referredBy);

      // Buscamos al patrocinador dinámicamente
      const refUser = isEmail
        ? await this.usersService.findByEmail(referredBy) // Buscar por Email
        : await this.usersService.findOne(referredBy); // Buscar por Username

      if (!refUser) {
        throw new BadRequestException({
          message: StatusMessage.USER_NOT_FOUND,
          detail: isEmail
            ? 'No existe ningún usuario con ese correo de referido'
            : 'El usuario referido no existe',
        });
      }

      // IMPORTANTE: Aunque busquemos por email, guardamos el username del sponsor
      // para mantener la consistencia en la base de datos.
      validReferredBy = refUser.username;
      validSponsorId = refUser._id.toString();

      // Registrar la relación en el servicio de usuarios
      await this.usersService.addReferral(refUser.username, username);
    }

    // 6. Hash contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7. Generar código de verificación (6 dígitos)
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // 8. Crear usuario
    const newUser = await this.usersService.create({
      fullname,
      username,
      email,
      password: hashedPassword,
      referredBy: validReferredBy, // Guardamos el username validado del sponsor
      created: Date.now(),
      acceptTerms,
      sponsor_id: validSponsorId,
      emailVerificationCode: verificationCode,
      emailVerificationExpires: verificationExpires,
      isEmailVerified: false,
    });

    // 8b. Enviar correo de bienvenida (Await para evitar condiciones de carrera, aunque falle no bloquea registro critico si el metodo captura su error)
    await this.mailService.sendWelcome(email, fullname);

    // 9. Enviar correo de verificación
    try {
      await this.mailService.sendEmailVerification(email, verificationCode);
    } catch (e) {
      // Logueamos el error completo para debug
      console.error(
        'CRITICAL: Error sending verification email during registration',
        {
          error: e.message,
          stack: e.stack,
          email,
        },
      );
      // No lanzamos excepción para no revertir la creación del usuario,
      // pero el usuario no podrá verificar sin reenviar el correo.
    }

    return { message: StatusMessage.SUCCESS };
  }

  async login(
    identifier: string,
    password: string,
    ip: string = 'N/A',
    device: string = 'N/A',
  ) {
    identifier = identifier.toLowerCase().trim();

    // 🔍 Detectar si es email usando regex
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    // 🔥 Buscar usuario según sea email o username
    const user = isEmail
      ? await this.usersService.findByEmail(identifier)
      : await this.usersService.findOne(identifier);

    if (!user) {
      throw new UnauthorizedException('user not found');
    }

    if (!user.activated) {
      throw new UnauthorizedException('user inactivated');
    }

    // 🔐 Validar contraseña
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Contraseña incorrecta');

    if (!user.isEmailVerified) {
      throw new UnauthorizedException({
        message: 'EMAIL_NOT_VERIFIED',
        email: user.email,
      });
    }

    // Enviar alerta de login
    this.mailService.sendLoginAlert(user.email, user.fullname, ip, device);

    const payload = {
      username: user.username,
      email: user.email,
      wallet: user.wallet,
      sub: user._id,
      role: user.usertype,
      sessionId: uuidv4(), // 🔥 Generar Session ID
    };

    // 🔥 Guardar Session ID en DB
    await this.usersService.updateLoginSessionId(
      user._id.toString(),
      payload.sessionId,
    );

    if (user.twoFactorEnabled) {
      const tempPayload = {
        sub: user._id,
        is2faFlow: true, // Bandera para saber que es un token de pre-auth
      };

      const tempToken = this.jwtService.sign(tempPayload, { expiresIn: '5m' });

      return {
        require2fa: true,
        token: tempToken,
      };
    }

    const token = this.jwtService.sign(payload);
    return {
      token,
      require2fa: false,
    };
  }

  // 2. Nuevo método para validar el código
  async verifyTwoFactor(token: string, code: string) {
    try {
      // Verificar que el token temporal sea válido
      let payload;

      try {
        // Limpieza profunda: Quitar 'Bearer', espacios y COMILLAS dobles
        const cleanToken = token
          .replace('Bearer ', '')
          .replace(/"/g, '') // Elimina comillas si vienen en el string
          .trim();

        // Intentar verificar
        payload = this.jwtService.verify(cleanToken);
      } catch (jwtError) {
        console.error('Error Técnico JWT:', jwtError.message);
        console.error('Error Name:', jwtError.name);
        console.error('JWT_SECRET Loaded?', !!process.env.JWT_SECRET);

        throw new UnauthorizedException(
          `Token de sesión 2FA inválido o expirado. Detalle: ${jwtError.message}`,
        );
      }

      if (!payload.is2faFlow) {
        throw new UnauthorizedException('Token inválido para 2FA');
      }

      const user = await this.usersService.findOneByIdWithSecret(payload.sub);

      if (!user) {
        throw new UnauthorizedException(
          'El usuario ya no existe en la base de datos',
        );
      }

      if (!user.twoFactorSecret) {
        // Cambia el mensaje para saber qué falló realmente
        throw new UnauthorizedException(
          'El usuario no tiene el 2FA configurado',
        );
      }
      // Validar el código contra el secreto del usuario
      const isValid = authenticator.verify({
        token: code,
        secret: user.twoFactorSecret,
      });

      if (!isValid) {
        throw new NotFoundException('Código 2FA inválido');
      }

      // Si es válido, retornamos el token real
      return await this.generateFinalToken(user);
    } catch (error) {
      console.log(error);

      throw new UnauthorizedException('Token expirado o inválido');
    }
  }

  // Método auxiliar para generar el token final
  private async generateFinalToken(user: any) {
    const payload = {
      username: user.username,
      email: user.email,
      wallet: user.wallet,
      sub: user._id,
      role: user.usertype,
      sessionId: uuidv4(), // 🔥 Generar Session ID
    };

    // 🔥 Guardar Session ID en DB
    await this.usersService.updateLoginSessionId(
      user._id.toString(),
      payload.sessionId,
    );

    return {
      token: this.jwtService.sign(payload),
      require2fa: false,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('El correo ingresado no está registrado.');
    }

    // Generar token aleatorio
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetTokenHash = require('crypto')
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await this.usersService.setResetToken(
      user._id as any,
      resetTokenHash,
      expires,
    );

    // Enviar correo (en background, no bloqueante)
    // Importante: Enviar el token SIN hashear al correo
    try {
      await this.mailService.sendPasswordReset(user.email, resetToken);
    } catch (e) {
      console.error('Error sending email', e);
    }

    return { message: 'Si el correo existe, se ha enviado un enlace.' };
  }

  async resetPassword(token: string, newPass: string) {
    // Hashear el token que llega para compararlo con el de la BD
    const resetTokenHash = require('crypto')
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await this.usersService.findByResetToken(resetTokenHash);

    if (!user) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);
    await this.usersService.updatePassword(user._id as any, hashedPassword);

    // Enviar alerta de cambio de contraseña
    this.mailService.sendPasswordChangedAlert(user.email, user.fullname);

    return { message: 'Contraseña actualizada correctamente' };
  }

  async updateAvatar(userId: string, avatar: string) {
    await this.usersService.updateAvatar(userId, avatar);
    return { message: 'Avatar actualizado correctamente' };
  }

  async changePassword(userId: string, newPlainPassword: string) {
    const hashedPassword = await bcrypt.hash(newPlainPassword, 10);
    await this.usersService.updatePassword(userId, hashedPassword);

    // Recuperar usuario para obtener email/nombre (Si req.user no tiene email, habría que buscarlo)
    // Asumimos que userId es válido. Para enviar email necesitamos el objeto usuario.
    const user = await this.usersService.findById(userId);
    if (user) {
      this.mailService.sendPasswordChangedAlert(user.email, user.fullname);
    }

    return {
      message: 'Contraseña actualizada correctamente',
      success: true,
    };
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (user.isEmailVerified) {
      return { message: 'El correo electrónico ya ha sido verificado' };
    }

    if (user.emailVerificationCode !== code) {
      throw new BadRequestException('Código de verificación inválido');
    }

    if (
      user.emailVerificationExpires &&
      new Date() > user.emailVerificationExpires
    ) {
      throw new BadRequestException('El código de verificación ha expirado');
    }

    await this.usersService.markEmailAsVerified(user._id.toString());
  }

  async resendVerificationCode(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException(
        'El correo electrónico ya ha sido verificado',
      );
    }

    // Generar nuevo código de verificación (6 dígitos)
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Actualizar usuario en la BD
    await this.usersService.setEmailVerificationCode(
      user._id.toString(),
      verificationCode,
      verificationExpires,
    );

    // Enviar correo de verificación
    try {
      await this.mailService.sendEmailVerification(email, verificationCode);
    } catch (e) {
      console.error('Error sending verification email during resend', e);
      throw new BadRequestException(
        'No se pudo enviar el correo de verificación',
      );
    }

    return { message: 'Código de verificación enviado exitosamente' };
  }
}
