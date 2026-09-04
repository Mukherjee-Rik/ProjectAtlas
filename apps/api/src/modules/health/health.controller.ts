import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import * as express from 'express';
import { HealthService } from './health.service';

@ApiTags('Health & Readiness Probes')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check probe' })
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('live')
  @ApiOperation({
    summary: 'Liveness probe to check if application process is running',
  })
  getLiveness() {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness probe validating DB, Queue, and memory health',
  })
  async getReadiness(@Res() res: express.Response) {
    const result = await this.healthService.getReadiness();
    const statusCode =
      result.status === 'UP' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    return res.status(statusCode).json(result);
  }

  @Get('database')
  @ApiOperation({
    summary: 'PostgreSQL database connectivity and latency health',
  })
  async getDatabaseHealth(@Res() res: express.Response) {
    const result = await this.healthService.checkDatabase();
    const statusCode =
      result.status === 'UP' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    return res.status(statusCode).json(result);
  }
}
