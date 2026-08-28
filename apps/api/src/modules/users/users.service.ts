import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { UserRole } from '../../generated/prisma/enums';
import { CacheKeys, TtlCacheService } from '../../common/cache/ttl-cache.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: TtlCacheService,
  ) {}

  async findAll(query: UsersQueryDto = new UsersQueryDto(), tenantId?: string) {
    const {
      search,
      role,
      status,
      page = 1,
      limit = 10,
    } = query;

    const where: any = {
      ...(role !== undefined && { role }),
      ...(status !== undefined && { status }),
      ...(tenantId && {
        memberships: {
          some: {
            tenantId,
          },
        },
      }),
      ...(search?.trim() && {
        OR: [
          {
            name: {
              contains: search.trim(),
              mode: 'insensitive' as const,
            },
          },
          {
            email: {
              contains: search.trim(),
              mode: 'insensitive' as const,
            },
          },
          {
            phone: {
              contains: search.trim(),
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
    };

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          memberships: {
            select: {
              role: true,
              tenant: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),

      this.prisma.user.count({
        where,
      }),
    ]);

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findById(id: string, tenantId?: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        ...(tenantId && {
          memberships: {
            some: {
              tenantId,
            },
          },
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          select: {
            role: true,
            tenant: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, tenantId?: string) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        id,
        ...(tenantId && {
          memberships: {
            some: {
              tenantId,
            },
          },
        }),
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const { name, email, phone, role, status } = updateUserDto;

    if (email || phone) {
      const duplicateUser = await this.prisma.user.findFirst({
        where: {
          OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
          NOT: {
            id,
          },
        },
      });

      if (duplicateUser) {
        throw new ConflictException(
          'Another user with this email or phone already exists',
        );
      }
    }

    const updated = await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(role !== undefined && { role }),
        ...(status !== undefined && { status }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Role and status gate access, so evict once the write has committed —
    // evicting earlier would let a concurrent read cache the stale row again.
    this.cache.invalidate(CacheKeys.user(id));

    return updated;
  }

  async updateMyProfile(id: string, updateMyProfileDto: UpdateMyProfileDto) {
    const { name, phone } = updateMyProfileDto;

    if (phone) {
      const duplicateUser = await this.prisma.user.findFirst({
        where: {
          phone,
          NOT: {
            id,
          },
        },
      });

      if (duplicateUser) {
        throw new ConflictException('Another user with this phone already exists');
      }
    }

    const updated = await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.cache.invalidate(CacheKeys.user(id));

    return updated;
  }

  async remove(id: string, currentUserId: string, tenantId?: string) {
    if (id === currentUserId) {
      throw new ConflictException(
        'You cannot deactivate your own account',
      );
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        id,
        ...(tenantId && {
          memberships: {
            some: {
              tenantId,
            },
          },
        }),
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    if (existingUser.status === 'INACTIVE') {
      throw new ConflictException('User is already inactive');
    }

    const deactivated = await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        status: 'INACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // A deactivated user must lose access on their next request, not when
    // the cache entry happens to expire.
    this.cache.invalidate(CacheKeys.user(id));

    return deactivated;
  }

  async create(createUserDto: CreateUserDto, tenantId?: string) {
    const name = createUserDto.name.trim();
    const email = createUserDto.email.trim().toLowerCase();
    const phone = createUserDto.phone?.trim() || null;
    const { password, role } = createUserDto;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(phone ? [{ phone }] : [])],
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email or phone already exists',
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const assignedRole = role || UserRole.STAFF;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash,
          role: assignedRole,
        },
      });

      if (tenantId) {
        await tx.tenantMembership.create({
          data: {
            userId: user.id,
            tenantId,
            role: assignedRole,
          },
        });
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    });
  }
}
