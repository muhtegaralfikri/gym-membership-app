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
    const { features, bundleItems, promoExpiresAt, ...rest } = createPackageDto;
    const data: any = {
      ...rest,
      features: features ? (JSON.parse(features) as Prisma.InputJsonValue) : Prisma.JsonNull,
      bundleItems: bundleItems ? (JSON.parse(bundleItems) as Prisma.InputJsonValue) : Prisma.JsonNull,
      promoExpiresAt: promoExpiresAt ? new Date(promoExpiresAt) : null,
    };

    // NOTE: Cast to any to avoid type mismatch when Prisma client is not regenerated yet.
    return this.prisma.package.create({
      data: data as Prisma.PackageCreateInput,
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
    const { features, bundleItems, promoExpiresAt, ...rest } = updatePackageDto;

    const data: any = {
      ...rest,
    };

    if (features !== undefined) {
      data.features = features === null ? Prisma.JsonNull : (JSON.parse(features) as Prisma.InputJsonValue);
    }

    if (bundleItems !== undefined) {
      data.bundleItems =
        bundleItems === null ? Prisma.JsonNull : (JSON.parse(bundleItems) as Prisma.InputJsonValue);
    }

    if (promoExpiresAt !== undefined) {
      data.promoExpiresAt = promoExpiresAt ? new Date(promoExpiresAt) : null;
    }

    return this.prisma.package.update({
      where: { id },
      data: data as Prisma.PackageUpdateInput,
    });
  }

  /**
   * (Admin) Menghapus paket
   */
  async remove(id: number) {
    return this.prisma.package.delete({
      where: { id },
    });
  }
}
