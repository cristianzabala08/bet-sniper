import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { AssignPlanDto } from './dto/assign-plan.dto';
import { ForcePlanActionDto } from './dto/force-plan-action.dto';
import { StaffAuthGuard } from '../common/guards/staff-auth.guard';
import { StaffRoleGuard } from '../common/guards/staff-role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../staff/schema/staff.schema';
import { AuditOperation } from '../common/decorators/audit-operation.decorator';

@ApiTags('Plans')
@Controller('plans')
@UseGuards(StaffAuthGuard, StaffRoleGuard)
@ApiBearerAuth()
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @Roles(StaffRole.SUPER_ADMIN)
  @AuditOperation('CREATE_PLAN')
  @ApiOperation({ summary: 'Crear un nuevo plan' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Body() createPlanDto: CreatePlanDto, @Request() req) {
    const staffRole = req.user.role;
    const staffId = req.user.sub || req.user._id;
    return this.plansService.create(createPlanDto, staffRole, staffId);
  }

  @Get()
  @Roles(
    StaffRole.SUPER_ADMIN,
    StaffRole.ADMIN,
    StaffRole.EDITOR,
    StaffRole.READER,
  )
  @ApiOperation({ summary: 'Listar todos los planes' })
  async findAll(@Query('includeInactive') includeInactive?: string) {
    return this.plansService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @Roles(
    StaffRole.SUPER_ADMIN,
    StaffRole.ADMIN,
    StaffRole.EDITOR,
    StaffRole.READER,
  )
  @ApiOperation({ summary: 'Obtener un plan por ID' })
  async findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Put(':id')
  @Roles(StaffRole.SUPER_ADMIN)
  @AuditOperation('UPDATE_PLAN')
  @ApiOperation({ summary: 'Actualizar un plan' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdatePlanDto,
    @Request() req,
  ) {
    const staffRole = req.user.role;
    return this.plansService.update(id, updatePlanDto, staffRole);
  }

  @Delete(':id')
  @Roles(StaffRole.SUPER_ADMIN)
  @AuditOperation('DELETE_PLAN')
  @ApiOperation({ summary: 'Eliminar un plan (solo Super Admin)' })
  async remove(@Param('id') id: string) {
    return this.plansService.remove(id);
  }

  @Post('assign')
  @Roles(StaffRole.SUPER_ADMIN)
  @AuditOperation('ASSIGN_PLAN')
  @ApiOperation({ summary: 'Asignar un plan a un usuario' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async assignPlan(@Body() assignPlanDto: AssignPlanDto) {
    return this.plansService.assignPlanToUser(
      assignPlanDto.planId,
      assignPlanDto.userId,
    );
  }

  @Post('force-action')
  @Roles(StaffRole.SUPER_ADMIN)
  @AuditOperation('FORCE_PLAN_ACTION')
  @ApiOperation({
    summary: 'Forzar activación o expiración de plan de usuario',
  })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async forcePlanAction(@Body() forcePlanActionDto: ForcePlanActionDto) {
    return this.plansService.forcePlanAction(
      forcePlanActionDto.userId,
      forcePlanActionDto.action,
    );
  }
}
