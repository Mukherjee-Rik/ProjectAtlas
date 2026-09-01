import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Logger } from 'nestjs-pino';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma/prisma.service';

import { AuditService } from '../audit/audit.service';
import { TtlCacheService } from '../../common/cache/ttl-cache.service';
import { SmsDispatcherService } from './sms-dispatcher.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: any;
  let jwtService: any;
  let mockLogger: any;
  let mockAuditService: any;

  const mockUser = {
    id: 'user-id-1',
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    passwordHash: '$2b$10$hashedpassword',
    role: 'USER',
    status: 'ACTIVE',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    prismaService = {
      user: {
        findUnique: jest.fn(),
      },
      tenantMembership: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      session: {
        create: jest.fn().mockResolvedValue({ id: 'session-1' }),
        update: jest.fn().mockResolvedValue({ id: 'session-1' }),
      },
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-access-token'),
    };

    mockLogger = {
      warn: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    };

    mockAuditService = {
      log: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TtlCacheService,
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: JwtService, useValue: jwtService },
        { provide: Logger, useValue: mockLogger },
        { provide: AuditService, useValue: mockAuditService },
        {
          provide: SmsDispatcherService,
          useValue: {
            generateOtp: jest.fn().mockReturnValue('123456'),
            maskPhone: jest.fn().mockReturnValue('******5026'),
            maskEmail: jest.fn().mockReturnValue('t•••t@example.com'),
            sendSignInOtp: jest.fn().mockResolvedValue(true),
            sendSignInOtpEmail: jest.fn().mockResolvedValue(true),
            sendRegistrationOtpEmail: jest.fn().mockResolvedValue(true),
            dispatchDirectEmail: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user details on valid email, password, and active status', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        phone: mockUser.phone,
        role: mockUser.role,
        status: mockUser.status,
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.validateUser('unknown@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { email: 'unknown@example.com' },
        'Login failed: user not found',
      );
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateUser('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { userId: mockUser.id },
        'Login failed: invalid password',
      );
    });

    it('should throw UnauthorizedException when user status is SUSPENDED', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        status: 'SUSPENDED',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.validateUser('test@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { userId: mockUser.id },
        'Login failed: user account is not active',
      );
    });
  });

  describe('login', () => {
    it('should log in directly and return access tokens when credentials are valid', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('test@example.com', 'password123');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        phone: mockUser.phone,
        role: mockUser.role,
        status: mockUser.status,
      });
      expect(result.memberships).toEqual([]);
    });
  });

  describe('registerRestaurant', () => {
    it('should issue a registration OTP challenge when email is not taken', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedpassword');

      const result = await service.registerRestaurant({
        restaurantName: 'The Spice Garden',
        ownerName: 'Rik Mukherjee',
        email: 'owner@spicegarden.com',
        password: 'Password123!',
      });

      expect(result.otpRequired).toBe(true);
      expect(result.challengeId).toMatch(/^reg_/);
    });
  });
});
