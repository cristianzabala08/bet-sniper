import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { HoldType } from '../schema/hold.schema';

export class CreateHoldDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsMongoId()
  @IsNotEmpty()
  transactionId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsEnum(HoldType)
  @IsOptional()
  type?: HoldType;

  @IsString()
  @IsNotEmpty()
  wallet: string;
}
