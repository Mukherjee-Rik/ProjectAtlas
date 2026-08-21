import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { SubscriptionUsageService } from '../subscriptions/subscription-usage.service';
import { CacheKeys, TtlCacheService } from '../../common/cache/ttl-cache.service';

@Injectable()
export class TenantMembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionUsageService: SubscriptionUsageService,
    private readonly cache: TtlCacheService,
  ) {}

  async create(createMembershipDto: CreateMembershipDto) {
    const { userId, tenantId, role } = createMembershipDto;

    // Check staff limit based on the first restaurant under this tenant
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { tenantId },
      select: { id: true },
    });
    if (restaurant) {
      await this.subscriptionUsageService.checkLimit(restaurant.id, 'maxStaff');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const existingMembership = await this.prisma.tenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException('User is already a member of this tenant');
    }

    return this.prisma.tenantMembership.create({
      data: {
        userId,
        tenantId,
        role,
      },
      select: {
        id: true,
        userId: true,
        tenantId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    const membership = await this.prisma.tenantMembership.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        tenantId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Tenant membership not found');
    }

    return membership;
  }

  async findByUser(userId: string) {
    return this.prisma.tenantMembership.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        tenantId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByTenant(tenantId: string) {
    return this.prisma.tenantMembership.findMany({
      where: { tenantId },
      select: {
        id: true,
        userId: true,
        tenantId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByIdForUser(id: string, userId: string, role: string, activeTenantId?: string) {
    const membership = await this.findById(id);
    if (role !== 'PLATFORM_ADMIN') {
      if (activeTenantId && membership.tenantId !== activeTenantId) {
        throw new NotFoundException('Tenant membership not found');
      }
      const userHasAccess = await this.prisma.tenantMembership.findUnique({
        where: { userId_tenantId: { userId, tenantId: membership.tenantId } },
      });
      if (!userHasAccess) {
        throw new NotFoundException('Tenant membership not found');
      }
    }
    return membership;
  }

  async updateForUser(id: string, updateMembershipDto: UpdateMembershipDto, userId: string, role: string, activeTenantId?: string) {
    const existing = await this.prisma.tenantMembership.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Tenant membership not found');
    }
    if (role !== 'PLATFORM_ADMIN') {
      if (activeTenantId && existing.tenantId !== activeTenantId) {
        throw new NotFoundException('Tenant membership not found');
      }
      const userHasAccess = await this.prisma.tenantMembership.findUnique({
        where: { userId_tenantId: { userId, tenantId: existing.tenantId } },
      });
      if (!userHasAccess) {
        throw new NotFoundException('Tenant membership not found');
      }
    }
    return this.update(id, updateMembershipDto);
  }

  async removeForUser(id: string, userId: string, role: string, activeTenantId?: string) {
    const existing = await this.prisma.tenantMembership.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Tenant membership not found');
    }
    if (role !== 'PLATFORM_ADMIN') {
      if (activeTenantId && existing.tenantId !== activeTenantId) {
        throw new NotFoundException('Tenant membership not found');
      }
      const userHasAccess = await this.prisma.tenantMembership.findUnique({
        where: { userId_tenantId: { userId, tenantId: existing.tenantId } },
      });
      if (!userHasAccess) {
        throw new NotFoundException('Tenant membership not found');
      }
    }
    return this.remove(id);
  }

  async update(id: string, updateMembershipDto: UpdateMembershipDto) {
    const existing = await this.prisma.tenantMembership.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Tenant membership not found');
    }

    const updated = await this.prisma.tenantMembership.update({
      where: { id },
      data: {
        role: updateMembershipDto.role,
      },
      select: {
        id: true,
        userId: true,
        tenantId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.cache.invalidate(
      CacheKeys.membership(existing.userId, existing.tenantId),
    );

    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.tenantMembership.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Tenant membership not found');
    }

    const removed = await this.prisma.tenantMembership.delete({
      where: { id },
      select: {
        id: true,
        userId: true,
        tenantId: true,
      },
    });

    // Revoking membership must take away tenant access immediately.
    this.cache.invalidate(
      CacheKeys.membership(removed.userId, removed.tenantId),
    );

    return removed;
  }
}
