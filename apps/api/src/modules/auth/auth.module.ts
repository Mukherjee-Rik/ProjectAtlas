import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { PrismaModule } from '../../database/prisma/prisma.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PermissionsGuard } from './guards/permissions.guard';
import { TenantAccessGuard } from './guards/tenant-access.guard';
import { RestaurantAccessGuard } from './guards/restaurant-access.guard';
import { BranchAccessGuard } from './guards/branch-access.guard';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    PermissionsGuard,
    TenantAccessGuard,
    RestaurantAccessGuard,
    BranchAccessGuard,
  ],
  exports: [
    AuthService,
    PermissionsGuard,
    TenantAccessGuard,
    RestaurantAccessGuard,
    BranchAccessGuard,
  ],
})
export class AuthModule {}
