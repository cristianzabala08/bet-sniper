import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateSupportMessageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  to: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  subject: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  message: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userId?: string;
}
