import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export enum PromoDiscountTypeDto {
  PERCENT = 'PERCENT',
  FIXED = 'FIXED',
}

export class CreatePromoDto {
  @ApiProperty({ example: 'GYM50' })
  @IsString()
  @MinLength(3)
  code: string;

  @ApiProperty({ example: 'Diskon 50% maksimal 100k', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: PromoDiscountTypeDto, example: PromoDiscountTypeDto.PERCENT })
  @IsEnum(PromoDiscountTypeDto)
  discountType: PromoDiscountTypeDto;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ example: 100000, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDiscount?: number;

  @ApiProperty({ example: 200000, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @ApiProperty({ example: '2025-12-31', required: false })
  @IsDateString()
  @IsOptional()
  endsAt?: string;

  @ApiProperty({ example: 100, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  usageLimit?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: 1, required: false, description: 'Optional package restriction' })
  @IsInt()
  @IsOptional()
  packageId?: number;
}
