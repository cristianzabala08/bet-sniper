import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Logger,
  UseInterceptors,
  Query,
  Patch,
  Put,
  Delete,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { ChangePasswordAdminDto } from './dto/change-password-admin.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import { IdempotencyInterceptor } from 'src/common/interceptors/idempotency.interceptor';
import { StaffAuthGuard } from '../common/guards/staff-auth.guard';
import { StaffRoleGuard } from '../common/guards/staff-role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../staff/schema/staff.schema';
import { AuditOperation } from '../common/decorators/audit-operation.decorator';

const logger = new Logger('UsersController');

@ApiTags('Users')
@ApiBearerAuth() // <<<<<< 🚀 Esto agrega el botón de "Authorize" para este controlador
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() data) {
    return this.usersService.create(data);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.usersService.findAll();
  }

  @Get('referrals/:username')
  @UseGuards(JwtAuthGuard)
  getReferrals(@Param('username') username: string) {
    return this.usersService.getReferrals(username);
  }

  @Get('tree/:username')
  @UseGuards(JwtAuthGuard)
  getReferralTree(@Param('username') username: string) {
    return this.usersService.getReferralTreeWithLevels(username);
  }

  @Get('check')
  @UseGuards(JwtAuthGuard)
  async findOneByUsername(@User() user: any) {
    logger.log('Entrando en /users/check');
    return user;
  }

  @Get('network')
  @UseGuards(JwtAuthGuard)
  async getMyNetwork(@User() user: any) {
    const username = user.username;
    return this.usersService.getReferrals(username);
  }

  @UseInterceptors(IdempotencyInterceptor)
  @Get('2fa/generate')
  @UseGuards(JwtAuthGuard)
  async generate2fa(@User() user: any) {
    // Usamos el ID que viene en el token (asegúrate que tu decorador devuelva el id o sub)
    const userId = user.id || user.sub || user._id;
    const result = await this.usersService.generate2FA(userId);

    return {
      data: {
        ...result,
        message: 'Escanea el QR y confirma con el endpoint /2fa/enable',
      },
    };
  }

  @UseInterceptors(IdempotencyInterceptor)
  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  async enable2fa(@User() user: any, @Body() body: { token: string }) {
    const userId = user.id || user.sub || user._id;
    await this.usersService.enable2FA(userId, body.token);

    return {
      message: '2FA activado correctamente',
    };
  }

  @Get(':username')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('username') username: string) {
    return this.usersService.findOne(username);
  }

  @Post('include-wallet')
  @UseGuards(JwtAuthGuard)
  async includeWallet(@User() user: any, @Body() body: { wallet: string }) {
    const userId = user.id || user.sub || user._id;
    const updatedUser = await this.usersService.includeWallet(
      userId,
      body.wallet,
    );

    // Re-firma el JWT con la wallet nueva: el token que tiene el cliente en
    // localStorage es estático, así que sin esto la sesión seguiría viendo
    // al usuario "sin wallet" (p.ej. para /gpulse-sso) hasta el próximo
    // login. Reusa el MISMO sessionId del token actual — generar uno nuevo
    // acá dispararía SESSION_EXPIRED_DUPLICATE_LOGIN en el próximo request,
    // porque JwtStrategy.validate() lo compara contra user.loginSessionId
    // en la base, que solo se actualiza en el login real.
    const token = this.jwtService.sign({
      username: updatedUser.username,
      email: updatedUser.email,
      wallet: updatedUser.wallet,
      sub: (updatedUser as any)._id,
      role: (updatedUser as any).usertype,
      sessionId: user.sessionId,
    });

    return {
      message: 'Wallet actualizada correctamente',
      user: updatedUser,
      token,
    };
  }
  @Get('admin/list')
  @UseGuards(StaffAuthGuard, StaffRoleGuard)
  @Roles(StaffRole.ADMIN, StaffRole.EDITOR)
  @ApiBearerAuth()
  @AuditOperation('VIEW_ALL_USERS')
  async findAllAdmin(@Query('page') page = 1, @Query('limit') limit = 50) {
    return this.usersService.findAllPaginated(Number(page), Number(limit));
  }

  @Get('admin/:id')
  @UseGuards(StaffAuthGuard, StaffRoleGuard)
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.ADMIN, StaffRole.EDITOR)
  @ApiBearerAuth()
  @AuditOperation('VIEW_USER_DETAILS')
  async findOneById(@Param('id') id: string) {
    return this.usersService.findOneById(id);
  }

  @Delete('admin/:id')
  @UseGuards(StaffAuthGuard, StaffRoleGuard)
  @Roles(StaffRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @AuditOperation('DELETE_USER')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Get('admin/:id/:email')
  @UseGuards(StaffAuthGuard, StaffRoleGuard)
  @Roles(StaffRole.ADMIN, StaffRole.EDITOR)
  @ApiBearerAuth()
  @AuditOperation('CHECK_EMAIL_AVAILABILITY')
  @ApiOperation({
    summary: 'Consultar disponibilidad de email',
    description:
      'Verifica si un correo electrónico está libre o ya registrado.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description:
      'ID del usuario (para excluir en caso de edición). Usa "0" o "new" para nuevos registros.',
  })
  @ApiParam({
    name: 'email',
    required: true,
    description: 'Email a verificar',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de disponibilidad del email',
  })
  async checkEmail(@Param('id') id: string, @Param('email') email: string) {
    if (!email) {
      return { available: false, message: 'Email is required' };
    }
    // Si envían "0" o "new", lo tratamos como undefined para el servicio (aunque la lógica de string diff también funcionaría)
    const userId = id === '0' || id === 'new' ? undefined : id;
    return this.usersService.checkEmailAvailability(userId, email);
  }

  @Patch('admin/:id/block')
  @UseGuards(StaffAuthGuard, StaffRoleGuard)
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.ADMIN, StaffRole.EDITOR)
  @ApiBearerAuth()
  @AuditOperation('BLOCK_USER')
  async blockUser(
    @Param('id') id: string,
    @Body() body: { activated: boolean },
  ) {
    return this.usersService.blockUnblockUser(id, body.activated);
  }

  @Put('admin/:id')
  @UseGuards(StaffAuthGuard, StaffRoleGuard)
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.ADMIN, StaffRole.EDITOR)
  @ApiBearerAuth()
  @AuditOperation('UPDATE_USER_ADMIN')
  @UsePipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false }),
  )
  async updateUser(@Param('id') id: string, @Body() body: UpdateUserAdminDto) {
    return this.usersService.updateUserAdmin(id, body);
  }

  @Patch('admin/:id/password')
  @UseGuards(StaffAuthGuard, StaffRoleGuard)
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.ADMIN, StaffRole.EDITOR)
  @ApiBearerAuth()
  @AuditOperation('CHANGE_PASSWORD_ADMIN')
  async changePassword(
    @Param('id') id: string,
    @Body() body: ChangePasswordAdminDto,
  ) {
    return this.usersService.adminChangePassword(id, body.password);
  }

  @Patch('admin/:id/2fa/reset')
  @UseGuards(StaffAuthGuard, StaffRoleGuard)
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.ADMIN, StaffRole.EDITOR)
  @ApiBearerAuth()
  @AuditOperation('RESET_2FA_ADMIN')
  async reset2FA(@Param('id') id: string) {
    const user = await this.usersService.adminReset2FA(id);
    return {
      message:
        '2FA reseteado correctamente. El usuario puede configurarlo de nuevo.',
      user,
    };
  }
}
