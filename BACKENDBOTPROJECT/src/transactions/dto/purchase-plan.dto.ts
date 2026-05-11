import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PurchasePlanDto {
  @ApiProperty({ example: '0x...', description: 'Hash de la transacción' })
  @IsString()
  @IsNotEmpty()
  txHash: string;
}
