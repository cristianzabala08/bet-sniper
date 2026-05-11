import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  Request,
  Put,
  Patch,
} from '@nestjs/common';
import { AuditOperation } from '../common/decorators/audit-operation.decorator';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { ChangeStaffPasswordDto } from './dto/change-staff-password.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StaffAuthGuard } from '../common/guards/staff-auth.guard';
import { IdempotencyInterceptor } from 'src/common/interceptors/idempotency.interceptor';
import { StaffRoleGuard } from 'src/common/guards/staff-role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { StaffRole } from './schema/staff.schema';

@ApiTags('Staff')
@Controller('staff')
@UseGuards(StaffAuthGuard, StaffRoleGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @ApiBearerAuth()
  @Post()
  @Roles(StaffRole.SUPER_ADMIN)
  @AuditOperation('CREATE_STAFF')
  create(@Body() createStaffDto: CreateStaffDto) {
    // TODO: Obtener ID del creador desde el request
    return this.staffService.create(createStaffDto, 'admin-request');
  }

  @Get()
  @Roles(
    StaffRole.SUPER_ADMIN,
    StaffRole.ADMIN,
    StaffRole.EDITOR,
    StaffRole.READER,
  )
  @ApiBearerAuth()
  @AuditOperation('CREATE_STAFF')
  findAll() {
    return this.staffService.findAll();
  }

  /*  @Post('seed')
  @AuditOperation('SEED_SUPER_ADMIN')
  seed() {
    return this.staffService.seedSuperAdmin();
  } */

  @Get('profile')
  @Roles(
    StaffRole.SUPER_ADMIN,
    StaffRole.ADMIN,
    StaffRole.EDITOR,
    StaffRole.READER,
  )
  getProfile(@Request() req) {
    return req.user;
  }

  @Post('2fa/generate')
  @Roles(StaffRole.SUPER_ADMIN)
  @UseInterceptors(IdempotencyInterceptor)
  @AuditOperation('GENERATE_2FA')
  async generate2fa(@Request() req) {
    const staffId = req.user.sub || req.user._id;
    return this.staffService.generate2FA(staffId);
  }

  @Post('2fa/enable')
  @Roles(StaffRole.SUPER_ADMIN)
  @UseInterceptors(IdempotencyInterceptor)
  async enable2fa(@Request() req, @Body() body: { token: string }) {
    const staffId = req.user.sub || req.user._id;
    return this.staffService.enable2FA(staffId, body.token);
  }

  @Put(':id')
  @Roles(StaffRole.SUPER_ADMIN)
  @AuditOperation('UPDATE_STAFF')
  async update(
    @Param('id') id: string,
    @Body() updateStaffDto: UpdateStaffDto,
    @Request() req,
  ) {
    // Seguridad: Solo Super Admin, Admin o el mismo usuario puede editar
    const requestUser = req.user;
    if (
      requestUser.role !== StaffRole.SUPER_ADMIN &&
      requestUser.role !== StaffRole.ADMIN &&
      requestUser.sub !== id
    ) {
      throw new Error('Unauthorized');
    }
    return this.staffService.update(id, updateStaffDto);
  }

  @Patch(':id/password')
  @Roles(StaffRole.SUPER_ADMIN)
  @AuditOperation('CHANGE_STAFF_PASSWORD')
  async changePassword(
    @Param('id') id: string,
    @Body() changeStaffPasswordDto: ChangeStaffPasswordDto,
    @Request() req,
  ) {
    // Seguridad: Solo Super Admin, Admin o el mismo usuario puede cambiar contraseña
    const requestUser = req.user;
    if (
      requestUser.role !== StaffRole.SUPER_ADMIN &&
      requestUser.role !== StaffRole.ADMIN &&
      requestUser.sub !== id
    ) {
      throw new Error('Unauthorized');
    }
    return this.staffService.changePassword(
      id,
      changeStaffPasswordDto.password,
    );
  }
}
