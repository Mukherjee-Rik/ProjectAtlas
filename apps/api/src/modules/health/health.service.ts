import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  check() {
    return {
      status: 'ok',
      service: 'atlas-api',
      timestamp: new Date().toISOString(),
    };
  }
}
