import { IsString, IsOptional, IsNumber, IsArray, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLandingConfigDto {
  @ApiPropertyOptional() @IsOptional() @IsString() heroTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() heroSubtitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() heroCtaText?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() heroCtaLink?: string;

  @ApiPropertyOptional() @IsOptional() @IsNumber() statsWinsToday?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() statsLossesToday?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() statsProfitToday?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() statsWinRate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() statsActiveUsers?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() martingalaDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() martingalaFeatures?: string[];

  @ApiPropertyOptional() @IsOptional() @IsString() ctaSectionTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ctaSectionSubtitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ctaSectionButtonText?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ctaSectionButtonLink?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() footerText?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() footerDisclaimer?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() socialLinks?: Record<string, string>;
}
