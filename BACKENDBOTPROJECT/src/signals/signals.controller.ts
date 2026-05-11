import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Query,
} from '@nestjs/common';
import { SignalsService } from './signals.service';
import { SignalsGuard } from './signals.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Ensure correct path
import { ApiBearerAuth } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';

@Controller('webhook/signals')
export class SignalsController {
  constructor(private readonly signalsService: SignalsService) {}

  @Post('receive')
  @UseGuards(SignalsGuard) // Only this one needs the secret header
  async receiveSignal(@Body() data: any, @Res() res) {
    // data contains: { usuario, mesa, resultado (P, B o E), gold }

    // Basic validation could be done here or with DTOs
    if (!data) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'No data provided' });
    }

    const result = await this.signalsService.processBaccaratLogic(data);

    return res.status(HttpStatus.OK).json({
      result,
    });
  }

  @ApiBearerAuth()
  @Get('receive')
  @UseGuards(JwtAuthGuard)
  async getLatestSignal(@User() user: any) {
    const userId = user.sub || user._id; // Adjust based on how JwtStrategy returns user
    return this.signalsService.getDashboardStatsByUser(userId);
  }

  @ApiBearerAuth()
  @Get('daily')
  @UseGuards(JwtAuthGuard)
  async getDailySignals(@User() user: any) {
    const userId = user.sub || user._id;
    return this.signalsService.getDailySignals(userId);
  }

  @Get('server-time')
  async getServerTime() {
    return {
      serverTime: new Date().toISOString(),
    };
  }
}
