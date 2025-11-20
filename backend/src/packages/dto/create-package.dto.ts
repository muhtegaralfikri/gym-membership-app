// src/packages/dto/create-package.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsBoolean,
  IsInt,
  IsJSON,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePackageDto {
  @ApiProperty({ example: 'Gold Member' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Akses gym selama 1 tahun penuh.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1500000 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @ApiProperty({ example: 1200000, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  promoPrice?: number;

  @ApiProperty({ example: '2025-12-31', required: false })
  @IsDateString()
  @IsOptional()
  promoExpiresAt?: string;

  @ApiProperty({ example: 365 })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  durationDays: number;

  @ApiProperty({ example: '["Akses penuh", "Gratis handuk"]' })
  @IsJSON() // Pastikan mengirim string JSON yang valid
  @IsOptional()
  features?: string;

  @ApiProperty({ example: '["Personal trainer 4x", "Locker"]', required: false })
  @IsJSON()
  @IsOptional()
  bundleItems?: string;

  @ApiProperty({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
