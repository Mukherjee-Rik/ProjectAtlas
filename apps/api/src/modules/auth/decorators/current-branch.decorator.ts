import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { CurrentBranch as CurrentBranchType } from '../types/current-branch.type';

export const CurrentBranch = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentBranchType | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.branch;
  },
);
