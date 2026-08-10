import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, createRestaurantDto: CreateRestaurantDto) {
    const { name, slug, status } = createRestaurantDto;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const existingRestaurant = await this.prisma.restaurant.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug,
        },
      },
    });

    if (existingRestaurant) {
      throw new ConflictException(
        'A restaurant with this slug already exists under this tenant',
      );
    }

    return this.prisma.restaurant.create({
      data: {
        tenantId,
        name,
        slug,
        ...(status !== undefined && { status }),
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.restaurant.findMany({
      where: {
        tenantId,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string, tenantId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: {
        id,
        tenantId,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }
}
