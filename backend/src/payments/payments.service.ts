import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MembershipsService } from 'src/memberships/memberships.service';
import { PaymentNotificationDto } from './dto/payment-notification.dto';
import { PaymentStatus, Prisma } from '@prisma/client'; // Import Prisma untuk tipe JSON jika perlu

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private membershipsService: MembershipsService,
  ) {}

  /**
   * Menangani notifikasi webhook dari Payment Gateway
   */
  async handlePaymentNotification(dto: PaymentNotificationDto) {
    const { order_id, transaction_status, gross_amount } = dto;

    // 1. Cari transaksi berdasarkan order_id
    const transaction = await this.prisma.transaction.findUnique({
      where: { orderId: order_id },
    });

    if (!transaction) {
      // <-- FIX 1: String dipecah ke baris baru
      throw new NotFoundException(
        `Transaction with order_id ${order_id} not found`,
      );
    }

    // 2. Cek Idempotency
    if (transaction.status === PaymentStatus.success) {
      return { message: 'Transaction already processed successfully.' };
    }

    // 3. Validasi nominal
    if (transaction.amount.toNumber() !== parseFloat(gross_amount)) {
      throw new BadRequestException('Invalid amount');
    }

    // 4. Proses berdasarkan status
    if (transaction_status === 'settlement') {
      try {
        const result = await this.prisma.$transaction(async (prisma) => {
          const updatedTransaction = await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: PaymentStatus.success,
              // <-- FIX 2: Hapus 'as any'. DTO adalah objek yang valid untuk JSON.
              paymentGatewayResponse: dto as unknown as Prisma.InputJsonValue,
            },
          });

          const membership = await this.membershipsService.activateMembership(
            updatedTransaction.id,
          );

          return { updatedTransaction, membership };
        });

        return {
          message: 'Payment successful, membership activated.',
          transactionId: result.updatedTransaction.orderId,
          membershipId: result.membership.id,
        };
      } catch (error) {
        console.error('Failed during $transaction:', error);
        await this.prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: PaymentStatus.failed },
        });
        throw new InternalServerErrorException('Failed to process payment');
      }
    } else if (
      transaction_status === 'expire' ||
      transaction_status === 'cancel' ||
      transaction_status === 'deny'
    ) {
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentStatus.failed,
          // <-- FIX 3: Hapus 'as any' di sini juga
          paymentGatewayResponse: dto as unknown as Prisma.InputJsonValue,
        },
      });
      return { message: 'Transaction marked as failed.' };
    } else if (transaction_status === 'pending') {
      return { message: 'Transaction is still pending.' };
    }

    return { message: 'Unhandled transaction status.' };
  }
}
