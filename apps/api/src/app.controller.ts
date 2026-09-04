import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({
  version: [VERSION_NEUTRAL, '1'],
})
export class AppController {
  @Get(['health', 'status', ''])
  healthCheck() {
    return {
      status: 'ok',
      service: 'kafei-api',
      timestamp: new Date().toISOString(),
    };
  }
}
