import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({ example: 100, description: 'Monto a transferir' })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    example: 'destinatario',
    description: 'Username o Email del destinatario',
  })
  @IsString()
  @IsNotEmpty()
  target: string;

  @ApiProperty({ example: '123456', description: 'Código 2FA' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
