import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { StaffJwtStrategy } from './strategies/staff-jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StaffModule } from '../staff/staff.module';
import { AuthStaffService } from './auth-staff.service';
import { AuthStaffController } from './auth-staff.controller';

@Module({
  imports: [
    UsersModule,
    StaffModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          // 🔥 convertir "7d" a segundos: 7 días * 24h * 3600 = 604800
          expiresIn: 604800,
        },
      }),
      inject: [ConfigService],
    }),
  ],

  providers: [AuthService, JwtStrategy, AuthStaffService, StaffJwtStrategy],
  controllers: [AuthController, AuthStaffController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
