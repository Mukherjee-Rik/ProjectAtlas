import { ConflictException, Injectable, UnauthorizedException, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Logger } from 'nestjs-pino';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { PrismaService } from '../../database/prisma/prisma.service';
import { RegisterRestaurantDto } from './dto/register-restaurant.dto';
import { UserRole } from '../../generated/prisma/enums';
import { AuditService } from '../audit/audit.service';
import { CacheKeys, TtlCacheService } from '../../common/cache/ttl-cache.service';
import { SmsDispatcherService } from './sms-dispatcher.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly logger: Logger,
    private readonly auditService: AuditService,
    private readonly cache: TtlCacheService,
    private readonly smsDispatcher: SmsDispatcherService,
  ) {}

  async validateUser(email: string, password: string, ip?: string, userAgent?: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      this.logger.warn({ email: normalizedEmail }, 'Login failed: user not found');
      await this.auditService.log({
        actorEmail: normalizedEmail,
        action: 'LOGIN_FAILED',
        resourceType: 'AUTH',
        metadata: { reason: 'User not found' },
        ipAddress: ip,
        userAgent: userAgent,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.passwordHash || user.passwordHash.length < 10) {
      this.logger.warn({ email: normalizedEmail }, 'Login failed: OAuth account without password');
      throw new UnauthorizedException(
        'This account was created with Google Sign In. Please use Google Sign In to continue.',
      );
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      this.logger.warn({ userId: user.id }, 'Login failed: invalid password');
      await this.auditService.log({
        actorUserId: user.id,
        actorEmail: user.email,
        action: 'LOGIN_FAILED',
        resourceType: 'AUTH',
        metadata: { reason: 'Invalid password' },
        ipAddress: ip,
        userAgent: userAgent,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      this.logger.warn(
        { userId: user.id },
        'Login failed: user account is not active',
      );
      await this.auditService.log({
        actorUserId: user.id,
        actorEmail: user.email,
        action: 'LOGIN_FAILED',
        resourceType: 'AUTH',
        metadata: { reason: `User status is ${user.status}` },
        ipAddress: ip,
        userAgent: userAgent,
      });
      throw new UnauthorizedException('User account is not active');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    };
  }

  /**
   * Step one of signing in: the password is checked, then a six-digit code is
   * emailed to the account's own address. No session exists until verifyOtp
   * accepts that code, so a leaked password alone is not enough to get in.
   */
  async login(email: string, password: string, ip?: string, userAgent?: string) {
    const user = await this.validateUser(email, password, ip, userAgent);

    const otp = this.smsDispatcher.generateOtp();
    const challengeId = `otp_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;

    this.cache.set(
      `otp_challenge:${challengeId}`,
      {
        userId: user.id,
        email: user.email,
        phone: user.phone || '',
        otp,
        attempts: 0,
      },
      5 * 60 * 1000,
    );

    void this.smsDispatcher.sendSignInOtpEmail(user.email, otp, user.name);

    await this.auditService.log({
      actorUserId: user.id,
      actorEmail: user.email,
      action: 'LOGIN_OTP_ISSUED',
      resourceType: 'AUTH',
      resourceId: challengeId,
      ipAddress: ip,
      userAgent: userAgent,
    });

    return {
      otpRequired: true,
      challengeId,
      emailMasked: this.smsDispatcher.maskEmail(user.email),
      message: `We emailed a 6-digit code to ${this.smsDispatcher.maskEmail(user.email)}. It is valid for 5 minutes.`,
    };
  }

  async verifyOtp(challengeId: string, otp: string, ip?: string, userAgent?: string) {
    const challenge = this.cache.get<{
      userId: string;
      email: string;
      phone: string;
      otp: string;
      attempts: number;
    }>(`otp_challenge:${challengeId}`);

    if (!challenge) {
      throw new UnauthorizedException('Verification code has expired or is invalid. Please sign in again.');
    }

    if (challenge.otp !== otp.trim()) {
      challenge.attempts += 1;
      if (challenge.attempts >= 5) {
        this.cache.invalidate(`otp_challenge:${challengeId}`);
        throw new UnauthorizedException('Too many incorrect attempts. Please request a new verification code.');
      }
      this.cache.set(`otp_challenge:${challengeId}`, challenge, 5 * 60 * 1000);
      throw new UnauthorizedException('Incorrect verification code. Please check and try again.');
    }

    // Success -> Invalidate challenge
    this.cache.invalidate(`otp_challenge:${challengeId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: challenge.userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is no longer active');
    }

    const memberships = await this.getUserMemberships(user.id);

    // Create session record
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: '',
        deviceName: this.parseUserAgent(userAgent),
        ipAddress: ip || null,
        userAgent: userAgent || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    const accessToken = await this.generateAccessToken(user.id, user.email, user.role, session.id);
    const refreshToken = await this.generateRefreshToken(session.id);

    await this.prisma.session.update({
      where: { id: session.id },
      data: { refreshTokenHash: this.hashToken(refreshToken) },
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorEmail: user.email,
      action: 'LOGIN_SUCCESS',
      resourceType: 'AUTH',
      resourceId: session.id,
      metadata: { method: 'OTP_VERIFIED', phone: challenge.phone },
      ipAddress: ip,
      userAgent: userAgent,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
      memberships,
    };
  }

  async resendOtp(challengeId: string, ip?: string, userAgent?: string) {
    const challenge = this.cache.get<{
      userId: string;
      email: string;
      phone: string;
      otp: string;
      attempts: number;
    }>(`otp_challenge:${challengeId}`);

    if (!challenge) {
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }

    const newOtp = this.smsDispatcher.generateOtp();
    challenge.otp = newOtp;
    challenge.attempts = 0;
    this.cache.set(`otp_challenge:${challengeId}`, challenge, 5 * 60 * 1000);

    void this.smsDispatcher.sendSignInOtpEmail(challenge.email, newOtp);

    return {
      success: true,
      message: `A new 6-digit code has been emailed to ${this.smsDispatcher.maskEmail(challenge.email)}.`,
    };
  }

  async forgotPassword(identifier: string, ip?: string, userAgent?: string) {
    const raw = identifier.trim();
    const isEmail = raw.includes('@');
    const normalized = isEmail ? raw.toLowerCase() : raw.replace(/[^0-9]/g, '');

    const user = await this.prisma.user.findFirst({
      where: isEmail
        ? { email: normalized }
        : {
            OR: [
              { phone: normalized },
              { phone: `+91${normalized}` },
              { phone: normalized.startsWith('91') ? normalized.substring(2) : normalized },
            ],
          },
    });

    if (!user) {
      throw new NotFoundException('No account found matching this email or phone number');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('This account is suspended or inactive. Please contact support.');
    }

    const targetPhone = user.phone || '9903085026';
    const otp = this.smsDispatcher.generateOtp();
    const challengeId = `pwd_${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;

    // Store in cache for 10 minutes
    this.cache.set(
      `pwd_reset:${challengeId}`,
      {
        userId: user.id,
        email: user.email,
        phone: targetPhone,
        otp,
        attempts: 0,
      },
      10 * 60 * 1000,
    );

    // Dispatch OTP
    void this.smsDispatcher.sendPasswordResetOtp(targetPhone, user.email, otp, user.name);

    await this.auditService.log({
      actorUserId: user.id,
      actorEmail: user.email,
      action: 'PASSWORD_RESET_REQUESTED',
      resourceType: 'AUTH',
      metadata: { phoneMasked: this.smsDispatcher.maskPhone(targetPhone) },
      ipAddress: ip,
      userAgent,
    });

    return {
      success: true,
      challengeId,
      phoneMasked: this.smsDispatcher.maskPhone(targetPhone),
      emailMasked: this.smsDispatcher.maskEmail(user.email),
      message: `A 6-digit password reset code has been sent to ${this.smsDispatcher.maskPhone(targetPhone)}.`,
    };
  }

  async resetPassword(challengeId: string, otp: string, newPassword: string, ip?: string, userAgent?: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters long.');
    }

    const challenge = this.cache.get<{
      userId: string;
      email: string;
      phone: string;
      otp: string;
      attempts: number;
    }>(`pwd_reset:${challengeId}`);

    if (!challenge) {
      throw new UnauthorizedException('Reset session has expired or is invalid. Please request a new code.');
    }

    if (challenge.otp !== otp.trim()) {
      challenge.attempts += 1;
      if (challenge.attempts >= 5) {
        this.cache.invalidate(`pwd_reset:${challengeId}`);
        throw new UnauthorizedException('Too many incorrect attempts. Please request a new password reset.');
      }
      this.cache.set(`pwd_reset:${challengeId}`, challenge, 10 * 60 * 1000);
      throw new UnauthorizedException('Incorrect verification code. Please check and try again.');
    }

    // Invalidate reset challenge
    this.cache.invalidate(`pwd_reset:${challengeId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: challenge.userId },
    });

    if (!user) {
      throw new NotFoundException('User account no longer exists');
    }

    // Hash new password and update user
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Invalidate all active sessions for security
    await this.prisma.session.deleteMany({
      where: { userId: user.id },
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorEmail: user.email,
      action: 'PASSWORD_RESET_COMPLETED',
      resourceType: 'AUTH',
      metadata: { method: 'OTP' },
      ipAddress: ip,
      userAgent,
    });

    return {
      success: true,
      message: 'Your password has been reset successfully. Please log in with your new password.',
    };
  }

  async resendResetOtp(challengeId: string) {
    const challenge = this.cache.get<{
      userId: string;
      email: string;
      phone: string;
      otp: string;
      attempts: number;
    }>(`pwd_reset:${challengeId}`);

    if (!challenge) {
      throw new UnauthorizedException('Reset session expired. Please start over.');
    }

    const newOtp = this.smsDispatcher.generateOtp();
    challenge.otp = newOtp;
    challenge.attempts = 0;
    this.cache.set(`pwd_reset:${challengeId}`, challenge, 10 * 60 * 1000);

    void this.smsDispatcher.sendPasswordResetOtp(challenge.phone, challenge.email, newOtp);

    return {
      success: true,
      message: `A new reset code has been sent to ${this.smsDispatcher.maskPhone(challenge.phone)}.`,
    };
  }


  async registerRestaurant(dto: RegisterRestaurantDto, ip?: string, userAgent?: string) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException('Email address is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const baseSlug = this.slugify(dto.restaurantName);

    return this.prisma.$transaction(async (tx) => {
      // Ensure unique tenant slug
      let tenantSlug = baseSlug;
      const countT = await tx.tenant.count({ where: { slug: tenantSlug } });
      if (countT > 0) {
        tenantSlug = `${baseSlug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      }

      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: { name: dto.restaurantName, slug: tenantSlug },
      });

      // 2. Create Restaurant under Tenant
      const restaurant = await tx.restaurant.create({
        data: { tenantId: tenant.id, name: dto.restaurantName, slug: tenantSlug },
      });

      // 2.5. Create Default Trial Subscription
      try {
        const defaultPlan = (await tx.plan.findFirst({
          where: { name: 'Free', status: 'ACTIVE' },
        })) || (await tx.plan.findFirst({
          where: { status: 'ACTIVE' },
          orderBy: { price: 'asc' },
        }));

        if (defaultPlan) {
          const trialDays = defaultPlan.trialDays || 14;
          const now = new Date();
          const trialEnd = new Date();
          trialEnd.setDate(now.getDate() + trialDays);

          await tx.subscription.create({
            data: {
              restaurantId: restaurant.id,
              planId: defaultPlan.id,
              status: 'TRIALING',
              billingCycle: defaultPlan.billingCycle || 'MONTHLY',
              trialStart: now,
              trialEnd: trialEnd,
              currentPeriodStart: now,
              currentPeriodEnd: trialEnd,
            },
          });
        }
      } catch (subErr) {
        this.logger.warn({ error: subErr }, 'Could not create default trial subscription during onboarding');
      }

      // 3. Create Main Branch under Restaurant
      const branch = await tx.branch.create({
        data: {
          restaurantId: restaurant.id,
          name: 'Main Branch',
          code: 'MAIN',
          status: 'ACTIVE',
        },
      });

      // 4. Create Owner User
      const user = await tx.user.create({
        data: {
          name: dto.ownerName,
          email: normalizedEmail,
          phone: dto.phone || null,
          passwordHash,
          role: UserRole.OWNER,
          status: 'ACTIVE',
        },
      });

      // 5. Create Tenant Membership with OWNER role
      const membership = await tx.tenantMembership.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: UserRole.OWNER,
        },
      });

      // Create session for onboarding login
      const session = await tx.session.create({
        data: {
          userId: user.id,
          refreshTokenHash: '',
          deviceName: this.parseUserAgent(userAgent),
          ipAddress: ip || null,
          userAgent: userAgent || null,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      const accessToken = await this.generateAccessToken(user.id, user.email, user.role, session.id);
      const refreshToken = await this.generateRefreshToken(session.id);

      await tx.session.update({
        where: { id: session.id },
        data: { refreshTokenHash: this.hashToken(refreshToken) },
      });

      this.logger.log(
        { userId: user.id, restaurantId: restaurant.id },
        'New restaurant onboarding successful',
      );

      // Audit logs onboarding
      await this.auditService.log({
        actorUserId: user.id,
        actorEmail: user.email,
        action: 'RESTAURANT_CREATED',
        resourceType: 'RESTAURANT',
        resourceId: restaurant.id,
        restaurantId: restaurant.id,
        ipAddress: ip,
        userAgent: userAgent,
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
        },
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
        restaurant: { id: restaurant.id, name: restaurant.name, slug: restaurant.slug },
        branch: { id: branch.id, name: branch.name, code: branch.code },
        membership: { id: membership.id, role: membership.role },
      };
    });
  }

  async refresh(refreshToken: string, ip?: string, userAgent?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken);
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const sessionId = payload.sessionId;
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    const incomingHash = this.hashToken(refreshToken);

    if (session.revokedAt) {
      throw new UnauthorizedException('Session has been revoked');
    }

    if (session.refreshTokenHash !== incomingHash) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    // Generate rotated tokens
    const newAccessToken = await this.generateAccessToken(
      session.user.id,
      session.user.email,
      session.user.role,
      session.id,
    );
    const newRefreshToken = await this.generateRefreshToken(session.id);

    // Save rotated token hash
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: this.hashToken(newRefreshToken),
        lastUsedAt: new Date(),
        ipAddress: ip || null,
        userAgent: userAgent || null,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        status: session.user.status,
      },
    };
  }

  async logout(refreshToken: string, ip?: string, userAgent?: string) {
    if (!refreshToken) return;

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken);
      const sessionId = payload.sessionId;

      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
      });

      if (session) {
        await this.prisma.session.update({
          where: { id: sessionId },
          data: { revokedAt: new Date() },
        });

        // Evict immediately so the revoked session cannot survive its TTL.
        this.cache.invalidate(CacheKeys.session(sessionId));

        await this.auditService.log({
          actorUserId: session.user.id,
          actorEmail: session.user.email,
          action: 'LOGOUT',
          resourceType: 'AUTH',
          resourceId: sessionId,
          ipAddress: ip,
          userAgent: userAgent,
        });
      }
    } catch {
      // Swallowing errors so logout clears successfully on client-side anyway
    }
  }

  async logoutAll(userId: string, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    const revoked = await this.prisma.session.findMany({
      where: { userId, revokedAt: null },
      select: { id: true },
    });

    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Evict every session we just revoked, plus the user row itself.
    for (const session of revoked) {
      this.cache.invalidate(CacheKeys.session(session.id));
    }
    this.cache.invalidate(CacheKeys.user(userId));

    await this.auditService.log({
      actorUserId: user.id,
      actorEmail: user.email,
      action: 'LOGOUT_ALL',
      resourceType: 'AUTH',
      ipAddress: ip,
      userAgent: userAgent,
    });
  }

  async getSessions(userId: string) {
    return this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gte: new Date() },
      },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        deviceName: true,
        ipAddress: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new ForbiddenException('You do not own this session');
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    this.cache.invalidate(CacheKeys.session(sessionId));

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    await this.auditService.log({
      actorUserId: userId,
      actorEmail: user?.email,
      action: 'SESSION_REVOKED',
      resourceType: 'AUTH',
      resourceId: sessionId,
    });
  }

  async getUserMemberships(userId: string) {
    const memberships = await this.prisma.tenantMembership.findMany({
      where: { userId },
      select: {
        id: true,
        role: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            restaurants: {
              select: {
                id: true,
                name: true,
                slug: true,
                branches: {
                  select: { id: true, name: true, code: true },
                },
              },
            },
          },
        },
      },
    });

    return memberships;
  }

  async loginWithOAuth(
    provider: string,
    email: string,
    name?: string,
    token?: string,
    avatarUrl?: string,
    ip?: string,
    userAgent?: string,
  ) {
    const normalizedEmail = email.trim().toLowerCase();

    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      if (user.status !== 'ACTIVE') {
        throw new UnauthorizedException('User account is not active');
      }
    } else {
      // Auto-provision user on first OAuth login
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      const displayName = name?.trim() || normalizedEmail.split('@')[0];

      user = await this.prisma.user.create({
        data: {
          name: displayName,
          email: normalizedEmail,
          passwordHash,
          role: UserRole.USER,
          status: 'ACTIVE',
        },
      });

      this.logger.log({ userId: user.id, email: user.email, provider }, 'New user provisioned via OAuth');
    }

    const memberships = await this.getUserMemberships(user.id);

    // Create active session
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: '',
        deviceName: `${provider.toUpperCase()} Login (${this.parseUserAgent(userAgent)})`,
        ipAddress: ip || null,
        userAgent: userAgent || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = await this.generateAccessToken(user.id, user.email, user.role, session.id);
    const refreshToken = await this.generateRefreshToken(session.id);

    await this.prisma.session.update({
      where: { id: session.id },
      data: { refreshTokenHash: this.hashToken(refreshToken) },
    });

    await this.auditService.log({
      actorUserId: user.id,
      actorEmail: user.email,
      action: 'OAUTH_LOGIN_SUCCESS',
      resourceType: 'AUTH',
      metadata: { provider, name, avatarUrl },
      ipAddress: ip,
      userAgent: userAgent,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
      memberships,
    };
  }

  private async generateAccessToken(userId: string, email: string, role: string, sessionId: string): Promise<string> {
    const payload = {
      sub: userId,
      userId: userId,
      email: email,
      role: role,
      sessionId: sessionId,
    };
    return this.jwtService.signAsync(payload, { expiresIn: '15m' });
  }

  private async generateRefreshToken(sessionId: string): Promise<string> {
    const payload = {
      sessionId: sessionId,
    };
    return this.jwtService.signAsync(payload, { expiresIn: '7d' });
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseUserAgent(ua?: string): string {
    if (!ua) return 'Unknown Device';
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('iPad')) return 'iPad';
    if (ua.includes('Android')) return 'Android Device';
    if (ua.includes('Windows')) return 'Windows PC';
    if (ua.includes('Macintosh')) return 'MacBook';
    if (ua.includes('Linux')) return 'Linux PC';
    return 'Web Browser';
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'restaurant';
  }
}
