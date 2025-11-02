// src/memberships/memberships.service.ts

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MembershipStatus, PaymentStatus, Prisma } from '@prisma/client';
// PackagesService tidak kita perlukan di sini karena kita ambil data paket
// langsung dari relasi 'transaction'
// import { PackagesService } from 'src/packages/packages.service';

@Injectable()
export class MembershipsService {
  constructor(
    private prisma: PrismaService,
    // private packagesService: PackagesService, // Tidak diperlukan untuk 2 method ini
  ) {}

  /**
   * Mengambil semua data membership milik satu user
   * (Baik untuk 'My Account' atau pengecekan Admin)
   */
  async findUserMemberships(userId: number) {
    return this.prisma.userMembership.findMany({
      where: { userId: userId },
      include: {
        package: true, // Sertakan detail paketnya
      },
      orderBy: {
        endDate: 'desc', // Tampilkan yang paling baru/aktif di atas
      },
    });
  }

  /**
   * Mengaktifkan membership setelah transaksi berhasil.
   * Ini adalah logika inti untuk "stacking" paket.
   * @param transactionId ID transaksi yang sudah 'success'
   */
  async activateMembership(transactionId: number, prismaClient?: Prisma.TransactionClient) {
    const db = prismaClient || this.prisma;
    // 1. Ambil data transaksi beserta data user dan paketnya
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: true,
        package: true, // Kita butuh 'durationDays' dari paket
      },
    });

    if (!transaction || transaction.status !== PaymentStatus.success) {
      throw new NotFoundException('Successful transaction not found');
    }

    if (!transaction.package) {
      // FIX: String dipecah ke baris baru
      throw new NotFoundException(
        'Package details not found for this transaction',
      );
    }

    const userId = transaction.userId;
    const pkg = transaction.package; // pkg = package

    // 2. Tentukan Tanggal Mulai (startDate)
    // Cari membership terakhir (aktif atau upcoming) dari user ini
    const lastMembership = await this.prisma.userMembership.findFirst({
      where: {
        userId: userId,
        status: { in: [MembershipStatus.active, MembershipStatus.upcoming] },
      },
      orderBy: {
        endDate: 'desc', // Ambil yang tanggal berakhirnya paling akhir
      },
    });

    let startDate: Date;
    if (lastMembership && lastMembership.endDate > new Date()) {
      // Jika ada membership aktif/upcoming, "stack" paket baru ini
      // Tanggal mulai adalah TEPAT setelah paket lama berakhir
      startDate = lastMembership.endDate;
    } else {
      // Jika tidak ada membership aktif, mulai dari sekarang
      startDate = new Date();
    }

    // 3. Tentukan Tanggal Berakhir (endDate)
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + pkg.durationDays);

    // 4. Buat record UserMembership
    try {
      const newMembership = await this.prisma.userMembership.create({
        data: {
          startDate: startDate,
          endDate: endDate,
          // FIX: Ternary dipecah agar lolos linting
          status:
            startDate > new Date()
              ? MembershipStatus.upcoming
              : MembershipStatus.active,
          user: { connect: { id: userId } },
          package: { connect: { id: pkg.id } },
          transaction: { connect: { id: transaction.id } }, // Tautkan ke bukti bayar
        },
      });

      return newMembership;
    } catch (error) {
      console.error('Failed to activate membership:', error);
      // Rollback status transaksi jika gagal
      await db.transaction.update({
        where: { id: transactionId },
        data: { status: PaymentStatus.failed },
      });
      throw new InternalServerErrorException('Could not activate membership');
    }
  }
}