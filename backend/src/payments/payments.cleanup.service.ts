import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';
import { PENDING_TTL_MS } from './constants';

@Injectable()
export class PaymentsCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentsCleanupService.name);
  private intervalId: NodeJS.Timeout | null = null;
  private readonly sweepIntervalMs = 15 * 60 * 1000; // 15 menit

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.intervalId = setInterval(() => {
      void this.sweepExpiredPending().catch((err) =>
        this.logger.error('Failed sweeping pending transactions', err),
      );
    }, this.sweepIntervalMs);
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  /**
   * Tandai transaksi pending yang melewati TTL sebagai failed.
   */
  async sweepExpiredPending() {
    const cutoff = new Date(Date.now() - PENDING_TTL_MS);
    const result = await this.prisma.transaction.updateMany({
      where: {
        status: PaymentStatus.pending,
        createdAt: { lt: cutoff },
      },
      data: {
        status: PaymentStatus.failed,
        paymentGatewayResponse: null, // clear stored response when marking failed
      },
    });

    if (result.count > 0) {
      this.logger.log(`Swept ${result.count} expired pending transactions.`);
    }
  }
}
