import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { PrismaService } from '../../../database/prisma/prisma.service';
import {
  CacheKeys,
  CacheTtl,
  TtlCacheService,
} from '../../../common/cache/ttl-cache.service';
import { RESTAURANT_HEADER } from '../constants/tenant.constants';
import type { CurrentRestaurant } from '../types/current-restaurant.type';

@Injectable()
export class RestaurantAccessGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: TtlCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const restaurantHeaderValue = request.headers[RESTAURANT_HEADER];
    const restaurantId =
      (typeof restaurantHeaderValue === 'string'
        ? restaurantHeaderValue
        : undefined) ||
      request.params?.restaurantId ||
      request.query?.restaurantId ||
      request.body?.restaurantId;

    if (!restaurantId) {
      return true;
    }

    if (!isUUID(restaurantId)) {
      throw new BadRequestException('Invalid restaurant ID');
    }

    const restaurant = await this.cache.wrap(
      CacheKeys.restaurant(restaurantId),
      CacheTtl.restaurant,
      () =>
        this.prisma.restaurant.findUnique({
          where: { id: restaurantId },
          select: {
            id: true,
            name: true,
            tenantId: true,
          },
        }),
    );

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const user = request.user;
    if (user && user.role !== 'PLATFORM_ADMIN') {
      if (request.tenant && restaurant.tenantId !== request.tenant.id) {
        throw new ForbiddenException(
          'Target restaurant does not belong to current active tenant',
        );
      }

      const membership = await this.cache.wrap(
        CacheKeys.membership(user.id, restaurant.tenantId),
        CacheTtl.membership,
        () =>
          this.prisma.tenantMembership.findUnique({
            where: {
              userId_tenantId: {
                userId: user.id,
                tenantId: restaurant.tenantId,
              },
            },
            select: {
              id: true,
              role: true,
              tenant: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  status: true,
                },
              },
            },
          }),
      );

      if (!membership) {
        throw new ForbiddenException(
          'You do not have access to this restaurant',
        );
      }

      if (!request.tenant && membership.tenant) {
        request.tenant = {
          id: membership.tenant.id,
          name: membership.tenant.name,
          slug: membership.tenant.slug,
          status: membership.tenant.status,
        };
      }
    }

    const currentRestaurant: CurrentRestaurant = {
      id: restaurant.id,
      name: restaurant.name,
      tenantId: restaurant.tenantId,
    };

    request.restaurant = currentRestaurant;
    return true;
  }
}
