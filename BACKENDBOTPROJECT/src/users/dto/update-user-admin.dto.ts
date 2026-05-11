import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
} from 'class-validator';

export class UpdateUserAdminDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fullname?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  activated?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  points?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  wallet?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  usertype?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  referralsCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString() // status: 'active' | 'expired'
  status?: string;
}
