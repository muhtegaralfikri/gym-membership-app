import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, BookingStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  private async logAdminAction(
    action: string,
    adminId: number | null,
    entityId?: number,
    details?: Prisma.InputJsonValue,
  ) {
    try {
      const client: any = this.prisma as any;
      if (!client.adminLog?.create) return;
      await client.adminLog.create({
        data: {
          action,
          entity: 'GymClass',
          entityId: entityId ?? null,
          details,
          adminId: adminId ?? undefined,
        },
      });
    } catch (_err) {
      // logging best-effort
    }
  }

  private computeStatus(cls: { startTime: Date; endTime: Date }) {
    const now = new Date();
    if (now >= cls.endTime) return 'finished';
    if (now >= cls.startTime) return 'ongoing';
    return 'upcoming';
  }

  async findUpcoming() {
    const now = new Date();
    const classes = await this.prisma.gymClass.findMany({
      where: { endTime: { gte: now } },
      orderBy: { startTime: 'asc' },
      include: {
        _count: {
          select: {
            bookings: {
              where: { status: { in: [BookingStatus.booked, BookingStatus.checked_in] } },
            },
          },
        },
      },
    });

    return classes.map((cls) => ({
      ...cls,
      bookedCount: cls._count.bookings,
      availableSlots: Math.max(0, cls.capacity - cls._count.bookings),
    }));
  }

  async findAllAdmin(status?: 'upcoming' | 'ongoing' | 'finished') {
    const classes = await this.prisma.gymClass.findMany({
      orderBy: { startTime: 'desc' },
      include: {
        _count: {
          select: {
            bookings: {
              where: { status: { in: [BookingStatus.booked, BookingStatus.checked_in] } },
            },
          },
        },
      },
    });

    const decorated = classes.map((cls) => {
      const computedStatus = this.computeStatus(cls);
      return {
        ...cls,
        status: computedStatus,
        bookedCount: cls._count.bookings,
        availableSlots: Math.max(0, cls.capacity - cls._count.bookings),
      };
    });

    if (!status) return decorated;
    return decorated.filter((cls) => cls.status === status);
  }

  async createClass(dto: CreateClassDto, adminId?: number) {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (end <= start) {
      throw new BadRequestException('Waktu selesai harus setelah waktu mulai.');
    }

    const created = await this.prisma.gymClass.create({
      data: {
        title: dto.title,
        description: dto.description,
        instructor: dto.instructor,
        location: dto.location,
        startTime: start,
        endTime: end,
        capacity: dto.capacity ?? 20,
      },
    });

    this.logAdminAction('create', adminId ?? null, created.id, { title: dto.title });
    return created;
  }

  async updateClass(id: number, dto: Partial<CreateClassDto>, adminId?: number) {
    const gymClass = await this.prisma.gymClass.findUnique({ where: { id } });
    if (!gymClass) {
      throw new NotFoundException('Kelas tidak ditemukan.');
    }

    const start = dto.startTime ? new Date(dto.startTime) : gymClass.startTime;
    const end = dto.endTime ? new Date(dto.endTime) : gymClass.endTime;
    if (end <= start) {
      throw new BadRequestException('Waktu selesai harus setelah waktu mulai.');
    }

    const updated = await this.prisma.gymClass.update({
      where: { id },
      data: {
        title: dto.title ?? gymClass.title,
        description: dto.description ?? gymClass.description,
        instructor: dto.instructor ?? gymClass.instructor,
        location: dto.location ?? gymClass.location,
        startTime: start,
        endTime: end,
        capacity: dto.capacity ?? gymClass.capacity,
      },
    });

    this.logAdminAction('update', adminId ?? null, id, { title: updated.title });
    return updated;
  }

  async findUserBookings(userId: number) {
    return this.prisma.classBooking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { gymClass: true },
    });
  }

  async bookClass(classId: number, userId: number) {
    const gymClass = await this.prisma.gymClass.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: {
            bookings: {
              where: { status: { in: [BookingStatus.booked, BookingStatus.checked_in] } },
            },
          },
        },
      },
    });

    if (!gymClass) {
      throw new NotFoundException('Kelas tidak ditemukan.');
    }

    const now = new Date();
    if (gymClass.startTime <= now) {
      throw new BadRequestException('Kelas sudah dimulai atau selesai.');
    }

    if (gymClass._count.bookings >= gymClass.capacity) {
      throw new BadRequestException('Kapasitas kelas sudah penuh.');
    }

    const existing = await this.prisma.classBooking.findFirst({
      where: {
        userId,
        classId,
        status: { not: BookingStatus.cancelled },
      },
    });

    if (existing) {
      throw new BadRequestException('Kamu sudah terdaftar di kelas ini.');
    }

    const checkinCode = randomUUID();

    return this.prisma.classBooking.create({
      data: {
        userId,
        classId,
        status: BookingStatus.booked,
        checkinCode,
      },
      include: { gymClass: true },
    });
  }

  async checkinByCode(code: string) {
    const booking = await this.prisma.classBooking.findUnique({
      where: { checkinCode: code },
      include: { gymClass: true, user: true },
    });

    if (!booking) {
      throw new NotFoundException('Kode check-in tidak valid.');
    }

    if (booking.status === BookingStatus.cancelled) {
      throw new BadRequestException('Booking ini sudah dibatalkan.');
    }

    if (booking.status === BookingStatus.checked_in) {
      return {
        message: 'Sudah check-in.',
        booking,
      };
    }

    const updated = await this.prisma.classBooking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.checked_in,
        checkedInAt: new Date(),
      },
      include: { gymClass: true, user: true },
    });

    return {
      message: 'Check-in berhasil.',
      booking: updated,
    };
  }

  async findClassBookings(classId: number) {
    const gymClass = await this.prisma.gymClass.findUnique({ where: { id: classId } });
    if (!gymClass) throw new NotFoundException('Kelas tidak ditemukan.');

    return this.prisma.classBooking.findMany({
      where: { classId },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }

  async cancelBooking(bookingId: number) {
    const booking = await this.prisma.classBooking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking tidak ditemukan.');

    if (booking.status === BookingStatus.cancelled) {
      return { message: 'Booking sudah dibatalkan.', booking };
    }

    const updated = await this.prisma.classBooking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.cancelled },
    });

    return { message: 'Booking dibatalkan.', booking: updated };
  }

  async forceCheckinBooking(bookingId: number) {
    const booking = await this.prisma.classBooking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking tidak ditemukan.');

    if (booking.status === BookingStatus.checked_in) {
      return { message: 'Sudah check-in.', booking };
    }

    const updated = await this.prisma.classBooking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.checked_in,
        checkedInAt: new Date(),
      },
      include: { user: true },
    });

    return { message: 'Check-in berhasil.', booking: updated };
  }

  async deleteClass(id: number, adminId?: number) {
    const gymClass = await this.prisma.gymClass.findUnique({
      where: { id },
    });

    if (!gymClass) {
      throw new NotFoundException('Kelas tidak ditemukan.');
    }

    await this.prisma.classBooking.deleteMany({ where: { classId: id } });
    await this.prisma.gymClass.delete({ where: { id } });

    this.logAdminAction('delete', adminId ?? null, id, { title: gymClass.title });
    return { message: 'Kelas dihapus.', class: gymClass };
  }
}
