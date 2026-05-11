import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActivateGenesisUserDto {
  @ApiProperty({ example: '642bbe546912e13f211716db', description: 'User ID from BackendWeb3.0' })
  @IsString()
  @IsNotEmpty()
  genesisUserId: string;

  @ApiProperty({ example: 'johndoe', description: 'Username from BackendWeb3.0' })
  @IsString()
  @IsNotEmpty()
  genesisUsername: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email from BackendWeb3.0' })
  @IsString()
  @IsOptional()
  genesisEmail?: string;

  @ApiProperty({ example: '0x...', description: 'Wallet address' })
  @IsString()
  @IsOptional()
  wallet?: string;

  @ApiProperty({ example: 'BASIC', description: 'Plan name' })
  @IsString()
  @IsNotEmpty()
  planName: string;

  @ApiProperty({ example: 30, description: 'Plan duration in days' })
  @IsNumber()
  @IsNotEmpty()
  durationDays: number;

  @ApiProperty({ example: '0xabc...', description: 'Transaction hash' })
  @IsString()
  @IsOptional()
  txHash?: string;
}
