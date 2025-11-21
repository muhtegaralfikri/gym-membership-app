// src/transactions/transactions.controller.ts

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get, // <-- 1. Import Get
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiProperty,
  ApiOkResponse, // <-- 2. Import ApiOkResponse
  ApiForbiddenResponse, // <-- 3. Import ApiForbiddenResponse
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

// --- 4. Import dependensi untuk Admin ---
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';

// DTO untuk response 'create'
class TransactionResponse {
  @ApiProperty()
  message: string;
  @ApiProperty()
  orderId: string;
  @ApiProperty({ example: '7cd2f5a1-acd5-4815-98dd-6d1d2b2d3a0a' })
  paymentToken: string; // <-- Ini sudah kita perbaiki
}

@ApiTags('Transactions')
@Controller() // <-- 5. Ubah @Controller('transactions') menjadi @Controller()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * (Member) Membuat transaksi baru (MEMBER ONLY)
   * POST /transactions
   */
  @Post('transactions') // <-- 6. Tambahkan prefix 'transactions'
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new transaction (Member Only)' })
  @ApiCreatedResponse({
    description: 'Transaction created, returns payment token.',
    type: TransactionResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data.' })
  @ApiNotFoundResponse({ description: 'Package not found.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @Req() req: Request & { user: UserResponseDto },
  ) {
    const userId = req.user.id;
    return this.transactionsService.create(createTransactionDto, userId);
  }

  // --- ENDPOINT BARU ---

  /**
   * (Member) Mengambil riwayat transaksi milik sendiri
   * GET /transactions
   */
  @Get('transactions') // <-- 7. ENDPOINT BARU (GET)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my transaction history (Member Only)' })
  @ApiOkResponse({ description: 'Transaction history retrieved.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  findUserTransactions(@Req() req: Request & { user: UserResponseDto }) {
    const userId = req.user.id;
    return this.transactionsService.findUserTransactions(userId);
  }

  /**
   * (Admin) Mengambil semua riwayat transaksi
   * GET /admin/transactions
   */
  @Get('admin/transactions') // <-- 8. ENDPOINT ADMIN BARU
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all transaction history (Admin Only)' })
  @ApiOkResponse({ description: 'All transactions retrieved.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  findAllTransactions(
    @Query('status') status?: 'pending' | 'success' | 'failed',
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const take = Math.min(Number(limit) || 20, 100);
    const currentPage = Math.max(Number(page) || 1, 1);
    const skip = (currentPage - 1) * take;
    return this.transactionsService.findAllTransactions({ status, search, skip, take });
  }

  @Get('admin/transactions/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export all transaction history as CSV (Admin Only)' })
  @ApiOkResponse({ description: 'CSV stream' })
  async exportTransactions(
    @Res({ passthrough: true }) res: Response,
    @Query('status') status?: 'pending' | 'success' | 'failed',
    @Query('search') search?: string,
  ): Promise<StreamableFile> {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    const csv = await this.transactionsService.exportTransactionsCsv({ status, search });
    return new StreamableFile(Buffer.from(csv), { type: 'text/csv' });
  }
}
