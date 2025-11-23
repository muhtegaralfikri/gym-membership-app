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
// eslint-disable-next-line @typescript-eslint/no-var-requires
const midtransClient = require('midtrans-client');
import { MembershipStatus, PaymentStatus, Prisma } from '@prisma/client';
import { computeMidtransSignature } from './utils/midtrans-signature';
import { PENDING_TTL_MS } from './constants';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private membershipsService: MembershipsService,
    private notifications: NotificationsService,
  ) {}

  /**
   * Menangani notifikasi webhook dari Payment Gateway
   */
  async handlePaymentNotification(dto: PaymentNotificationDto) {
    const { order_id, transaction_status, gross_amount, fraud_status, status_code, signature_key } = dto;

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      throw new InternalServerErrorException('Missing MIDTRANS_SERVER_KEY');
    }

    const expectedSignature = computeMidtransSignature(
      order_id,
      status_code,
      gross_amount,
      serverKey,
    );

    if (expectedSignature !== signature_key) {
      throw new BadRequestException('Invalid signature');
    }

    // 1. Cari transaksi berdasarkan order_id
    const transaction = await (this.prisma as any).transaction.findUnique({
      where: { orderId: order_id },
      include: { promoCode: true, user: true, package: true } as any,
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

    // Idempotensi sederhana: jangan proses ulang transaksi yang sudah gagal
    if (transaction.status === PaymentStatus.failed) {
      return { message: 'Transaction already marked as failed.' };
    }

    // 3. Validasi nominal
    if (transaction.amount.toNumber() !== parseFloat(gross_amount)) {
      throw new BadRequestException('Invalid amount');
    }

    // 4. Proses berdasarkan status
    const isSuccessfulCapture =
      transaction_status === 'capture' && fraud_status === 'accept';

    // Tandai gagal jika pending terlalu lama
    const isExpiredPending =
      transaction.status === PaymentStatus.pending &&
      new Date().getTime() - transaction.createdAt.getTime() > PENDING_TTL_MS &&
      transaction_status === 'pending';

    if (isExpiredPending) {
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentStatus.failed,
          paymentGatewayResponse: dto as unknown as Prisma.InputJsonValue,
        },
      });
      return { message: 'Transaction expired and marked as failed.' };
    }

    if (transaction_status === 'settlement' || isSuccessfulCapture) {
      try {
        // 'prisma' di dalam callback ini adalah TransactionClient
        const result = await this.prisma.$transaction(
          async (prisma) => {
            const txClient = prisma as any;
            const updatedTransaction = await txClient.transaction.update({
              where: { id: transaction.id },
              data: {
                status: PaymentStatus.success,
                paymentGatewayResponse: dto as unknown as Prisma.InputJsonValue,
              },
            });

            const promoId = (transaction as any).promoCodeId || transaction.promoCode?.id;
            if (promoId) {
              await txClient.promoCode.update({
                where: { id: promoId },
                data: { usedCount: { increment: 1 } },
              });
            }

            const membership =
              await this.membershipsService.activateMembership(
                updatedTransaction.id,
                prisma,
              );

            return { updatedTransaction, membership };
          },
          {
            timeout: 10000, // <-- TAMBAHKAN OPSI TIMEOUT INI (10 detik)
          },
        );

        // Kirim notifikasi di background; tidak boleh menggagalkan pembayaran.
        void this.sendPurchaseNotifications(
          transaction.user,
          transaction.package,
          result.membership,
        );

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
    } else if (transaction_status === 'capture' && fraud_status === 'challenge') {
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentStatus.pending,
          paymentGatewayResponse: dto as unknown as Prisma.InputJsonValue,
        },
      });
      return { message: 'Transaction is challenged and pending manual review.' };
    } else if (transaction_status === 'capture' && fraud_status === 'deny') {
      await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentStatus.failed,
          paymentGatewayResponse: dto as unknown as Prisma.InputJsonValue,
        },
      });
      return { message: 'Transaction denied by bank.' };
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

  /**
   * Admin: tandai transaksi sebagai refund/void dan nonaktifkan membership terkait.
   */
  async refundTransaction(transactionId: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { membership: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status === PaymentStatus.failed) {
      return { message: 'Transaction already failed.' };
    }

    const now = new Date();

    const result = await this.prisma.$transaction(async (prisma) => {
      const updatedTx = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: PaymentStatus.failed,
          paymentGatewayResponse: {
            ...(transaction.paymentGatewayResponse as Prisma.InputJsonObject),
            adminAction: 'refund',
            adminActionAt: now.toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      if (transaction.membership) {
        await prisma.userMembership.update({
          where: { id: transaction.membership.id },
          data: {
            status: MembershipStatus.expired,
            endDate: now,
          },
        });
      }

      return updatedTx;
    });

    return {
      message: 'Transaction refunded/voided and membership updated.',
      transactionId: result.orderId,
    };
  }

  /**
   * Sinkron status transaksi langsung ke Midtrans (untuk user terkait).
   */
  async syncTransactionStatus(orderId: string, userId: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { orderId },
    });

    if (!transaction || transaction.userId !== userId) {
      throw new NotFoundException('Transaction not found');
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const clientKey = process.env.MIDTRANS_CLIENT_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

    if (!serverKey || !clientKey) {
      throw new InternalServerErrorException('Missing Midtrans keys');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const core = new midtransClient.CoreApi({
      isProduction,
      serverKey,
      clientKey,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const statusResponse = await core.transaction.status(orderId);

    const dto: PaymentNotificationDto = {
      order_id: statusResponse.order_id,
      transaction_status: statusResponse.transaction_status,
      gross_amount: statusResponse.gross_amount,
      fraud_status: statusResponse.fraud_status,
      status_code: statusResponse.status_code,
      signature_key: statusResponse.signature_key,
    };

    return this.handlePaymentNotification(dto);
  }

  /**
   * Kirim email + WhatsApp setelah pembayaran sukses.
   * Error dikumpulkan dan hanya di-log, tidak melempar.
   */
  private async sendPurchaseNotifications(
    user: { name: string; email?: string | null; phone?: string | null },
    pkg: { name: string },
    membership: { startDate: Date; endDate: Date },
  ) {
    if (!user) return;

    const start = new Date(membership.startDate);
    const end = new Date(membership.endDate);
    const formatDate = (d: Date) =>
      d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

    const body = `Hai ${user.name}, pembayaran paket ${pkg?.name || ''} berhasil.
Membership aktif ${formatDate(start)} - ${formatDate(end)}.
Selamat berlatih!`;

    const tasks: Promise<any>[] = [];

    if (user.email) {
      tasks.push(
        this.notifications.sendEmail({
          to: user.email,
          subject: `Pembayaran paket ${pkg?.name || 'gym'} berhasil`,
          text: body,
        }),
      );
    }

    if (user.phone) {
      tasks.push(
        this.notifications.sendWhatsAppText({
          to: user.phone,
          message: body,
        }),
      );
    }

    if (!tasks.length) return;

    const results = await Promise.allSettled(tasks);
    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length) {
      console.warn(
        '[notifications] gagal mengirim sebagian:',
        failures.map((f) => (f as PromiseRejectedResult).reason),
      );
    }
  }
}
