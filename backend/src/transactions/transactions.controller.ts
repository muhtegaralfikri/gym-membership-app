// src/transactions/transactions.controller.ts

import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'; // 1. Import Guard
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiProperty,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

// 2. DTO untuk response-nya
class TransactionResponse {
  @ApiProperty()
  message: string;
  @ApiProperty()
  orderId: string;
  @ApiProperty({ example: '7cd2f5a1-acd5-4815-98dd-6d1d2b2d3a0a' })
  paymentToken: string; // <-- Ganti 'paymentUrl' menjadi 'paymentToken'
}

@ApiTags('Transactions') // 3. Grup-kan di Swagger
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * Endpoint untuk membuat transaksi baru (MEMBER ONLY)
   * POST /transactions
   */
  @Post()
  @UseGuards(JwtAuthGuard) // 4. KUNCI ENDPOINT INI!
  @ApiBearerAuth() // 5. Tandai butuh token di Swagger
  @ApiOperation({ summary: 'Create a new transaction (Member Only)' })
  @ApiCreatedResponse({
    description: 'Transaction created, returns payment token.',
    type: TransactionResponse, // 6. Definisikan response-nya
  })
  @ApiBadRequestResponse({ description: 'Invalid input data.' })
  @ApiNotFoundResponse({ description: 'Package not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  create(
    @Body() createTransactionDto: CreateTransactionDto, // 7. Ambil packageId dari body
    @Req() req: Request & { user: UserResponseDto }, // 8. Ambil user dari token
  ) {
    const userId = req.user.id; // 9. Dapatkan userId
    // 10. Panggil service-nya
    return this.transactionsService.create(createTransactionDto, userId);
  }
}
