import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  Matches,
  IsString,
  IsAlphanumeric,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z\s]+$/, {
    message: 'El nombre solo puede contener letras y espacios',
  })
  fullname: string;

  @ApiProperty()
  @IsAlphanumeric()
  @MinLength(3)
  username: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @IsOptional() // <--- Importante
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'Wallet inválida' })
  wallet?: string; // Ahora es opcional con ?

  @ApiProperty()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  referredBy?: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  acceptTerms: boolean;
}
