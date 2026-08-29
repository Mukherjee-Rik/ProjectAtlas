import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class SubscriptionUsageService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The subscription that currently entitles a restaurant to use the app.
   *
   * A trial only counts while it is still running. Matching on status alone
   * meant the trial never actually ended — the row stayed TRIALING for ever, so
   * quota checks kept passing months past trialEnd. A null trialEnd is treated
   * as open-ended so legacy rows are not locked out.
   */
  async getActiveSubscription(restaurantId: string) {
    const now = new Date();
    return this.prisma.subscription.findFirst({
      where: {
        restaurantId,
        OR: [
          { status: 'ACTIVE' },
          {
            status: 'TRIALING',
            OR: [{ trialEnd: null }, { trialEnd: { gt: now } }],
          },
        ],
      },
      include: {
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async checkLimit(restaurantId: string, limitType: 'maxTables' | 'maxStaff' | 'maxBranches' | 'maxMenus') {
    const subscription = await this.getActiveSubscription(restaurantId);
    if (!subscription) {
      throw new ForbiddenException('No active subscription or trial found for this restaurant.');
    }

    const plan = subscription.plan;
    const limits = (plan.limits as Record<string, number>) || {};
    const limitValue = limits[limitType];

    if (limitValue === undefined || limitValue === -1) {
      return; // No limit defined
    }

    let currentUsage = 0;

    switch (limitType) {
      case 'maxTables':
        currentUsage = await this.prisma.table.count({
          where: {
            diningArea: {
              branch: {
                restaurantId,
              },
            },
          },
        });
        if (currentUsage >= limitValue) {
          throw new BadRequestException(`Table limit reached (${limitValue} tables). Upgrade your plan to add more tables.`);
        }
        break;

      case 'maxStaff':
        const restaurant = await this.prisma.restaurant.findUnique({
          where: { id: restaurantId },
          select: { tenantId: true },
        });
        if (restaurant) {
          currentUsage = await this.prisma.tenantMembership.count({
            where: { tenantId: restaurant.tenantId },
          });
          if (currentUsage >= limitValue) {
            throw new BadRequestException(`Staff limit reached (${limitValue} staff). Upgrade your plan to add more staff.`);
          }
        }
        break;

      case 'maxBranches':
        currentUsage = await this.prisma.branch.count({
          where: { restaurantId },
        });
        if (currentUsage >= limitValue) {
          throw new BadRequestException(`Branch limit reached (${limitValue} branches). Upgrade your plan to add more branches.`);
        }
        break;

      case 'maxMenus':
        currentUsage = await this.prisma.menu.count({
          where: { restaurantId },
        });
        if (currentUsage >= limitValue) {
          throw new BadRequestException(`Menu limit reached (${limitValue} menus). Upgrade your plan to add more menus.`);
        }
        break;
    }
  }

  async getUsageStats(restaurantId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });

    if (!subscription) {
      return {
        planName: 'No Subscription',
        status: 'EXPIRED',
        billingCycle: 'MONTHLY',
        nextBillingDate: null,
        usage: {
          tables: { current: 0, limit: 0 },
          staff: { current: 0, limit: 0 },
          branches: { current: 0, limit: 0 },
          menus: { current: 0, limit: 0 },
        },
      };
    }

    const limits = (subscription.plan.limits as Record<string, number>) || {};

    const tablesCount = await this.prisma.table.count({
      where: { diningArea: { branch: { restaurantId } } },
    });

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { tenantId: true },
    });

    const staffCount = restaurant
      ? await this.prisma.tenantMembership.count({ where: { tenantId: restaurant.tenantId } })
      : 0;

    const branchesCount = await this.prisma.branch.count({
      where: { restaurantId },
    });

    const menusCount = await this.prisma.menu.count({
      where: { restaurantId },
    });

    return {
      planName: subscription.plan.name,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      nextBillingDate: subscription.status === 'TRIALING' ? subscription.trialEnd : subscription.currentPeriodEnd,
      usage: {
        tables: { current: tablesCount, limit: limits.maxTables ?? 0 },
        staff: { current: staffCount, limit: limits.maxStaff ?? 0 },
        branches: { current: branchesCount, limit: limits.maxBranches ?? 0 },
        menus: { current: menusCount, limit: limits.maxMenus ?? 0 },
      },
    };
  }
}
