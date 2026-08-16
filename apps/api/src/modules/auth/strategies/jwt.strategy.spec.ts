import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { TtlCacheService } from '../../../common/cache/ttl-cache.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: any;
  let configService: any;
  let cache: TtlCacheService;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue('supersecretjwtkey'),
    };
    prismaService = {
      user: {
        findUnique: jest.fn(),
      },
      session: {
        findUnique: jest.fn(),
      },
    };
    // A real cache instance, cleared per test, so the caching path is
    // exercised rather than stubbed away.
    cache = new TtlCacheService();

    strategy = new JwtStrategy(
      configService as ConfigService,
      prismaService as PrismaService,
      cache,
    );
  });

  afterEach(() => {
    cache.onModuleDestroy();
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

  it('should reject a revoked session', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'u-1',
      email: 'active@example.com',
      role: 'USER',
      status: 'ACTIVE',
    });
    prismaService.session.findUnique.mockResolvedValue({
      id: 's-1',
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(
      strategy.validate({
        sub: 'u-1',
        email: 'active@example.com',
        role: 'USER',
        sessionId: 's-1',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject an expired session', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'u-1',
      email: 'active@example.com',
      role: 'USER',
      status: 'ACTIVE',
    });
    prismaService.session.findUnique.mockResolvedValue({
      id: 's-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() - 60_000),
    });

    await expect(
      strategy.validate({
        sub: 'u-1',
        email: 'active@example.com',
        role: 'USER',
        sessionId: 's-1',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should serve repeat validations from cache instead of re-querying', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'u-1',
      email: 'active@example.com',
      role: 'USER',
      status: 'ACTIVE',
    });
    prismaService.session.findUnique.mockResolvedValue({
      id: 's-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const payload = {
      sub: 'u-1',
      email: 'active@example.com',
      role: 'USER',
      sessionId: 's-1',
    };

    await strategy.validate(payload);
    await strategy.validate(payload);
    await strategy.validate(payload);

    expect(prismaService.user.findUnique).toHaveBeenCalledTimes(1);
    expect(prismaService.session.findUnique).toHaveBeenCalledTimes(1);
  });

  it('should re-query after the cached session is invalidated', async () => {
    prismaService.user.findUnique.mockResolvedValue({
      id: 'u-1',
      email: 'active@example.com',
      role: 'USER',
      status: 'ACTIVE',
    });
    prismaService.session.findUnique.mockResolvedValue({
      id: 's-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const payload = {
      sub: 'u-1',
      email: 'active@example.com',
      role: 'USER',
      sessionId: 's-1',
    };

    await strategy.validate(payload);

    // Simulates logout evicting the session mid-TTL.
    cache.invalidate('session:s-1');
    prismaService.session.findUnique.mockResolvedValue({
      id: 's-1',
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(prismaService.session.findUnique).toHaveBeenCalledTimes(2);
  });

  it('should issue a single query when concurrent requests miss the same key', async () => {
    prismaService.user.findUnique.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                id: 'u-1',
                email: 'active@example.com',
                role: 'USER',
                status: 'ACTIVE',
              }),
            10,
          ),
        ),
    );

    const payload = { sub: 'u-1', email: 'active@example.com', role: 'USER' };

    await Promise.all([
      strategy.validate(payload),
      strategy.validate(payload),
      strategy.validate(payload),
    ]);

    expect(prismaService.user.findUnique).toHaveBeenCalledTimes(1);
  });
});
