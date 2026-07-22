import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GpulseSsoController } from './gpulse-sso.controller';

@Module({
  // Registro vacío a propósito: el secreto de firma se pasa por-llamada
  // (GPULSE_SSO_SECRET), nunca el JWT_SECRET propio de la app.
  imports: [JwtModule.register({})],
  controllers: [GpulseSsoController],
})
export class GpulseSsoModule {}
