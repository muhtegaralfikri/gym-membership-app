import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, BookingStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

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

  async createClass(dto: CreateClassDto) {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (end <= start) {
      throw new BadRequestException('Waktu selesai harus setelah waktu mulai.');
    }

    return this.prisma.gymClass.create({
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

  async deleteClass(id: number) {
    const gymClass = await this.prisma.gymClass.findUnique({
      where: { id },
    });

    if (!gymClass) {
      throw new NotFoundException('Kelas tidak ditemukan.');
    }

    await this.prisma.classBooking.deleteMany({ where: { classId: id } });
    await this.prisma.gymClass.delete({ where: { id } });

    return { message: 'Kelas dihapus.', class: gymClass };
  }
}
