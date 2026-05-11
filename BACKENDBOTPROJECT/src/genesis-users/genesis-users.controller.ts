import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GenesisUsersService } from './genesis-users.service';
import { GenesisJwtGuard } from '../genesis-signals/genesis-jwt.guard';
import { ActivateGenesisUserDto } from './dto/activate-genesis-user.dto';
import { ConfigService } from '@nestjs/config';

@ApiTags('Genesis Users')
@Controller('genesis-users')
export class GenesisUsersController {
  private readonly logger = new Logger(GenesisUsersController.name);

  constructor(
    private readonly genesisUsersService: GenesisUsersService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * List available signal plans.
   * Protected by GenesisJwtGuard (requires BackendWeb3.0 JWT).
   */
  @Get('plans')
  @UseGuards(GenesisJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available signal plans' })
  getPlans() {
    return {
      success: true,
      plans: this.genesisUsersService.getPlans(),
    };
  }

  /**
   * Get the current genesis user's plan info.
   * Protected by GenesisJwtGuard.
   */
  @Get('my-plan')
  @UseGuards(GenesisJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user plan status' })
  async getMyPlan(@Req() req: any) {
    const genesisUserId = req.genesisUser._id;
    const user = await this.genesisUsersService.findByGenesisId(genesisUserId);

    if (!user) {
      return {
        success: true,
        hasPlan: false,
        plan: 'NONE',
        status: 'expired',
        membership_expiration: null,
      };
    }

    const isActive = await this.genesisUsersService.isActive(genesisUserId);

    return {
      success: true,
      hasPlan: true,
      plan: user.plan,
      status: isActive ? 'active' : 'expired',
      membership_expiration: user.membership_expiration,
    };
  }

  /**
   * Activate a plan for a genesis user.
   * Protected by server-to-server API key (called from BackendWeb3.0).
   */
  @Post('activate')
  @ApiOperation({
    summary: 'Activate plan for genesis user (server-to-server)',
  })
  async activatePlan(@Req() req: any, @Body() dto: ActivateGenesisUserDto) {
    // Validate server-to-server API key
    const apiKey = req.headers['x-server-api-key'];
    const expectedKey =
      '2bbe774186f9e140ffb386d8d138*****asdgashdgashd123123123123****';

    console.log('Received API Key:', apiKey);
    console.log('Expected API Key:', expectedKey);

    if (!expectedKey || apiKey !== expectedKey) {
      this.logger.warn(
        'Invalid or missing server API key for activate endpoint',
      );
      throw new UnauthorizedException('Invalid server API key');
    }

    this.logger.log(
      `[activatePlan] Activating plan ${dto.planName} for genesis user ${dto.genesisUserId}`,
    );

    const user = await this.genesisUsersService.activatePlan(dto);

    return {
      success: true,
      user: {
        genesisUserId: user.genesisUserId,
        plan: user.plan,
        status: user.status,
        membership_expiration: user.membership_expiration,
      },
    };
  }

  /**
   * Check if a genesis user has an active plan.
   * Used internally and by server-to-server calls.
   */
  @Get('check-active')
  @UseGuards(GenesisJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if genesis user has active plan' })
  async checkActive(@Req() req: any) {
    const genesisUserId = req.genesisUser._id;
    const isActive = await this.genesisUsersService.isActive(genesisUserId);

    return {
      success: true,
      isActive,
      genesisUserId,
    };
  }
}
