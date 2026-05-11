import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeStaffPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;
}
