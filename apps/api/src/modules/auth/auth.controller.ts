import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Delete,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import * as express from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterRestaurantDto } from './dto/register-restaurant.dto';
import { OAuthLoginDto } from './dto/oauth-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

/**
 * Credential endpoints are deliberately rate limited to blunt brute-force and
 * mass-signup attempts. The limits stay strict by default and are only raised
 * via environment variables, which end-to-end runs use so a suite of tests is
 * not mistaken for an attack.
 */
const AUTH_WINDOW_MS = Number(process.env.AUTH_THROTTLE_TTL_MS ?? 60_000);
const LOGIN_LIMIT = Number(process.env.AUTH_LOGIN_LIMIT ?? 5);
const SIGNUP_LIMIT = Number(process.env.AUTH_SIGNUP_LIMIT ?? 5);
const REFRESH_LIMIT = Number(process.env.AUTH_REFRESH_LIMIT ?? 10);

import { VerifyOtpDto, ResendOtpDto } from './dto/verify-otp.dto';
import {
  VerifyRegistrationOtpDto,
  ResendRegistrationOtpDto,
} from './dto/verify-registration-otp.dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  ResendResetOtpDto,
} from './dto/forgot-password.dto';

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('oauth')
  @ApiOperation({ summary: 'Single sign-on / OAuth login and registration' })
  async oauthLogin(
    @Body() dto: OAuthLoginDto,
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const result = await this.authService.loginWithOAuth(
      dto.provider,
      dto.email,
      dto.name,
      dto.token,
      dto.avatarUrl,
      ip,
      userAgent,
    );

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      path: '/',
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
      memberships: result.memberships,
    };
  }

  @Throttle({
    default: {
      ttl: AUTH_WINDOW_MS,
      limit: LOGIN_LIMIT,
    },
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({
    summary: 'Login with credentials: logs in directly if password matches',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
      ip,
      userAgent,
    );

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      path: '/',
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
      memberships: result.memberships,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify 6-digit phone OTP and complete sign-in' })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const result = await this.authService.verifyOtp(
      dto.challengeId,
      dto.otp,
      ip,
      userAgent,
    );

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      path: '/',
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
      memberships: result.memberships,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('resend-otp')
  @ApiOperation({
    summary: 'Resend new 6-digit phone OTP for active challenge',
  })
  async resendOtp(@Body() dto: ResendOtpDto, @Req() req: express.Request) {
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    return this.authService.resendOtp(dto.challengeId, ip, userAgent);
  }

  @Throttle({
    default: {
      ttl: AUTH_WINDOW_MS,
      limit: LOGIN_LIMIT,
    },
  })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  @ApiOperation({
    summary:
      'Initiate password reset: verifies email/phone and dispatches 6-digit OTP',
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Req() req: express.Request,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    return this.authService.forgotPassword(dto.identifier, ip, userAgent);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  @ApiOperation({ summary: 'Verify OTP and set new password' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Req() req: express.Request,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    return this.authService.resetPassword(
      dto.challengeId,
      dto.otp,
      dto.newPassword,
      ip,
      userAgent,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('resend-reset-otp')
  @ApiOperation({ summary: 'Resend new 6-digit password reset OTP' })
  async resendResetOtp(@Body() dto: ResendResetOtpDto) {
    return this.authService.resendResetOtp(dto.challengeId);
  }

  @Throttle({
    default: {
      ttl: AUTH_WINDOW_MS,
      limit: SIGNUP_LIMIT,
    },
  })
  @HttpCode(HttpStatus.OK)
  @Post('signup')
  @ApiOperation({
    summary: 'Initiate restaurant registration and dispatch verification OTP',
  })
  async signup(
    @Body() dto: RegisterRestaurantDto,
    @Req() req: express.Request,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    return this.authService.registerRestaurant(dto, ip, userAgent);
  }

  @Throttle({
    default: {
      ttl: AUTH_WINDOW_MS,
      limit: SIGNUP_LIMIT,
    },
  })
  @HttpCode(HttpStatus.CREATED)
  @Post('verify-registration-otp')
  @ApiOperation({
    summary:
      'Verify registration OTP and create restaurant, owner user, and session',
  })
  async verifyRegistrationOtp(
    @Body() dto: VerifyRegistrationOtpDto,
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const result = await this.authService.verifyRegistrationOtp(
      dto.challengeId,
      dto.otp,
      ip,
      userAgent,
    );

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      path: '/',
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
      tenant: result.tenant,
      restaurant: result.restaurant,
      branch: result.branch,
      membership: result.membership,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('resend-registration-otp')
  @ApiOperation({ summary: 'Resend new 6-digit registration OTP code' })
  async resendRegistrationOtp(
    @Body() dto: ResendRegistrationOtpDto,
    @Req() req: express.Request,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    return this.authService.resendRegistrationOtp(
      dto.challengeId,
      ip,
      userAgent,
    );
  }

  @Throttle({
    default: {
      ttl: AUTH_WINDOW_MS,
      limit: REFRESH_LIMIT,
    },
  })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh the access token silently' })
  async refresh(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const result = await this.authService.refresh(refreshToken, ip, userAgent);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      path: '/',
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiOperation({ summary: 'Logout from the current session' })
  async logout(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    await this.authService.logout(refreshToken, ip, userAgent);

    res.clearCookie('refreshToken', {
      path: '/',
    });

    return { success: true };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout from all active sessions/devices' })
  async logoutAll(
    @CurrentUser('id') userId: string,
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.ip ||
      req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    await this.authService.logoutAll(userId, ip, userAgent);

    res.clearCookie('refreshToken', {
      path: '/',
    });

    return { success: true };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get active sessions list' })
  async getSessions(@CurrentUser('id') userId: string) {
    return this.authService.getSessions(userId);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke/terminate a specific session' })
  async revokeSession(
    @CurrentUser('id') userId: string,
    @Param('id') sessionId: string,
  ) {
    await this.authService.revokeSession(userId, sessionId);
    return { success: true };
  }

  @Get('memberships')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get all restaurant memberships for the logged in user',
  })
  async getMemberships(@CurrentUser('id') userId: string) {
    return this.authService.getUserMemberships(userId);
  }
}
