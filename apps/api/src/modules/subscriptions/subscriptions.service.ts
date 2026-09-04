import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  CacheKeys,
  TtlCacheService,
} from '../../common/cache/ttl-cache.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: TtlCacheService,
  ) {}

  // ==========================================
  // PLANS MANAGEMENT (Platform Admin CRUD)
  // ==========================================

  async createPlan(data: {
    name: string;
    price: number;
    currency?: string;
    billingCycle: 'MONTHLY' | 'YEARLY';
    trialDays?: number;
    description?: string;
    features: string[];
    limits: Record<string, number>;
  }) {
    return this.prisma.plan.create({
      data: {
        name: data.name,
        price: data.price,
        currency: data.currency ?? 'INR',
        billingCycle: data.billingCycle,
        trialDays: data.trialDays ?? 14,
        description: data.description,
        features: data.features,
        limits: data.limits,
      },
    });
  }

  async findAllPlans() {
    return this.prisma.plan.findMany({
      orderBy: { price: 'asc' },
    });
  }

  async findPlanById(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async updatePlan(id: string, data: any) {
    await this.findPlanById(id);
    return this.prisma.plan.update({
      where: { id },
      data,
    });
  }

  async deletePlan(id: string) {
    await this.findPlanById(id);
    // Check if there are active subscriptions using this plan
    const subCount = await this.prisma.subscription.count({
      where: { planId: id, status: { in: ['ACTIVE', 'TRIALING'] } },
    });
    if (subCount > 0) {
      throw new BadRequestException(
        'Cannot delete plan with active subscriptions.',
      );
    }
    return this.prisma.plan.delete({ where: { id } });
  }

  // ==========================================
  // SUBSCRIPTIONS OPERATIONS
  // ==========================================

  async findAllSubscriptions() {
    return this.prisma.subscription.findMany({
      include: {
        plan: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRestaurantSubscription(restaurantId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
    if (!subscription) {
      throw new NotFoundException('No subscription found for this restaurant.');
    }
    return subscription;
  }

  async assignSubscription(restaurantId: string, planId: string) {
    const plan = await this.findPlanById(planId);

    // Invalidate existing subscriptions
    await this.prisma.subscription.updateMany({
      where: { restaurantId, status: { in: ['ACTIVE', 'TRIALING'] } },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    const now = new Date();
    const periodEnd = new Date();
    if (plan.billingCycle === 'YEARLY') {
      periodEnd.setFullYear(now.getFullYear() + 1);
    } else {
      periodEnd.setMonth(now.getMonth() + 1);
    }

    const created = await this.prisma.subscription.create({
      data: {
        restaurantId,
        planId,
        status: 'ACTIVE',
        billingCycle: plan.billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      include: { plan: true },
    });

    // The subscription guard caches per restaurant — a plan change must be
    // visible on the next request, not one TTL later.
    this.cache.invalidate(CacheKeys.subscription(restaurantId));

    return created;
  }

  async extendTrial(subscriptionId: string, extensionDays: number) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.status !== 'TRIALING') {
      throw new BadRequestException(
        'Can only extend trials for subscriptions in TRIALING status.',
      );
    }

    const currentTrialEnd = subscription.trialEnd
      ? new Date(subscription.trialEnd)
      : new Date();
    currentTrialEnd.setDate(currentTrialEnd.getDate() + extensionDays);

    const extended = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        trialEnd: currentTrialEnd,
        currentPeriodEnd: currentTrialEnd, // current period is the trial period
      },
      include: { plan: true },
    });

    this.cache.invalidate(CacheKeys.subscription(subscription.restaurantId));

    return extended;
  }

  async updateStatus(subscriptionId: string, status: any) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');

    const data: any = { status };
    if (status === 'CANCELLED') {
      data.cancelledAt = new Date();
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data,
      include: { plan: true },
    });

    // Suspending or cancelling must revoke access immediately.
    this.cache.invalidate(CacheKeys.subscription(subscription.restaurantId));

    return updated;
  }

  async cancelRestaurantSubscription(restaurantId: string, reason?: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        restaurantId,
        status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
      },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException(
        'No active or trialing subscription found to cancel.',
      );
    }

    const cancelled = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
      include: { plan: true },
    });

    this.cache.invalidate(CacheKeys.subscription(restaurantId));

    return {
      subscription: cancelled,
      message: `Subscription successfully cancelled. Your restaurant retains full access until ${cancelled.currentPeriodEnd ? new Date(cancelled.currentPeriodEnd).toLocaleDateString() : 'the end of your billing cycle'}.`,
      effectiveUntil: cancelled.currentPeriodEnd,
      cancelledAt: cancelled.cancelledAt,
    };
  }
}
