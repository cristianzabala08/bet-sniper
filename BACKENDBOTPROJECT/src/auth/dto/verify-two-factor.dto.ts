import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';

export class Verify2faDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  tempToken?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  token?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(4, 6) // Ajusta según el largo típico del código 2FA
  code: string;
}
