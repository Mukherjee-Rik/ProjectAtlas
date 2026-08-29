import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { SubscriptionUsageService } from '../subscriptions/subscription-usage.service';

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionUsageService: SubscriptionUsageService,
  ) {}

  async create(tenantId: string, createBranchDto: CreateBranchDto) {
    const {
      restaurantId,
      name,
      code,
      address,
      city,
      state,
      postalCode,
      phone,
      status,
    } = createBranchDto;

    // Enforce active subscription branch limit
    await this.subscriptionUsageService.checkLimit(restaurantId, 'maxBranches');

    // Security Verification: Restaurant must belong to the tenantId
    const restaurant = await this.prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        tenantId,
      },
    });

    if (!restaurant) {
      throw new ForbiddenException(
        'Restaurant does not belong to your organization',
      );
    }

    const existingBranch = await this.prisma.branch.findUnique({
      where: {
        restaurantId_code: {
          restaurantId,
          code,
        },
      },
    });

    if (existingBranch) {
      throw new ConflictException(
        'A branch with this code already exists for this restaurant',
      );
    }

    return this.prisma.branch.create({
      data: {
        restaurantId,
        name,
        code,
        address,
        city,
        state,
        postalCode,
        phone,
        ...(status !== undefined && { status }),
      },
      select: {
        id: true,
        restaurantId: true,
        name: true,
        code: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            tenantId: true,
          },
        },
      },
    });
  }

  async findAll(tenantId: string, restaurantId?: string, user?: any) {
    const branches = await this.prisma.branch.findMany({
      where: {
        restaurant: {
          tenantId,
        },
        ...(restaurantId && { restaurantId }),
      },
      select: {
        id: true,
        restaurantId: true,
        name: true,
        code: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (user && user.role !== 'OWNER' && user.role !== 'PLATFORM_ADMIN') {
      // Non-owner staff (waiter, cashier, kitchen, manager, staff) only have access to their own branch
      return branches.slice(0, 1);
    }

    return branches;
  }

  async findById(id: string, tenantId: string, user?: any) {
    const branch = await this.prisma.branch.findFirst({
      where: {
        id,
        restaurant: {
          tenantId,
        },
      },
      select: {
        id: true,
        restaurantId: true,
        name: true,
        code: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            tenantId: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (user && user.role !== 'OWNER' && user.role !== 'PLATFORM_ADMIN') {
      const primaryBranch = await this.prisma.branch.findFirst({
        where: { restaurantId: branch.restaurantId },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });

      if (primaryBranch && primaryBranch.id !== branch.id) {
        throw new ForbiddenException(
          'Access denied: Staff members can only access their assigned branch. Only the restaurant owner has access to all branches.',
        );
      }
    }

    return branch;
  }

  async update(id: string, tenantId: string, updateBranchDto: UpdateBranchDto) {
    const existingBranch = await this.prisma.branch.findFirst({
      where: {
        id,
        restaurant: {
          tenantId,
        },
      },
    });

    if (!existingBranch) {
      throw new ForbiddenException(
        'Branch not found or does not belong to your organization',
      );
    }

    const { name, code, address, city, state, postalCode, phone, status } =
      updateBranchDto;

    if (code && code !== existingBranch.code) {
      const duplicateBranch = await this.prisma.branch.findUnique({
        where: {
          restaurantId_code: {
            restaurantId: existingBranch.restaurantId,
            code,
          },
        },
      });

      if (duplicateBranch) {
        throw new ConflictException(
          'Another branch with this code already exists for this restaurant',
        );
      }
    }

    return this.prisma.branch.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(postalCode !== undefined && { postalCode }),
        ...(phone !== undefined && { phone }),
        ...(status !== undefined && { status }),
      },
      select: {
        id: true,
        restaurantId: true,
        name: true,
        code: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async remove(id: string, tenantId: string) {
    const existingBranch = await this.prisma.branch.findFirst({
      where: {
        id,
        restaurant: {
          tenantId,
        },
      },
    });

    if (!existingBranch) {
      throw new ForbiddenException(
        'Branch not found or does not belong to your organization',
      );
    }

    return this.prisma.branch.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });
  }
}
