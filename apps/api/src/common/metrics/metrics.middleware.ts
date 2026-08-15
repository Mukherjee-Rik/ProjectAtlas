import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - startTime;
      this.metricsService.recordRequest(req.method, req.originalUrl || req.url, res.statusCode, durationMs);
    });

    next();
  }
}
