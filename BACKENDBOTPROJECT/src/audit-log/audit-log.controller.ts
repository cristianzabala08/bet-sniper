import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ResponsePagintationDto } from '../common/dto/responseApisDto';
import { AuditLog } from './schema/audit-log.schema';
import { StaffAuthGuard } from '../common/guards/staff-auth.guard';
import { StaffRoleGuard } from '../common/guards/staff-role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../staff/schema/staff.schema';

@ApiTags('Audit & Analytics')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(StaffAuthGuard, StaffRoleGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  // --- GET: LOGS DE OPERACIONES ---
  @Get('logs')
  @Roles(StaffRole.ADMIN) // Solo el Super Admin debería ver esto (o ADMIN según tu enum)
  async findAllLogs(
    @Query() paginationDto: PaginationDto,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('module') module?: string,
  ): Promise<ResponsePagintationDto<AuditLog[]>> {
    // Construir filtro dinámico
    const filter: any = {};
    if (userId) filter.performedBy = userId;
    if (action) filter.action = action;
    if (module) filter.module = module;

    // Llamamos al servicio que tiene la lógica page * limit
    const res = await this.auditLogService.findByPagination(
      paginationDto,
      filter,
    );

    // Retornamos estructura exacta para Angular
    return {
      rows: res.rows,
      totalRow: res.totalRow,
    };
  }
}
