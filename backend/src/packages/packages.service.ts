import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

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

  /**
   * (Admin) Membuat paket baru
   */
  async create(createPackageDto: CreatePackageDto) {
    const { features, ...rest } = createPackageDto;
    return this.prisma.package.create({
      data: {
        ...rest,
        // FIX: (Menggunakan koreksimu)
        // Jika 'features' ada, parse. Jika tidak, set ke DB NULL.
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
    // Kita harus menangani 3 kasus untuk 'features':
    // 1. undefined: Jangan update field ini (default behavior).
    // 2. null: Client ingin mengosongkan field ini -> Prisma.JsonNull
    // 3. string: Client mengirim data baru -> JSON.parse(...)

    if (features !== undefined) {
      if (features === null) {
        data.features = Prisma.JsonNull;
      } else {
        // Jika features adalah string (termasuk "null" atau "[]")
        data.features = JSON.parse(features) as Prisma.InputJsonValue;
      }
    }

    return this.prisma.package.update({
      where: { id },
      data,
    });
  }
}
