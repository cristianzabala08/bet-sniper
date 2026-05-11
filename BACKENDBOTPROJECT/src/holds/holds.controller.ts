import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { HoldsService } from './holds.service';
import { UpdateHoldDto } from './dto/update-hold.dto';
import { StaffAuthGuard } from '../common/guards/staff-auth.guard';
import { StaffRoleGuard } from '../common/guards/staff-role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../staff/schema/staff.schema';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditOperation } from '../common/decorators/audit-operation.decorator';

@ApiTags('Holds (Admin)')
@ApiTags('Holds (Admin)')
@ApiBearerAuth()
@Controller('holds')
@UseGuards(StaffAuthGuard, StaffRoleGuard)
@Roles(StaffRole.ADMIN, StaffRole.EDITOR)
export class HoldsController {
  constructor(private readonly holdsService: HoldsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los holds (Admin)' })
  findAll() {
    return this.holdsService.findAll();
  }

  @Get('pending')
  @ApiOperation({ summary: 'Listar holds pendientes' })
  findPending() {
    return this.holdsService.findPending();
  }

  @Get('user/:id')
  @ApiOperation({ summary: 'Obtener holds de un usuario específico' })
  @AuditOperation('VIEW_USER_HOLDS')
  async getUserHolds(@Param('id') userId: string) {
    return this.holdsService.findByUser(userId);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Aprobar retiro' })
  @AuditOperation('APPROVE_HOLD')
  approve(@Param('id') id: string) {
    return this.holdsService.approve(id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Rechazar retiro (Refund automático)' })
  @AuditOperation('REJECT_HOLD')
  reject(@Param('id') id: string, @Body() body: UpdateHoldDto) {
    return this.holdsService.reject(id, body.reason);
  }
}
