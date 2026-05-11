import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ForcePlanAction {
  ACTIVATE = 'activate',
  EXPIRE = 'expire',
}

export class ForcePlanActionDto {
  @ApiProperty({ description: 'ID del usuario' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ enum: ForcePlanAction, description: 'Acción a forzar: activate o expire' })
  @IsNotEmpty()
  @IsEnum(ForcePlanAction)
  action: ForcePlanAction;
}
