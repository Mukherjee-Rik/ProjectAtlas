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
import { TENANT_HEADER } from '../constants/tenant.constants';
import type { CurrentTenant } from '../types/current-tenant.type';

@Injectable()
export class TenantAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
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

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const currentTenant: CurrentTenant = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
    };

    // Platform ADMINs have global management access
    if (user.role === 'ADMIN') {
      request.tenant = currentTenant;
      return true;
    }

    const membership = await this.prisma.tenantMembership.findUnique({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    request.tenant = currentTenant;
    return true;
  }
}
