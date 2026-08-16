import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../../../database/prisma/prisma.service';
import {
  CacheKeys,
  CacheTtl,
  TtlCacheService,
} from '../../../common/cache/ttl-cache.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cache: TtlCacheService,
  ) {
    const secret = configService.get<string>('jwt.secret');

    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: string; email: string; role: string; sessionId?: string }) {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }

    // Session and user are independent lookups — issue them together so the
    // request pays one round trip instead of two.
    const [session, user] = await Promise.all([
      payload.sessionId
        ? this.cache.wrap(
            CacheKeys.session(payload.sessionId),
            CacheTtl.session,
            () =>
              this.prisma.session.findUnique({
                where: { id: payload.sessionId as string },
                select: { id: true, revokedAt: true, expiresAt: true },
              }),
          )
        : Promise.resolve(null),
      this.cache.wrap(CacheKeys.user(payload.sub), CacheTtl.user, () =>
        this.prisma.user.findUnique({
          where: { id: payload.sub },
          select: { id: true, email: true, role: true, status: true },
        }),
      ),
    ]);

    if (payload.sessionId) {
      if (!session || session.revokedAt) {
        throw new UnauthorizedException('Session has been revoked');
      }
      if (session.expiresAt && session.expiresAt < new Date()) {
        throw new UnauthorizedException('Session has expired');
      }
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId: payload.sessionId,
    };
  }
}
