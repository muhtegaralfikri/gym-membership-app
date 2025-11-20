import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const now = new Date();
    const activeMembers = await this.prisma.userMembership.count({
      where: {
        status: 'active',
        endDate: { gt: now },
      },
    });

    const adminOrStaff = await this.prisma.user.count({
      where: {
        role: {
          name: { in: ['admin', 'staff', 'instruktur'] },
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
      activeInstructors: adminOrStaff,
      latestInitials,
    };
  }
}
