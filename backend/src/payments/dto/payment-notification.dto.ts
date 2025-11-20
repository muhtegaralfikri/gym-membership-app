// src/payments/dto/payment-notification.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PaymentNotificationDto {
  @ApiProperty({ example: 'settlement' })
  @IsString()
  @IsNotEmpty()
  transaction_status: string; // 'settlement', 'pending', 'expire', 'cancel', 'deny'

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8' })
  @IsString()
  @IsNotEmpty()
  order_id: string; // Ini adalah orderId (UUID) yang kita buat di TransactionsService

  @ApiProperty({ example: '150000.00' })
  @IsString()
  @IsNotEmpty()
  gross_amount: string;

  @ApiProperty({ example: 'accept', required: false })
  @IsString()
  @IsOptional()
  fraud_status?: string;

  // Di aplikasi production, kita juga akan menerima dan memvalidasi
  // 'signature_key' untuk keamanan, tapi kita skip untuk simulasi ini.
}
