import type { ApiErrorResponse } from '@/types/api';

export class ApiError extends Error {
  statusCode: number;
  details?: ApiErrorResponse;

  constructor(
    message: string,
    statusCode: number,
    details?: ApiErrorResponse,
  ) {
    super(message);

    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}
