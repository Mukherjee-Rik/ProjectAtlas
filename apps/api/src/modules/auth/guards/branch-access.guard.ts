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
import { BRANCH_HEADER } from '../constants/tenant.constants';
import type { CurrentBranch } from '../types/current-branch.type';

@Injectable()
export class BranchAccessGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: TtlCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const branchHeaderValue = request.headers[BRANCH_HEADER];
    const branchId =
      (typeof branchHeaderValue === 'string' ? branchHeaderValue : undefined) ||
      request.params?.branchId ||
      request.query?.branchId ||
      request.body?.branchId;

    if (!branchId) {
      return true;
    }

    if (!isUUID(branchId)) {
      throw new BadRequestException('Invalid branch ID');
    }

    const branch = await this.cache.wrap(
      CacheKeys.branch(branchId),
      CacheTtl.branch,
      () =>
        this.prisma.branch.findUnique({
          where: { id: branchId },
          select: {
            id: true,
            name: true,
            code: true,
            restaurantId: true,
            restaurant: {
              select: {
                id: true,
                tenantId: true,
              },
            },
          },
        }),
    );

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const user = request.user;
    if (user && user.role !== 'PLATFORM_ADMIN') {
      if (request.tenant && branch.restaurant.tenantId !== request.tenant.id) {
        throw new ForbiddenException(
          'Target branch does not belong to current active tenant',
        );
      }

      if (
        request.restaurant &&
        branch.restaurantId !== request.restaurant.id
      ) {
        throw new ForbiddenException(
          'Target branch does not belong to current active restaurant',
        );
      }

      const membership = await this.cache.wrap(
        CacheKeys.membership(user.id, branch.restaurant.tenantId),
        CacheTtl.membership,
        () =>
          this.prisma.tenantMembership.findUnique({
            where: {
              userId_tenantId: {
                userId: user.id,
                tenantId: branch.restaurant.tenantId,
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
        throw new ForbiddenException('You do not have access to this branch');
      }

      if (membership.role !== 'OWNER' && user.role !== 'OWNER') {
        // Non-owner staff (WAITER, CASHIER, KITCHEN, MANAGER, STAFF) can only access their designated branch
        const primaryBranch = await this.cache.wrap(
          `primary_branch:${branch.restaurantId}`,
          CacheTtl.branch,
          () =>
            this.prisma.branch.findFirst({
              where: { restaurantId: branch.restaurantId },
              orderBy: { createdAt: 'asc' },
              select: { id: true },
            }),
        );

        if (primaryBranch && primaryBranch.id !== branch.id) {
          throw new ForbiddenException(
            'Access denied: Staff members can only access their assigned branch. Only the restaurant owner can access all branches.',
          );
        }
      }

      if (!request.tenant && membership.tenant) {
        request.tenant = {
          id: membership.tenant.id,
          name: membership.tenant.name,
          slug: membership.tenant.slug,
          status: membership.tenant.status,
        };
      }

      if (!request.restaurant) {
        request.restaurant = {
          id: branch.restaurant.id,
          name: branch.name,
          tenantId: branch.restaurant.tenantId,
        };
      }
    }

    const currentBranch: CurrentBranch = {
      id: branch.id,
      name: branch.name,
      code: branch.code,
      restaurantId: branch.restaurantId,
      tenantId: branch.restaurant.tenantId,
    };

    request.branch = currentBranch;
    return true;
  }
}
