import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { CurrentTenant as CurrentTenantType } from '../types/current-tenant.type';

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentTenantType | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant;
  },
);
