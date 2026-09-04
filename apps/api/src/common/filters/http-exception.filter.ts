import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId =
      (request?.headers?.['x-request-id'] as string) ||
      (request as any)?.requestId ||
      'unknown';
    const restaurantId =
      (request?.headers?.['x-restaurant-id'] as string) || undefined;
    const userId = (request as any)?.user?.id || undefined;

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';
    let errorType = 'ServerError';

    if (exception instanceof HttpException) {
      errorType = exception.name;
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObject = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };
        message =
          responseObject.message ?? responseObject.error ?? 'Request error';
      }
    } else {
      // 500 Unhandled or Database Exception - Scrub sensitive internal details
      const rawError = exception as any;
      errorType = rawError?.name || 'InternalError';

      this.logger.error({
        level: 'error',
        service: 'kafei-api',
        requestId,
        restaurantId,
        userId,
        method: request?.method,
        path: request?.url,
        statusCode: status,
        errorType,
        message: rawError?.message || 'Unhandled exception',
        stack: rawError?.stack,
      });

      // Safe sanitized message for client
      message = 'Internal server error';
    }

    // Set correlation header if available
    if (typeof response.setHeader === 'function') {
      response.setHeader('x-request-id', requestId);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      requestId,
      errorType,
      error: message,
      timestamp: new Date().toISOString(),
      path: request?.url,
    });
  }
}
