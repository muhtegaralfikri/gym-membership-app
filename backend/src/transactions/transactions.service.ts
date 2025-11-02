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
import { ConfigService } from '@nestjs/config';

// 1. Kita tetap gunakan 'require' untuk CJS compatibility
// eslint-disable-next-line @typescript-eslint/no-var-requires
const midtransClient = require('midtrans-client');

@Injectable()
export class TransactionsService {
  // 2. Kita beri tipe 'any' secara eksplisit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private snap: any;

  constructor(
    private prisma: PrismaService,
    private packagesService: PackagesService,
    private configService: ConfigService,
  ) {
    // 3. Kita nonaktifkan linter untuk 'unsafe assignment' saat 'new'
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: this.configService.get<string>('MIDTRANS_SERVER_KEY'),
      clientKey: this.configService.get<string>('MIDTRANS_CLIENT_KEY'),
    });
  }

  async create(createTransactionDto: CreateTransactionDto, userId: number) {
    const { packageId } = createTransactionDto;
    const pkg = await this.packagesService.findById(packageId);

    if (!pkg || !pkg.isActive) {
      throw new NotFoundException('Package not found or is not active');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const orderId = uuidv4();

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: pkg.price.toNumber(),
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
      const newTransaction = await this.prisma.transaction.create({
        data: {
          orderId: orderId,
          amount: pkg.price,
          status: 'pending',
          user: { connect: { id: userId } },
          package: { connect: { id: packageId } },
        },
      });

      // 4. Nonaktifkan linter untuk 'unsafe call' dan 'unsafe member access'
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const midtransTransaction = await this.snap.createTransaction(parameter);

      // 5. Nonaktifkan linter untuk 'unsafe assignment' dan 'unsafe member access'
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const paymentToken = midtransTransaction.token;

      return {
        message: 'Transaction created successfully.',
        orderId: newTransaction.orderId,
        paymentToken: paymentToken,
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Could not create transaction');
    }
  }
}
