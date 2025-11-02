// src/transactions/transactions.service.ts

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PackagesService } from 'src/packages/packages.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config'; // <-- 1. Import ConfigService
import * as midtransClient from 'midtrans-client'; // <-- 2. Import Midtrans
import type {
  SnapTransactionParams,
  SnapTransactionResponse,
} from 'midtrans-client';

@Injectable()
export class TransactionsService {
  // <-- 3. Buat instance Midtrans Snap
  private snap: midtransClient.Snap;

  constructor(
    private prisma: PrismaService,
    private packagesService: PackagesService,
    private configService: ConfigService, // <-- 4. Inject ConfigService
  ) {
    // 5. Inisialisasi Midtrans Snap saat service dibuat
    this.snap = new midtransClient.Snap({
      isProduction:
        this.configService.get<boolean>('MIDTRANS_IS_PRODUCTION') ?? false,
      serverKey: this.configService.getOrThrow<string>('MIDTRANS_SERVER_KEY'),
      clientKey: this.configService.getOrThrow<string>('MIDTRANS_CLIENT_KEY'),
    });
  }

  async create(createTransactionDto: CreateTransactionDto, userId: number) {
    const { packageId } = createTransactionDto;
    const pkg = await this.packagesService.findById(packageId);

    if (!pkg || !pkg.isActive) {
      throw new NotFoundException('Package not found or is not active');
    }

    // Ambil data user (kita butuh email/nama untuk Midtrans)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const orderId = uuidv4(); // Kita tetap pakai UUID kita

    // 6. Buat parameter untuk Midtrans
    const parameter: SnapTransactionParams = {
      transaction_details: {
        order_id: orderId, // <-- Pakai orderId kita
        gross_amount: pkg.price.toNumber(), // Pastikan ini number
      },
      item_details: [
        {
          id: `PKG-${pkg.id}`,
          price: pkg.price.toNumber(),
          quantity: 1,
          name: pkg.name,
        },
      ],
      customer_details: {
        first_name: user.name,
        email: user.email,
        phone: user.phone || '',
      },
    };

    try {
      // 7. Buat transaksi di database kita (status 'pending')
      const newTransaction = await this.prisma.transaction.create({
        data: {
          orderId: orderId,
          amount: pkg.price,
          status: 'pending',
          user: { connect: { id: userId } },
          package: { connect: { id: packageId } },
        },
      });

      // 8. Panggil API Midtrans untuk mendapatkan payment token
      const midtransTransaction: SnapTransactionResponse =
        await this.snap.createTransaction(parameter);
      const { token: paymentToken, redirect_url: paymentUrl } =
        midtransTransaction;

      // 9. Kembalikan payment URL (dan token jika dibutuhkan) ke frontend
      return {
        message: 'Transaction created successfully.',
        orderId: newTransaction.orderId,
        paymentUrl,
        paymentToken, // <-- Frontend bisa pakai Snap token saat memanggil snap.pay
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Could not create transaction');
    }
  }
}
