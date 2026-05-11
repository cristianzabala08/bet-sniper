import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminManualPurchasePlanDto {
  @ApiProperty({
    example: 2,
    description: 'ID del plan (1: WEEKLY, 2: BASIC, ...)',
  })
  @IsNumber()
  @IsNotEmpty()
  planId: number;
}
