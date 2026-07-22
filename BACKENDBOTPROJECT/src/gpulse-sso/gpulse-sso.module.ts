import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GpulseSsoController } from './gpulse-sso.controller';

@Module({
  // Sin secret/opciones por defecto: el controller firma con GPULSE_SSO_SECRET
  // por-llamada (`sign(payload, { secret, ... })`), nunca con el JWT_SECRET
  // propio del login (ese vive en AuthModule, no se toca acá).
  imports: [JwtModule.register({})],
  controllers: [GpulseSsoController],
})
export class GpulseSsoModule {}
