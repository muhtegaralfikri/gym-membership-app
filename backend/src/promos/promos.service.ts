import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePromoDto, PromoDiscountTypeDto } from './dto/create-promo.dto';
import { UpdatePromoDto } from './dto/update-promo.dto';

@Injectable()
export class PromosService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreatePromoDto) {
    return (this.prisma as any).promoCode.create({
      data: this.mapDtoToData(dto),
    });
  }

  findAll() {
    return (this.prisma as any).promoCode.findMany({
      orderBy: { id: 'desc' },
      include: { package: true },
    });
  }

  update(id: number, dto: UpdatePromoDto) {
    return (this.prisma as any).promoCode.update({
      where: { id },
      data: this.mapDtoToData(dto),
    });
  }

  remove(id: number) {
    return (this.prisma as any).promoCode.delete({
      where: { id },
    });
  }

  async validateForPackage(code: string, packageId: number) {
    const pkg = await (this.prisma as any).package.findUnique({ where: { id: packageId } });
    if (!pkg || !pkg.isActive) {
      throw new NotFoundException('Paket tidak ditemukan atau nonaktif.');
    }
    return this.validateAndCompute(code, pkg);
  }

  async validateAndCompute(code: string, pkg: any) {
    const promo = await (this.prisma as any).promoCode.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!promo || !promo.isActive) {
      throw new NotFoundException('Kode promo tidak ditemukan atau nonaktif.');
    }

    const now = new Date();
    if (promo.startsAt && promo.startsAt > now) {
      throw new BadRequestException('Kode promo belum aktif.');
    }
    if (promo.endsAt && promo.endsAt < now) {
      throw new BadRequestException('Kode promo telah berakhir.');
    }
    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      throw new BadRequestException('Kuota penggunaan kode promo habis.');
    }
    if (promo.packageId && promo.packageId !== pkg.id) {
      throw new BadRequestException('Kode promo tidak berlaku untuk paket ini.');
    }

    const basePrice = this.getBasePrice(pkg);

    if (promo.minAmount && basePrice < Number(promo.minAmount)) {
      throw new BadRequestException('Total belum memenuhi minimum pembelian.');
    }

    const discount =
      promo.discountType === PromoDiscountTypeDto.PERCENT
        ? (basePrice * Number(promo.value)) / 100
        : Number(promo.value);

    const cappedDiscount =
      promo.maxDiscount && discount > Number(promo.maxDiscount)
        ? Number(promo.maxDiscount)
        : discount;

    const finalAmount = Math.max(0, basePrice - cappedDiscount);

    return {
      promo,
      basePrice,
      discount: cappedDiscount,
      finalAmount,
    };
  }

  async incrementUsage(promoCodeId: number) {
    await (this.prisma as any).promoCode.update({
      where: { id: promoCodeId },
      data: { usedCount: { increment: 1 } },
    });
  }

  getBasePrice(pkg: any) {
    const now = new Date();
    const promoPriceNumber = pkg.promoPrice ? Number(pkg.promoPrice) : 0;
    const hasPromo =
      promoPriceNumber > 0 && (!pkg.promoExpiresAt || pkg.promoExpiresAt > now);

    return hasPromo ? promoPriceNumber : Number(pkg.price);
  }

  private mapDtoToData(dto: CreatePromoDto | UpdatePromoDto) {
    const data: any = {
      ...dto,
    };

    if (dto.code) data.code = dto.code.trim().toUpperCase();
    if (dto.discountType) data.discountType = dto.discountType;
    if (dto.maxDiscount === undefined) delete data.maxDiscount;
    if (dto.minAmount === undefined) delete data.minAmount;
    if (dto.startsAt !== undefined) data.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    if (dto.endsAt !== undefined) data.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    return data;
  }
}
