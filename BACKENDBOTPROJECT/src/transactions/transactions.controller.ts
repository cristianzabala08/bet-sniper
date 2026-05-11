import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Logger,
  UseInterceptors,
  Query,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { CommissionsService } from '../commissions/commissions.service';
import { UsersService } from '../users/users.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { User } from '../common/decorators/user.decorator';

import { WithdrawDto } from './dto/withdraw.dto';
import { TransferDto } from './dto/transfer.dto';
import { PurchasePlanDto } from './dto/purchase-plan.dto';
import { AdminManualPurchasePlanDto } from './dto/admin-manual-purchase-plan.dto';
import { IdempotencyInterceptor } from '../common/interceptors/idempotency.interceptor';
import { StaffAuthGuard } from '../common/guards/staff-auth.guard';
import { StaffRoleGuard } from '../common/guards/staff-role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../staff/schema/staff.schema';
import { AuditOperation } from '../common/decorators/audit-operation.decorator';

const logger = new Logger('TransactionsController');
@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
@UseInterceptors(IdempotencyInterceptor)
export class TransactionsController {
  constructor(
    private transactionsService: TransactionsService,
    private commissionsService: CommissionsService,
    private usersService: UsersService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Simular una compra de referido y calcular comisiones',
  })
  @ApiResponse({
    status: 201,
    description: 'Transacción y comisiones calculadas con éxito.',
  })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  async createTransaction(@Body() createTransactionDto: CreateTransactionDto) {
    const { userId, type, amount, status, details } = createTransactionDto;
    const transaction = await this.transactionsService.create(
      userId,
      type,
      amount,
      status,
      details,
    );
    await this.commissionsService.calculateCommissions(
      transaction._id.toString(),
      userId,
      type as 'FIRST_PURCHASE' | 'RENEWAL' | 'UPGRADE',
      amount,
      'TEST_PLAN', // Default for simulation
    );
    return {
      message: 'Transacción y comisiones calculadas con éxito.',
      transaction,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las transacciones del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Lista de transacciones obtenida con éxito.',
  })
  @UseGuards(JwtAuthGuard)
  async getTransactions(@User() user: any) {
    const userId = user.id || user.sub || user._id;
    logger.log(`User ${userId} requested their transactions`);
    return this.transactionsService.findByUser(userId);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Solicitar retiro de fondos (Requiere 2FA)' })
  @UseGuards(JwtAuthGuard)
  async withdraw(@User() user: any, @Body() withdrawDto: WithdrawDto) {
    const userId = user.id || user.sub || user._id;
    logger.log(
      `User ${userId} requested a withdrawal of ${withdrawDto.amount}`,
    );
    return this.transactionsService.withdraw(
      userId,
      withdrawDto.amount,
      withdrawDto.code,
    );
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transferir fondos a otro usuario (Requiere 2FA)' })
  @UseGuards(JwtAuthGuard)
  async transfer(@User() user: any, @Body() transferDto: TransferDto) {
    const userId = user.id || user.sub || user._id;
    const username = user.username;
    logger.log(
      `User ${userId} requested a transfer of ${transferDto.amount} to ${transferDto.target}`,
    );
    return this.transactionsService.transfer(
      userId,
      transferDto.amount,
      transferDto.target,
      transferDto.code,
      username,
    );
  }

  @Post('purchase-plan')
  @ApiOperation({ summary: 'Comprar un plan de membresía (Requiere 2FA)' })
  @UseGuards(JwtAuthGuard)
  async purchasePlan(@User() user: any, @Body() body: PurchasePlanDto) {
    const userId = user.id || user.sub || user._id;
    const username = user.username;
    logger.log(
      `User ${userId} (${username}) requested to purchase plan ${body.txHash}`,
    );
    return this.transactionsService.purchasePlan(userId, body.txHash, username);
  }

  @Get('admin/all')
  @UseGuards(StaffAuthGuard, StaffRoleGuard)
  @Roles(StaffRole.ADMIN, StaffRole.EDITOR)
  @ApiBearerAuth()
  @AuditOperation('VIEW_ALL_TRANSACTIONS')
  async getAllTransactions(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('details') details?: string,
  ) {
    const filter: any = {};
    if (userId) filter.user_id = userId;
    if (status) filter.status = status;
    if (details) filter.details = details;
    return this.transactionsService.findAllPaginated(
      filter,
      Number(page),
      Number(limit),
    );
  }

  @Get('admin/user/:id')
  @UseGuards(StaffAuthGuard, StaffRoleGuard)
  @Roles(StaffRole.ADMIN, StaffRole.EDITOR)
  @ApiBearerAuth()
  @AuditOperation('VIEW_USER_TRANSACTIONS')
  async getUserTransactions(
    @Param('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.transactionsService.findAllPaginated(
      { user_id: userId }, // Query will match string ID now
      Number(page),
      Number(limit),
    );
  }

  @Post('admin/purchase-plan-by-hash/:userId')
  @UseGuards(StaffAuthGuard, StaffRoleGuard)
  @Roles(StaffRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Admin: Registrar compra de plan para un usuario (Manual)',
  })
  @AuditOperation('ADMIN_PURCHASE_PLAN')
  async adminPurchasePlanByHash(
    @Param('userId') userId: string,
    @Body() body: any,
  ) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }
    const username = user.username;
    logger.log(
      `User ${userId} (${username}) requested to purchase plan ${body.txHash}`,
    );
    return this.transactionsService.purchasePlan(userId, body.txHash, username);
  }

  @Post('admin/purchase-plan/:userId')
  @UseGuards(StaffAuthGuard, StaffRoleGuard)
  @Roles(StaffRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Admin: Registrar compra de plan para un usuario (Manual)',
  })
  @AuditOperation('ADMIN_PURCHASE_PLAN')
  async adminPurchasePlan(
    @Param('userId') userId: string,
    @Body() body: AdminManualPurchasePlanDto,
  ) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }
    const username = user.username;
    return this.transactionsService.manualPurchasePlan(
      userId,
      body.planId,
      username,
    );
  }
}
