import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const now = new Date();
    const activeMemberships = await this.prisma.userMembership.findMany({
      where: {
        status: { in: ['active', 'upcoming'] },
        endDate: { gt: now },
      },
      select: {
        endDate: true,
        userId: true,
      },
    });

    const activeMembers = new Set(activeMemberships.map((m) => m.userId)).size;

    const remainingDays =
      activeMemberships.length === 0
        ? 0
        : Math.max(
            0,
            Math.round(
              activeMemberships.reduce((acc, m) => {
                const diffDays =
                  (new Date(m.endDate).getTime() - now.getTime()) /
                  (1000 * 60 * 60 * 24);
                return acc + diffDays;
              }, 0) / activeMemberships.length,
            ),
          );

    const staffCount = await this.prisma.user.count({
      where: {
        role: {
          name: { in: ['admin', 'trainer'] },
        },
      },
    });

    const latestMemberships = await this.prisma.userMembership.findMany({
      orderBy: { endDate: 'desc' },
      take: 3,
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    const latestInitials = latestMemberships
      .map((m) => m.user?.name?.charAt(0).toUpperCase() || '?')
      .filter(Boolean);

    return {
      activeMembers,
      activeInstructors: staffCount,
      latestInitials,
      averageRemainingDays: remainingDays,
      remainingDays,
    };
  }
}
