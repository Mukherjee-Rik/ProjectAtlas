import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto) {
    const { name, slug, status } = createTenantDto;

    const existingTenant = await this.prisma.tenant.findUnique({
      where: {
        slug,
      },
    });

    if (existingTenant) {
      throw new ConflictException('Tenant with this slug already exists');
    }

    return this.prisma.tenant.create({
      data: {
        name,
        slug,
        ...(status !== undefined && { status }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        restaurants: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }
}
