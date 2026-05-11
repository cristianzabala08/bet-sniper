import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionDetail } from '../enums/transaction-detail.enum';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'ID del usuario que realiza la compra',
    example: '658af1b2c3d4e5f6a7b8c9d0',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Tipo de transacción',
    enum: ['first purchase', 'renewal', 'upgrade'],
    example: 'first purchase',
  })
  // @IsEnum(['first purchase', 'renewal', 'upgrade'])
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Monto de la transacción',
    example: 100,
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'Estado de la transacción',
    enum: TransactionStatus,
    example: TransactionStatus.APPROVED,
    required: false,
  })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiProperty({
    description: 'Detalles de la transacción',
    enum: TransactionDetail,
    example: TransactionDetail.MEMBERSHIP_BASIC,
    required: false,
  })
  @IsEnum(TransactionDetail)
  @IsOptional()
  details?: TransactionDetail;
}
