// src/transactions/transactions.service.ts

import {
  Injectable,
  InternalServerErrorException,
  Logger, // 1. Import Logger
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PackagesService } from 'src/packages/packages.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { PromosService } from 'src/promos/promos.service';

// 2. Import Midtrans menggunakan 'require'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const midtransClient = require('midtrans-client');

@Injectable()
export class TransactionsService {
  // 3. Beri tipe 'any' secara eksplisit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private snap: any;
  
  // 4. Tambahkan Logger
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private prisma: PrismaService,
    private packagesService: PackagesService,
    private configService: ConfigService,
    private promosService: PromosService,
  ) {
    // 5. Validasi kunci .env saat aplikasi start
    const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');
    const clientKey = this.configService.get<string>('MIDTRANS_CLIENT_KEY');

    if (!serverKey || !clientKey) {
      this.logger.error(
        'MIDTRANS_SERVER_KEY or MIDTRANS_CLIENT_KEY is missing.',
      );
      throw new InternalServerErrorException(
        'Midtrans configuration is missing.',
      );
    }
    this.logger.log(`Using ServerKey starting with: ${serverKey.substring(0, 10)}...`);
    this.logger.log('Midtrans Keys loaded successfully.'); // Pesan sukses

    // 6. Nonaktifkan linter untuk 'unsafe assignment' saat 'new'
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: serverKey, // <-- Gunakan variabel
      clientKey: clientKey, // <-- Gunakan variabel
    });
  }

  async create(createTransactionDto: CreateTransactionDto, userId: number) {
    const { packageId, promoCode } = createTransactionDto;
    const pkg = await this.packagesService.findById(packageId);

    if (!pkg || !pkg.isActive) {
      throw new NotFoundException('Package not found or is not active');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const basePrice = this.promosService.getBasePrice(pkg as any);
    let discountAmount = 0;
    let appliedPromoId: number | undefined;
    let finalAmount = basePrice;

    if (promoCode) {
      const { discount, finalAmount: computedFinal, promo } = await this.promosService.validateAndCompute(
        promoCode,
        pkg as any,
      );
      discountAmount = discount;
      appliedPromoId = promo.id;
      finalAmount = computedFinal;
      if (finalAmount <= 0) {
        throw new BadRequestException('Total setelah promo tidak valid.');
      }
    }

    // Midtrans expects integer gross_amount (no decimal for IDR)
    const grossAmount = Math.round(Number(finalAmount));
    // Samakan nilai yang disimpan dengan nominal yang dikirim ke Midtrans
    const savedAmount = grossAmount;
    discountAmount = Math.max(0, Number(basePrice) - savedAmount);

    const orderId = uuidv4();

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      item_details: [
        {
          id: `PKG-${pkg.id}`,
          price: grossAmount,
          quantity: 1,
          name: promoCode ? `${pkg.name} (promo)` : pkg.name,
        },
      ],
      customer_details: {
        first_name: user.name,
        email: user.email,
        phone: user.phone || '',
      },
      enabled_payments: [
        'bca_va',
        'bri_va',
        'bni_va',
        'permata_va',
        'other_va',
        'echannel',
        'gopay',
        'shopeepay',
        'credit_card',
      ],
    };

    try {
      const data: any = {
        orderId: orderId,
        amount: savedAmount,
        discountAmount: discountAmount,
        status: 'pending',
        paymentGateway: 'midtrans',
        user: { connect: { id: userId } },
        package: { connect: { id: packageId } },
      };
      if (appliedPromoId) {
        data.promoCodeId = appliedPromoId;
      }

      const newTransaction = await (this.prisma as any).transaction.create({
        data,
      });

      // 7. Nonaktifkan linter untuk 'unsafe call' dan 'unsafe member access'
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const midtransTransaction = await this.snap.createTransaction(parameter);

      // 8. Nonaktifkan linter untuk 'unsafe assignment' dan 'unsafe member access'
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const paymentToken = midtransTransaction.token;

      return {
        message: 'Transaction created successfully.',
        orderId: newTransaction.orderId,
        paymentToken: paymentToken,
        finalAmount,
        discountAmount,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Could not create transaction');
    }
  }
  /**
   * (Member) Mengambil riwayat transaksi milik sendiri
   */
  async findUserTransactions(userId: number) {
    return this.prisma.transaction.findMany({
      where: { userId: userId },
      include: {
        package: true, // Sertakan detail paket yang dibeli
      },
      orderBy: {
        createdAt: 'desc', // Tampilkan yang terbaru di atas
      },
    });
  }

  // --- METHOD BARU UNTUK ADMIN ---

  /**
   * (Admin) Mengambil semua riwayat transaksi di sistem
   */
  async findAllTransactions() {
    return this.prisma.transaction.findMany({
      include: {
        package: true, // Sertakan detail paket
        user: {
          // Sertakan detail user (yang aman, tanpa password)
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
