import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const existingId = req.headers['x-request-id'] as string;
    const correlationId =
      existingId && existingId.trim() !== ''
        ? existingId
        : `req_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;

    // Set on request and response headers
    req.headers['x-request-id'] = correlationId;
    (req as any).requestId = correlationId;
    res.setHeader('x-request-id', correlationId);

    next();
  }
}
