import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AuthStaffService } from './auth-staff.service';
import { ApiTags } from '@nestjs/swagger';
import { AuditOperation } from '../common/decorators/audit-operation.decorator';
import { LoginDto } from 'src/users/dto/login.dto';
import { Verify2faDto } from './dto/verify-two-factor.dto';

const logger = new Logger('AuthStaffController');

@ApiTags('Auth Staff')
@Controller('auth/staff')
export class AuthStaffController {
  constructor(private authStaffService: AuthStaffService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @AuditOperation('STAFF_LOGIN')
  async login(@Body() dto: LoginDto) {
    logger.log(`Login attempt for user: ${dto.username}`);
    return this.authStaffService.login(dto.username, dto.password);
  }

  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  @AuditOperation('STAFF_2FA_VERIFY')
  async verify2fa(@Body() dto: Verify2faDto) {
    return this.authStaffService.verify2fa(
      dto.tempToken || dto.token || '',
      dto.code,
    );
  }
}
