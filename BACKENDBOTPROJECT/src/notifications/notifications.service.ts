import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import {
  Notification,
  NotificationDocument,
} from './schema/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const createdNotification = new this.notificationModel(
      createNotificationDto,
    );
    return createdNotification.save();
  }

  async findAll() {
    return this.notificationModel.find().exec();
  }

  async findOne(id: string) {
    return this.update(id, { status: true });
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto) {
    const updatedNotification = await this.notificationModel
      .findByIdAndUpdate(id, updateNotificationDto, { new: true })
      .exec();
    if (!updatedNotification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return updatedNotification;
  }

  async remove(id: string) {
    const deletedNotification = await this.notificationModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedNotification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return deletedNotification;
  }
}
