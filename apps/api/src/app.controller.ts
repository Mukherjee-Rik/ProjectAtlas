import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  healthCheck() {
    return {
      status: 'Perfect',
      Service: 'atlas-api',
      timestamp: new Date().toISOString(),
    };
  }
}
