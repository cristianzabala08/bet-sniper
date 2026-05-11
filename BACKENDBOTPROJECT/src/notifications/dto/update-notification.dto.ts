import { PartialType } from '@nestjs/swagger'; // Assuming we use swagger, or just mapped-types
// If @nestjs/swagger is not used, import from @nestjs/mapped-types
import { CreateNotificationDto } from './create-notification.dto';

export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {}
