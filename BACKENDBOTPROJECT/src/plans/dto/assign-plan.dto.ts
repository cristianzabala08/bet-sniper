import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPlanDto {
  @ApiProperty({ description: 'ID del usuario al que se asignará el plan' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ description: 'ID del plan a asignar' })
  @IsNotEmpty()
  @IsString()
  planId: string;
}
