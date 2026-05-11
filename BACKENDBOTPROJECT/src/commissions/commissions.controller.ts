import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import { StaffAuthGuard } from '../common/guards/staff-auth.guard';
import { StaffRoleGuard } from '../common/guards/staff-role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../staff/schema/staff.schema';
import { AuditOperation } from '../common/decorators/audit-operation.decorator';

@ApiTags('Commissions')
@ApiBearerAuth()
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get('admin/all')
  @UseGuards(StaffAuthGuard, StaffRoleGuard)
  @Roles(StaffRole.ADMIN, StaffRole.EDITOR)
  @ApiOperation({ summary: 'Obtener todas las comisiones (Admin)' })
  @AuditOperation('VIEW_ALL_COMMISSIONS')
  async getAllCommissions(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('userId') userId?: string,
  ) {
    const filter: any = {};
    if (userId) {
      filter.receiver_id = userId;
    }

    return this.commissionsService.findAllPaginated(
      filter,
      Number(page),
      Number(limit),
    );
  }
}
