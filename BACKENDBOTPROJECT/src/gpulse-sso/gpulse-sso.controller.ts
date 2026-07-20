import {
  Controller,
  Get,
  ServiceUnavailableException,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';

export interface GpulseSsoRedirect {
  redirectUrl: string;
}

/**
 * Botón "Automático" (bet-sniper-pwa) — SSO hacia GPulse.
 *
 * Firma un JWT corto de un solo uso con el secret COMPARTIDO con GPulse
 * (`GPULSE_SSO_SECRET`, distinto del JWT_SECRET propio de login — se pasa
 * por-llamada a `JwtService.sign()`, nunca se toca el JwtModule de
 * AuthModule) y devuelve la URL de destino; el frontend recién ahí abre
 * GPulse en pestaña nueva.
 *
 * Devuelve JSON en vez de hacer el 302 acá mismo: bet-sniper-pwa es una SPA
 * que autentica por Bearer token (no por cookie), así que el navegador tiene
 * que llamar este endpoint autenticado (fetch/XHR) antes de poder navegar.
 *
 * Puerto directo de la misma integración en winx-oracle-pwa/BACKENDBOTPROJECT
 * (repo separado) — misma lógica, mismos guards que ya usa este backend.
 */
@ApiTags('GPulse SSO')
@Controller('gpulse-sso')
export class GpulseSsoController {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getRedirectUrl(@User() user: any): Promise<{ data: GpulseSsoRedirect }> {
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

    // encodeURIComponent + trim: defensivo contra cualquier salto de línea o
    // carácter que necesite percent-encoding colándose en la query string
    // (JWT ya es base64url, no debería tener ninguno, pero esto lo descarta
    // por completo sin costo).
    const redirectUrl = `https://g-pulse.aigenesis.io/auth/partner-sso?token=${encodeURIComponent(token.trim())}`;
    return { data: { redirectUrl } };
  }
}
