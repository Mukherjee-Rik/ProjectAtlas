import { Body, Controller, Get, HttpCode, HttpStatus, Post, Delete, Param, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import * as express from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterRestaurantDto } from './dto/register-restaurant.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({
    default: {
      ttl: 60000,
      limit: 5, // Hardened rate limit
    },
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Login to restaurant management account' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const result = await this.authService.login(loginDto.email, loginDto.password, ip, userAgent);

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

  @Throttle({
    default: {
      ttl: 60000,
      limit: 5,
    },
  })
  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  @ApiOperation({ summary: 'Onboard a new restaurant and owner account' })
  async signup(
    @Body() dto: RegisterRestaurantDto,
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const result = await this.authService.registerRestaurant(dto, ip, userAgent);

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

  @Throttle({
    default: {
      ttl: 60000,
      limit: 10,
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
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress;
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
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress;
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
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress;
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
  @ApiOperation({ summary: 'Get all restaurant memberships for the logged in user' })
  async getMemberships(@CurrentUser('id') userId: string) {
    return this.authService.getUserMemberships(userId);
  }
}
