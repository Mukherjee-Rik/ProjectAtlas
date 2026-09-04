import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../database/prisma/prisma.service';
import {
  CacheKeys,
  CacheTtl,
  TtlCacheService,
} from '../../../common/cache/ttl-cache.service';
import { RESTAURANT_HEADER } from '../constants/tenant.constants';
import { REQUIRES_FEATURE_KEY } from '../decorators/requires-feature.decorator';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
    private readonly cache: TtlCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    // Platform Admins bypass subscription checks
    if (user.role === 'PLATFORM_ADMIN') {
      return true;
    }

    // Resolve restaurant ID
    const restaurantHeaderValue = request.headers['x-restaurant-id'];
    const restaurantId =
      (typeof restaurantHeaderValue === 'string'
        ? restaurantHeaderValue
        : undefined) ||
      request.params?.restaurantId ||
      request.query?.restaurantId ||
      request.body?.restaurantId ||
      request.restaurant?.id;

    // If no restaurant context, bypass guard
    if (!restaurantId) {
      return true;
    }

    // Fetch active subscription
    const subscription = await this.cache.wrap(
      CacheKeys.subscription(restaurantId),
      CacheTtl.subscription,
      () =>
        this.prisma.subscription.findFirst({
          where: {
            restaurantId,
          },
          include: {
            plan: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
    );

    if (!subscription) {
      throw new ForbiddenException(
        'No active subscription or trial found for this restaurant.',
      );
    }

    // Check if trial has expired (automated check)
    if (subscription.status === 'TRIALING' && subscription.trialEnd) {
      const now = new Date();
      if (now > new Date(subscription.trialEnd)) {
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'EXPIRED' },
        });
        // Drop the cached TRIALING row so the next request sees EXPIRED.
        this.cache.invalidate(CacheKeys.subscription(restaurantId));
        throw new ForbiddenException(
          'Your trial has expired. Please choose a paid plan to restore access.',
        );
      }
    }

    // Enforce active status
    if (subscription.status === 'CANCELLED') {
      const now = new Date();
      if (
        !subscription.currentPeriodEnd ||
        now > new Date(subscription.currentPeriodEnd)
      ) {
        throw new ForbiddenException(
          'Your subscription has been cancelled and the billing period has ended. Please subscribe to restore access.',
        );
      }
      // Still within the paid cycle: allow access
    } else {
      const allowedStatuses = ['ACTIVE', 'TRIALING'];
      if (!allowedStatuses.includes(subscription.status)) {
        throw new ForbiddenException(
          `Subscription status is ${subscription.status}. Access is restricted.`,
        );
      }
    }

    // Check feature requirements
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      REQUIRES_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredFeature) {
      const planName = (subscription.plan?.name || '').trim().toLowerCase();

      // Enterprise tier grants ALL features unconditionally
      if (planName === 'enterprise' || planName.includes('enterprise')) {
        return true;
      }

      // Extract and normalize features from plan (support snake_case & kebab-case)
      const rawFeatures = (subscription.plan?.features as string[]) || [];
      const normalizedFeatures = new Set(
        rawFeatures.flatMap((f) => [
          f.toLowerCase().trim(),
          f.toLowerCase().trim().replace(/-/g, '_'),
          f.toLowerCase().trim().replace(/_/g, '-'),
        ]),
      );

      // Add default tier features if Growth / Professional
      if (planName.includes('growth') || planName.includes('pro')) {
        normalizedFeatures.add('ai_copilot');
        normalizedFeatures.add('ai-copilot');
        normalizedFeatures.add('analytics');
        normalizedFeatures.add('automations');
        normalizedFeatures.add('reports');
        normalizedFeatures.add('forecasts');
      }

      const req = requiredFeature.toLowerCase().trim();
      const reqSnake = req.replace(/-/g, '_');
      const reqKebab = req.replace(/_/g, '-');

      const hasAccess =
        normalizedFeatures.has(req) ||
        normalizedFeatures.has(reqSnake) ||
        normalizedFeatures.has(reqKebab);

      if (!hasAccess) {
        throw new ForbiddenException(
          `Your subscription plan (${subscription.plan?.name || 'Current'}) does not support this feature (${requiredFeature}). Please upgrade your plan to access this feature.`,
        );
      }
    }

    return true;
  }
}
