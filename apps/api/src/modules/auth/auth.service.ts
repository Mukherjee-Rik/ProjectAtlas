import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Logger } from 'nestjs-pino';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly logger: Logger,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      this.logger.warn({ email }, 'Login failed: user not found');
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      this.logger.warn({ userId: user.id }, 'Login failed: invalid password');
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      this.logger.warn(
        { userId: user.id },
        'Login failed: user account is not active',
      );
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

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    this.logger.log(
      { userId: user.id, email: user.email },
      'User login successful',
    );

    return {
      accessToken,
      user,
    };
  }
}
