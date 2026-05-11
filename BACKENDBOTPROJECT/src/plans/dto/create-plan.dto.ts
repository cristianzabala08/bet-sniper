import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({ example: 'BASIC' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Plan Básico' })
  @IsNotEmpty()
  @IsString()
  displayName: string;

  @ApiProperty({ example: 30 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  durationDays: number;

  @ApiProperty({ example: 50 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'USDT', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: ['Señales básicas', 'Soporte por email'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isTrialPlan?: boolean;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsNumber()
  maxSignalsPerDay?: number;

  @ApiProperty({ example: 3, required: false })
  @IsOptional()
  @IsNumber()
  commissionLevels?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
