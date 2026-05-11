import {
  Controller,
  Get,
  HttpStatus,
  Res,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiKeyGuard } from './common/guards/api-key.guard';
import { SignalsService } from '../signals/signals.service';

/**
 * Controller for Third-Party companies to access Baccarat signals.
 * Authenticated via API Key (x-api-key header or apiKey query param).
 */
@Controller('third-party/signals')
export class ThirdPartySignalsController {
  private readonly logger = new Logger(ThirdPartySignalsController.name);

  constructor(private readonly signalsService: SignalsService) {}

  /**
   * Get latest signals and dashboard stats.
   * Equivalent to genesis/signals/receive.
   */
  @Get('receive')
  @UseGuards(ApiKeyGuard)
  async getLatestSignals(@Res() res: any) {
    try {
      this.logger.log('Third-party request for signals dashboard');
      const data = await this.signalsService.getDashboardStatsByUser();
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      this.logger.error(`Error getting signals for third-party: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error retrieving signals',
      });
    }
  }

  /**
   * Get daily signals (history of won/lost).
   * Equivalent to genesis/signals/daily.
   */
  @Get('daily')
  @UseGuards(ApiKeyGuard)
  async getDailySignals(@Res() res: any) {
    try {
      this.logger.log('Third-party request for daily signals');
      const data = await this.signalsService.getDailySignals(undefined);
      return res.status(HttpStatus.OK).json(data);
    } catch (error) {
      this.logger.error(`Error getting daily signals for third-party: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error retrieving daily signals',
      });
    }
  }

  /**
   * Get current server time for synchronization.
   */
  @Get('server-time')
  async getServerTime() {
    return {
      serverTime: new Date().toISOString(),
    };
  }
}
