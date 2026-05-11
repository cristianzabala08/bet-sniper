import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ description: 'The email address of the account to recover' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'The token received in the email' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'The new password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
