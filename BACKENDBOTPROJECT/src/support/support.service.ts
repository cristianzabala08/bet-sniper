import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MailService } from 'src/mail/mail.service';
import {
  SupportMessage,
  SupportMessageDocument,
} from './schema/support-message.schema';
import { CreateSupportMessageDto } from './dto/create-support-message.dto';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportMessage.name)
    private supportMessageModel: Model<SupportMessageDocument>,
    private readonly mailService: MailService,
  ) {}

  async createMessage(dto: CreateSupportMessageDto, fromUserId: string) {
    const now = Date.now();

    const created = new this.supportMessageModel({
      to: dto.to,
      subject: dto.subject,
      message: dto.message,
      fromUserId,
      created: now,
      lastupdated: now,
    });

    const saved = await created.save();

    await this.mailService.sendEmailSupport(
      dto.to,
      dto.subject,
      dto.message,
      String(fromUserId),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      String((saved as any)?._id),
    );

    return saved;
  }
}
