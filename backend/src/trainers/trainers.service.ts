import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  MembershipStatus,
  PTSessionStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { AvailabilitySlotDto } from './dto/schedule-availability.dto';

@Injectable()
export class TrainersService {
  private readonly logger = new Logger(TrainersService.name);
  private readonly defaultDuration = 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAllTrainers() {
    return this.prisma.user.findMany({
      where: { trainerProfile: { isNot: null } },
      include: {
        trainerProfile: {
          include: {
            availabilities: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findMemberSessions(memberId: number) {
    const now = new Date();
    return this.prisma.pTSession.findMany({
      where: {
        memberId,
        scheduledAt: { gte: now },
        status: { not: PTSessionStatus.CANCELLED },
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
            trainerProfile: true,
          },
        },
      },
    });
  }

  async getTrainerAvailability(trainerId: number, date: string) {
    const targetDate = this.parseDate(date);
    const dayOfWeek = targetDate.getDay();

    const trainer = await this.prisma.user.findUnique({
      where: { id: trainerId },
      include: {
        trainerProfile: {
          include: {
            availabilities: {
              where: { dayOfWeek },
              orderBy: { startTime: 'asc' },
            },
          },
        },
      },
    });

    if (!trainer?.trainerProfile) {
      throw new NotFoundException('Trainer not found');
    }

    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const sessions = await this.prisma.pTSession.findMany({
      where: {
        trainerId,
        scheduledAt: { gte: dayStart, lt: dayEnd },
        status: { not: PTSessionStatus.CANCELLED },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    const bookedRanges = sessions.map((session) => ({
      start: session.scheduledAt,
      end: new Date(
        session.scheduledAt.getTime() + session.durationMinutes * 60_000,
      ),
    }));

    const slots: string[] = [];
    for (const availability of trainer.trainerProfile.availabilities) {
      this.validateTimeRange(availability.startTime, availability.endTime);
      let cursor = this.combineDateAndTime(targetDate, availability.startTime);
      const windowEnd = this.combineDateAndTime(targetDate, availability.endTime);

      while (cursor.getTime() + this.defaultDuration * 60_000 <= windowEnd.getTime()) {
        const candidateEnd = new Date(
          cursor.getTime() + this.defaultDuration * 60_000,
        );
        const overlaps = bookedRanges.some(
          (range) => cursor < range.end && candidateEnd > range.start,
        );
        if (!overlaps) {
          slots.push(cursor.toISOString());
        }
        cursor = candidateEnd;
      }
    }

    return {
      trainerId,
      date: dayStart.toISOString(),
      slots,
      bookedSessions: sessions,
    };
  }

  async bookSession(
    memberId: number,
    trainerId: number,
    scheduledAt: string,
    durationMinutes?: number,
    notes?: string,
  ) {
    const startTime = this.parseDate(scheduledAt);
    const duration = durationMinutes ?? this.defaultDuration;
    if (duration <= 0) {
      throw new BadRequestException('Duration must be greater than zero');
    }
    const endTime = new Date(startTime.getTime() + duration * 60_000);

    const trainerProfile = await this.prisma.trainerProfile.findUnique({
      where: { userId: trainerId },
    });
    if (!trainerProfile) {
      throw new BadRequestException('Trainer profile not found');
    }

    const member = await this.prisma.user.findUnique({ where: { id: memberId } });
    const trainer = await this.prisma.user.findUnique({ where: { id: trainerId } });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    if (!trainer) {
      throw new NotFoundException('Trainer not found');
    }

    const membership = await this.getActiveMembership(memberId);
    if (!membership) {
      throw new BadRequestException('Active membership is required to book a PT session');
    }

    if (startTime < membership.startDate || startTime > membership.endDate) {
      throw new BadRequestException('Session must be within your active membership period');
    }

    const quota = membership.package?.ptSessionsQuota ?? 0;
    if (quota <= 0) {
      throw new BadRequestException('Your package does not include PT sessions');
    }

    const usedSessions = await this.prisma.pTSession.count({
      where: {
        memberId,
        scheduledAt: {
          gte: membership.startDate,
          lte: membership.endDate,
        },
        status: { not: PTSessionStatus.CANCELLED },
      },
    });

    if (usedSessions >= quota) {
      throw new BadRequestException('PT session quota exceeded for your package');
    }

    await this.ensureTrainerFree(trainerId, startTime, endTime);

    const session = await this.prisma.pTSession.create({
      data: {
        trainerId,
        memberId,
        scheduledAt: startTime,
        durationMinutes: duration,
        status: PTSessionStatus.BOOKED,
        notes,
      },
    });

    void this.sendBookingEmails(session, trainer, member);
    return session;
  }

  async setAvailability(trainerUserId: number, slots: AvailabilitySlotDto[]) {
    if (!slots?.length) {
      throw new BadRequestException('Availability slots are required');
    }

    const profile = await this.prisma.trainerProfile.findUnique({
      where: { userId: trainerUserId },
    });
    if (!profile) {
      throw new BadRequestException('Trainer profile not found');
    }

    const payload: Prisma.TrainerAvailabilityCreateManyInput[] = slots.map((slot) => {
      this.validateTimeRange(slot.startTime, slot.endTime);
      if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
        throw new BadRequestException('dayOfWeek must be between 0 and 6');
      }
      return {
        trainerId: profile.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
      };
    });

    const uniqueDays = Array.from(new Set(payload.map((s) => s.dayOfWeek)));

    return this.prisma.$transaction(async (tx) => {
      for (const day of uniqueDays) {
        await tx.trainerAvailability.deleteMany({
          where: { trainerId: profile.id, dayOfWeek: day },
        });
      }

      await tx.trainerAvailability.createMany({ data: payload });

      return tx.trainerAvailability.findMany({
        where: { trainerId: profile.id },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });
    });
  }

  private async getActiveMembership(memberId: number) {
    const now = new Date();
    return this.prisma.userMembership.findFirst({
      where: {
        userId: memberId,
        status: MembershipStatus.active,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        package: true,
      },
      orderBy: { endDate: 'desc' },
    });
  }

  private async ensureTrainerFree(
    trainerId: number,
    startTime: Date,
    endTime: Date,
  ) {
    const dayOfWeek = startTime.getDay();
    const profile = await this.prisma.trainerProfile.findUnique({
      where: { userId: trainerId },
      include: { availabilities: { where: { dayOfWeek } } },
    });
    if (!profile) {
      throw new BadRequestException('Trainer profile not found');
    }

    const fitsAvailability = profile.availabilities.some((slot) => {
      this.validateTimeRange(slot.startTime, slot.endTime);
      const windowStart = this.combineDateAndTime(startTime, slot.startTime);
      const windowEnd = this.combineDateAndTime(startTime, slot.endTime);
      return startTime >= windowStart && endTime <= windowEnd;
    });

    if (!fitsAvailability) {
      throw new BadRequestException('Trainer is not available at the requested time');
    }

    const dayStart = new Date(startTime);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const conflicts = await this.prisma.pTSession.findMany({
      where: {
        trainerId,
        scheduledAt: { gte: dayStart, lt: dayEnd },
        status: { not: PTSessionStatus.CANCELLED },
      },
    });

    const hasOverlap = conflicts.some((session) => {
      const existingStart = session.scheduledAt;
      const existingEnd = new Date(
        session.scheduledAt.getTime() + session.durationMinutes * 60_000,
      );
      return startTime < existingEnd && endTime > existingStart;
    });

    if (hasOverlap) {
      throw new BadRequestException('Trainer already has a session at that time');
    }
  }

  private combineDateAndTime(date: Date, time: string) {
    this.validateTimeString(time);
    const [hours, minutes] = time.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  private validateTimeString(value: string) {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
    if (!match) {
      throw new BadRequestException('Time must be in HH:mm format');
    }
  }

  private validateTimeRange(start: string, end: string) {
    this.validateTimeString(start);
    this.validateTimeString(end);
    const [sHours, sMinutes] = start.split(':').map(Number);
    const [eHours, eMinutes] = end.split(':').map(Number);
    if (eHours < sHours || (eHours === sHours && eMinutes <= sMinutes)) {
      throw new BadRequestException('endTime must be after startTime');
    }
  }

  private parseDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date');
    }
    return date;
  }

  private async sendBookingEmails(
    session: {
      id: number;
      scheduledAt: Date;
      durationMinutes: number;
      notes?: string | null;
    },
    trainer: { name: string; email?: string | null },
    member: { name: string; email?: string | null },
  ) {
    const formatDateTime = (value: Date) =>
      value.toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

    const subject = 'PT Session Booking';
    const startText = formatDateTime(session.scheduledAt);
    const endText = formatDateTime(
      new Date(session.scheduledAt.getTime() + session.durationMinutes * 60_000),
    );
    const tasks: Promise<any>[] = [];

    if (member.email) {
      tasks.push(
        this.notifications.sendEmail(
          member.email,
          subject + ' Confirmation',
          [
            `Hai ${member.name},`,
            `Booking sesi PT kamu sudah dikonfirmasi.`,
            `Jadwal: ${startText} - ${endText}.`,
            trainer.name ? `Trainer: ${trainer.name}.` : '',
            session.notes ? `Catatan: ${session.notes}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
        ),
      );
    }

    if (trainer.email) {
      tasks.push(
        this.notifications.sendEmail(
          trainer.email,
          subject + ' - New Booking',
          [
            `Hai ${trainer.name},`,
            `Ada booking baru dari ${member.name}.`,
            `Jadwal: ${startText} - ${endText}.`,
            session.notes ? `Catatan member: ${session.notes}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
        ),
      );
    }

    if (!tasks.length) return;

    const results = await Promise.allSettled(tasks);
    const rejected = results.filter((r) => r.status === 'rejected');
    if (rejected.length) {
      this.logger.warn(
        `Some booking emails failed: ${rejected
          .map((r) => (r as PromiseRejectedResult).reason)
          .join(', ')}`,
      );
    }
  }
}
