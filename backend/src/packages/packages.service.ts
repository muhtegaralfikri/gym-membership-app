// src/packages/packages.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

  // ... (method findAllActive dan findById tidak berubah) ...

  findAllActive() {
    return this.prisma.package.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  findById(id: number) {
    return this.prisma.package.findUnique({
      where: { id },
    });
  }

  // --- Method Admin Baru (FIXED) ---

  /**
   * (Admin) Membuat paket baru
   */
  async create(createPackageDto: CreatePackageDto) {
    const { features, ...rest } = createPackageDto;
    return this.prisma.package.create({
      data: {
        ...rest,
        // FIX:
        // 1. Gunakan 'null' langsung, bukan 'Prisma.DbNull'
        // 2. Casting hasil parse ke tipe yang diharapkan Prisma
        features: features
          ? (JSON.parse(features) as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
  }

  /**
   * (Admin) Mengambil semua paket, termasuk non-aktif
   */
  async findAll() {
    return this.prisma.package.findMany({
      orderBy: { id: 'asc' },
    });
  }

  /**
   * (Admin) Memperbarui paket
   */
  async update(id: number, updatePackageDto: UpdatePackageDto) {
    const { features, ...rest } = updatePackageDto;

    const data: Prisma.PackageUpdateInput = { ...rest };

    // FIX:
    // 1. Cek jika 'features' ada di DTO (bukan undefined)
    // 2. Jika ada, parse dan cast ke tipe yang diharapkan Prisma
    //    (JSON.parse("null") akan menjadi 'null' yang valid)
    if (features !== undefined) {
      data.features = JSON.parse(features) as Prisma.InputJsonValue;
    }
    // Jika 'features' adalah undefined, kita tidak menambahkannya ke
    // 'data', sehingga Prisma tidak akan meng-update field tersebut.

    return this.prisma.package.update({
      where: { id },
      data,
    });
  }
}
