import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { ResponseApis } from 'src/models/response-pagination.model';
import { CreateSupportMessageDto } from './dto/create-support-message.dto';
import { SupportService } from './support.service';

@ApiTags('Support')
@ApiBearerAuth()
@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('messages')
  async createMessage(
    @User() user: any,
    @Body() dto: CreateSupportMessageDto,
  ): Promise<ResponseApis<{ id: any; createdAt: number }>> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const tokenUserId = user?.id || user?.sub || user?._id;

    if (dto.userId && String(dto.userId) !== String(tokenUserId)) {
      throw new ForbiddenException({
        message: 'Forbidden',
        detail: 'userId no coincide con el token',
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const created = await this.supportService.createMessage(dto, tokenUserId);

    return {
      data: {
        id: created._id,
        createdAt: created.created,
      },
    };
  }
}
