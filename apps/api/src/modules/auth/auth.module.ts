import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { PrismaModule } from '../../database/prisma/prisma.module';
import { SupportModule } from '../support/support.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SmsDispatcherService } from './sms-dispatcher.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PermissionsGuard } from './guards/permissions.guard';
import { TenantAccessGuard } from './guards/tenant-access.guard';
import { RestaurantAccessGuard } from './guards/restaurant-access.guard';
import { BranchAccessGuard } from './guards/branch-access.guard';

@Module({
  imports: [
    PrismaModule,
    SupportModule,
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
    SmsDispatcherService,
    JwtStrategy,
    PermissionsGuard,
    TenantAccessGuard,
    RestaurantAccessGuard,
    BranchAccessGuard,
  ],
  exports: [
    AuthService,
    SmsDispatcherService,
    PermissionsGuard,
    TenantAccessGuard,
    RestaurantAccessGuard,
    BranchAccessGuard,
  ],
})
export class AuthModule {}
