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

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: UsersQueryDto = new UsersQueryDto()) {
    const {
      search,
      role,
      status,
      page = 1,
      limit = 10,
    } = query;

    const where = {
      ...(role !== undefined && {
        role,
      }),

      ...(status !== undefined && {
        status,
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

  async findById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
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

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        id,
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

    return this.prisma.user.update({
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

    return this.prisma.user.update({
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
  }

  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new ConflictException(
        'You cannot deactivate your own account',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    if (existingUser.status === 'INACTIVE') {
      throw new ConflictException('User is already inactive');
    }

    return this.prisma.user.update({
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
  }

  async create(createUserDto: CreateUserDto) {
    const { name, email, phone, password, role } = createUserDto;

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

    return this.prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        ...(role !== undefined && { role }),
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
  }
}
