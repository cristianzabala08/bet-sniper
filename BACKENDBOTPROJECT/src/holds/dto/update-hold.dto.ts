import { IsOptional, IsString } from 'class-validator';

export class UpdateHoldDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
