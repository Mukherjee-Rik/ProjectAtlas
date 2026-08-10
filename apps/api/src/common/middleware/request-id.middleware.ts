import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(
    req: Request & { id?: string | number },
    res: Response,
    next: NextFunction,
  ) {
    const requestId =
      req.id?.toString() ?? (req.headers['x-request-id'] as string | undefined);

    if (requestId) {
      res.setHeader('x-request-id', requestId);
    }

    next();
  }
}
