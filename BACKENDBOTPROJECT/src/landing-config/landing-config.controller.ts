import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LandingConfigService } from './landing-config.service';
import { UpdateLandingConfigDto } from './dto/update-landing-config.dto';
import { StaffAuthGuard } from '../common/guards/staff-auth.guard';
import { StaffRoleGuard } from '../common/guards/staff-role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../staff/schema/staff.schema';
import { AuditOperation } from '../common/decorators/audit-operation.decorator';

@ApiTags('Landing Config')
@Controller('landing-config')
export class LandingConfigController {
  constructor(private readonly configService: LandingConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener configuración del landing page (público)' })
  async getConfig() {
    return this.configService.getConfig();
  }

  @Put()
  @UseGuards(StaffAuthGuard, StaffRoleGuard)
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.ADMIN)
  @ApiBearerAuth()
  @AuditOperation('UPDATE_LANDING_CONFIG')
  @ApiOperation({ summary: 'Actualizar configuración del landing page' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateConfig(@Body() dto: UpdateLandingConfigDto) {
    return this.configService.updateConfig(dto);
  }
}
