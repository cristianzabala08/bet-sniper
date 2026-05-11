import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WithdrawDto {
  @ApiProperty({ example: 100, description: 'Monto a retirar' })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: '123456', description: 'Código 2FA' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
