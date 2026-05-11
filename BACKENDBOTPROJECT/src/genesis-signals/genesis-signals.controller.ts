import {
  Controller,
  Get,
  HttpStatus,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { GenesisJwtGuard } from './genesis-jwt.guard';
import { SignalsService } from '../signals/signals.service';
import { Logger } from '@nestjs/common';

/**
 * Controller for Genesis frontend to access Baccarat signals.
 * Uses GenesisJwtGuard to validate BackendWeb3.0 JWT tokens.
 */
@Controller('genesis/signals')
export class GenesisSignalsController {
  private readonly logger = new Logger(GenesisSignalsController.name);

  constructor(private readonly signalsService: SignalsService) {}

  @Get('receive')
  @UseGuards(GenesisJwtGuard)
  async getLatestSignals(@Req() req: any, @Res() res: any) {
    try {
      /*  const genesisUser = req.genesisUser;
      this.logger.log(
        `Genesis user ${genesisUser.userName} requesting signals dashboard`,
      );

      // Get dashboard stats - pass null for userId since genesis users
      // are validated by their own JWT, not by BACKENDBOTPROJECT user ID */
      const data = await this.signalsService.getDashboardStatsByUser();

      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      this.logger.error(
        `Error getting signals for genesis user: ${error.message}`,
      );
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error retrieving signals',
      });
    }
  }

  @Get('daily')
  @UseGuards(GenesisJwtGuard)
  async getDailySignals(@Req() req: any, @Res() res: any) {
    try {
      const genesisUser = req.genesisUser;
      this.logger.log(
        `Genesis user ${genesisUser.userName} requesting daily signals`,
      );

      const data = await this.signalsService.getDailySignals(undefined);

      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      this.logger.error(`Error getting daily signals: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error retrieving daily signals',
      });
    }
  }

  @Get('server-time')
  async getServerTime() {
    return {
      serverTime: new Date().toISOString(),
    };
  }

  @Get('validate-token')
  @UseGuards(GenesisJwtGuard)
  async validateToken(@Req() req: any, @Res() res: any) {
    try {
      const genesisUser = req.genesisUser;
      this.logger.log(
        `Validating genesis token for user: ${genesisUser.userName}`,
      );

      return res.status(HttpStatus.OK).json({
        valid: true,
        user: {
          userName: genesisUser.userName,
          wallet: genesisUser.wallet,
        },
      });
    } catch (error) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        valid: false,
        message: 'Invalid token',
      });
    }
  }
}
