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
import { TENANT_HEADER } from '../constants/tenant.constants';
import type { CurrentTenant } from '../types/current-tenant.type';

const TENANT_SELECT = {
  id: true,
  name: true,
  slug: true,
  status: true,
} as const;

@Injectable()
export class TenantAccessGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: TtlCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    // Platform ADMINs / PLATFORM_ADMINs have global management access and bypass scoping
    if (user.role === 'PLATFORM_ADMIN' || user.role === 'ADMIN') {
      const tenantHeaderValue = request.headers[TENANT_HEADER];
      const tenantId =
        (typeof tenantHeaderValue === 'string' ? tenantHeaderValue : undefined) ||
        request.params?.tenantId ||
        request.query?.tenantId ||
        request.body?.tenantId;

      if (tenantId && isUUID(tenantId)) {
        const tenant = await this.cache.wrap(
          CacheKeys.tenant(tenantId),
          CacheTtl.tenant,
          () =>
            this.prisma.tenant.findUnique({
              where: { id: tenantId },
              select: TENANT_SELECT,
            }),
        );
        if (tenant) {
          request.tenant = {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            status: tenant.status,
          };
        }
      }
      return true;
    }

    const tenantHeaderValue = request.headers[TENANT_HEADER];
    const tenantId =
      (typeof tenantHeaderValue === 'string' ? tenantHeaderValue : undefined) ||
      request.params?.tenantId ||
      request.query?.tenantId ||
      request.body?.tenantId;

    if (!tenantId) {
      throw new BadRequestException('No tenant selected');
    }

    if (!isUUID(tenantId)) {
      throw new BadRequestException('Invalid tenant ID');
    }

    // One query resolves both "does this tenant exist" and "may this user use
    // it" — the membership row carries the tenant. Previously these were two
    // sequential round trips on every single request.
    const membership = await this.cache.wrap(
      CacheKeys.membership(user.id, tenantId),
      CacheTtl.membership,
      () =>
        this.prisma.tenantMembership.findUnique({
          where: { userId_tenantId: { userId: user.id, tenantId } },
          select: { id: true, tenant: { select: TENANT_SELECT } },
        }),
    );

    if (!membership) {
      // Only on the failure path do we pay a second query, so an unknown
      // tenant still reports 404 rather than a misleading 403.
      const tenantExists = await this.cache.wrap(
        CacheKeys.tenant(tenantId),
        CacheTtl.tenant,
        () =>
          this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: TENANT_SELECT,
          }),
      );

      if (!tenantExists) {
        throw new NotFoundException('Tenant not found');
      }

      throw new ForbiddenException('You do not have access to this tenant');
    }

    const currentTenant: CurrentTenant = {
      id: membership.tenant.id,
      name: membership.tenant.name,
      slug: membership.tenant.slug,
      status: membership.tenant.status,
    };

    request.tenant = currentTenant;
    return true;
  }
}
