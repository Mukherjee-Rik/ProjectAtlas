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
import { BRANCH_HEADER } from '../constants/tenant.constants';
import type { CurrentBranch } from '../types/current-branch.type';

@Injectable()
export class BranchAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

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

    const branch = await this.prisma.branch.findUnique({
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
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

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
