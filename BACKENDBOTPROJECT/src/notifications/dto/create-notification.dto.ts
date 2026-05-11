import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({
    example: '2023-10-27T10:00:00Z',
    description: 'Date of the notification',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    example: 'New login attempt detected',
    description: 'Content of the notification',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: '653a1b2c3d4e5f6789012345',
    description: 'ID of the user',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: false,
    description: 'Read status of the notification',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  status?: boolean;
}
