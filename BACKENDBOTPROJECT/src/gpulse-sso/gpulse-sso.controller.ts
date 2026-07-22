import * as crypto from 'crypto';
import {
  Controller,
  Get,
  ServiceUnavailableException,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';

interface GpulseSsoRedirect {
  redirectUrl: string;
}

/**
 * Entrega al usuario ya autenticado hacia GPulse (Modo Automático real)
 * vía un token firmado de un solo uso, igual que el flujo ya usado en
 * Winx — el SPA usa auth por Bearer token (no cookies), así que un
 * <a href> plano no puede llevar el header; por eso se pide primero la
 * URL firmada y luego se navega.
 */
@Controller('gpulse-sso')
export class GpulseSsoController {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getRedirectUrl(
    @User() user: any,
  ): Promise<{ data: GpulseSsoRedirect }> {
    if (!user?.wallet) {
      throw new UnprocessableEntityException(
        'Necesitás una wallet vinculada a tu cuenta para usar el modo automático.',
      );
    }

    const secret = this.configService.get<string>('GPULSE_SSO_SECRET');
    if (!secret) {
      throw new ServiceUnavailableException('GPulse SSO no está configurado.');
    }

    const partnerId = this.configService.get<string>('GPULSE_SSO_PARTNER_ID') || '';
    const expiresInSec = Math.max(
      60,
      Math.min(300, Number(this.configService.get('GPULSE_SSO_EXPIRES_SEC') ?? 180)),
    );

    const token = this.jwtService.sign(
      {
        email: user.email,
        username: user.username,
        wallet: user.wallet,
        jti: crypto.randomUUID(),
      },
      { secret, algorithm: 'HS256', issuer: partnerId, expiresIn: expiresInSec },
    );

    const redirectUrl = `https://g-pulse.aigenesis.io/auth/partner-sso?token=${encodeURIComponent(token.trim())}`;
    return { data: { redirectUrl } };
  }
}
