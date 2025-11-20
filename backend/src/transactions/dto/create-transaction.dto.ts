// src/transactions/dto/create-transaction.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'The ID of the package being purchased',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  packageId: number;

  @ApiProperty({ description: 'Optional promo code', required: false, example: 'GYM50' })
  @IsString()
  @IsOptional()
  promoCode?: string;
}
