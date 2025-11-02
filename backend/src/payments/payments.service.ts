// src/payments/payments.service.ts

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MembershipsService } from 'src/memberships/memberships.service';
import { PaymentNotificationDto } from './dto/payment-notification.dto';
import { PaymentStatus, Prisma } from '@prisma/client';

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
        // 'prisma' di dalam callback ini adalah TransactionClient
        const result = await this.prisma.$transaction(async (prisma) => {
          // Update status transaksi kita menjadi 'success'
          const updatedTransaction = await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: PaymentStatus.success,
              paymentGatewayResponse: dto as unknown as Prisma.InputJsonValue,
            },
          });

          // --- INI PERBAIKANNYA ---
          // Kita 'pass' prisma (TransactionClient) ke service lain
          // agar 'activateMembership' berjalan dalam konteks transaksi yang sama.
          const membership = await this.membershipsService.activateMembership(
            updatedTransaction.id,
            prisma, // <-- FIX: Lewatkan 'prisma' dari $transaction
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
        
        // Cek jika error BUKAN dari 'activateMembership'
        // (Jika error dari 'activateMembership', status sudah di-set 'failed' di sana)
        if (!(error instanceof NotFoundException)) {
           await this.prisma.transaction.update({
             where: { id: transaction.id },
             data: { status: PaymentStatus.failed },
           });
        }
        
        // Lempar error asli dari 'activateMembership' jika ada
        if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
          throw error;
        }

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