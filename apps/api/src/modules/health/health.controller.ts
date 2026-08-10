import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../../database/prisma/prisma.service';

@SkipThrottle()
@Controller({
  path: 'health',
  version: '1',
})
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'atlas-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('database')
  async getDatabaseHealth() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
