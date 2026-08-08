import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../../database/prisma/prisma.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: any;
  let configService: any;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue('supersecretjwtkey'),
    };
    prismaService = {
      user: {
        findUnique: jest.fn(),
      },
    };

    strategy = new JwtStrategy(
      configService as ConfigService,
      prismaService as PrismaService,
    );
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate and return active user info', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'u-1',
      email: 'active@example.com',
      role: 'USER',
      status: 'ACTIVE',
    });

    const result = await strategy.validate({
      sub: 'u-1',
      email: 'active@example.com',
      role: 'USER',
    });

    expect(result).toEqual({
      id: 'u-1',
      email: 'active@example.com',
      role: 'USER',
    });
  });

  it('should throw UnauthorizedException if sub payload is missing', async () => {
    await expect(
      strategy.validate({ sub: '', email: 'test@example.com', role: 'USER' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if user is not found in database', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: 'nonexistent',
        email: 'test@example.com',
        role: 'USER',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if user status is SUSPENDED', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'u-1',
      email: 'suspended@example.com',
      role: 'USER',
      status: 'SUSPENDED',
    });

    await expect(
      strategy.validate({
        sub: 'u-1',
        email: 'suspended@example.com',
        role: 'USER',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if user status is INACTIVE', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'u-1',
      email: 'inactive@example.com',
      role: 'USER',
      status: 'INACTIVE',
    });

    await expect(
      strategy.validate({
        sub: 'u-1',
        email: 'inactive@example.com',
        role: 'USER',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
