import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getOverview() {
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count(),

      this.prisma.user.count({
        where: {
          status: 'ACTIVE',
        },
      }),

      this.prisma.user.count({
        where: {
          role: 'ADMIN',
        },
      }),

      this.prisma.user.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        admins: adminUsers,
      },
      recentUsers,
    };
  }
}
