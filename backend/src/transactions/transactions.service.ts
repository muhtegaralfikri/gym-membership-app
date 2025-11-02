// src/transactions/transactions.service.ts

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PackagesService } from 'src/packages/packages.service'; // 1. Import PackagesService
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { v4 as uuidv4 } from 'uuid'; // 2. Import uuid

@Injectable()
export class TransactionsService {
  // 3. Inject kedua service
  constructor(
    private prisma: PrismaService,
    private packagesService: PackagesService,
  ) {}

  /**
   * Method untuk membuat transaksi baru (status 'pending')
   */
  async create(
    createTransactionDto: CreateTransactionDto,
    userId: number, // Kita butuh ID user yang sedang login
  ) {
    const { packageId } = createTransactionDto;

    // 4. Ambil detail paket dari PackagesService
    const pkg = await this.packagesService.findById(packageId);

    // 5. Validasi paket
    if (!pkg || !pkg.isActive) {
      throw new NotFoundException('Package not found or is not active');
    }

    try {
      // 6. Buat transaksi baru di database
      const newTransaction = await this.prisma.transaction.create({
        data: {
          orderId: uuidv4(), // 7. Generate Order ID unik
          amount: pkg.price, // 8. Ambil harga dari paket
          status: 'pending', // 9. Status awal
          user: {
            connect: { id: userId }, // Hubungkan ke user
          },
          package: {
            connect: { id: packageId }, // Hubungkan ke paket
          },
        },
      });

      // 10. Kembalikan URL pembayaran (dummy untuk sekarang)
      // Nanti ini akan diganti dengan response dari Midtrans/payment gateway
      return {
        message: 'Transaction created successfully.',
        orderId: newTransaction.orderId,
        paymentUrl: `https://dummy-payment-gateway.com/pay?order_id=${newTransaction.orderId}`,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Could not create transaction');
    }
  }
}
