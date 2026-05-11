import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LoginDto } from 'src/users/dto/login.dto';
import { ResponseApis } from 'src/models/response-pagination.model';
import { UserToken } from 'src/models/token.model';
import { Verify2faDto } from './dto/verify-two-factor.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/password-recovery.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.email, dto.code);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationCode(dto.email);
  }


  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Request() req,
  ): Promise<ResponseApis<UserToken>> {
    const ip = req.ip || req.connection.remoteAddress || 'Unknown IP';
    const device = req.headers['user-agent'] || 'Unknown Device';

    const tokens = await this.authService.login(
      dto.username,
      dto.password,
      ip,
      device,
    );
    return {
      data: tokens, // Aquí envuelves el resultado en 'data'
    };
  }

  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  async verify2fa(@Body() dto: Verify2faDto): Promise<ResponseApis<UserToken>> {
    const tokenToVerify = dto.tempToken || dto.token;
    if (!tokenToVerify) {
      throw new BadRequestException('Token is required (tempToken or token)');
    }

    const result = await this.authService.verifyTwoFactor(
      tokenToVerify,
      dto.code,
    );
    return { data: result };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('update-avatar')
  @HttpCode(HttpStatus.OK)
  async updateAvatar(@Request() req, @Body() dto: UpdateAvatarDto) {
    // req.user viene del JwtStrategy via JwtAuthGuard
    // req.user.sub es el ID del usuario según auth.service.ts
    return this.authService.updateAvatar(req.user.sub, dto.avatar);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('change-password')
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      req.user.sub,
      changePasswordDto.password,
    );
  }
}
