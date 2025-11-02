// src/packages/packages.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PackagesService {
  // 1. Inject PrismaService
  constructor(private prisma: PrismaService) {}

  /**
   * Method untuk mengambil semua paket yang aktif
   */
  async findAllActive() {
    // 2. Query ke DB, cari semua paket
    return this.prisma.package.findMany({
      where: {
        isActive: true, // Hanya ambil yang aktif
      },
      orderBy: {
        price: 'asc', // Urutkan dari harga termurah
      },
    });
  }
}
