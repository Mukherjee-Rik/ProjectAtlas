import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../types/authenticated-user.type';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user: AuthenticatedUser;
    }>();

    if (!request.user) {
      throw new ForbiddenException('Access denied');
    }

    if (request.user.role !== 'PLATFORM_ADMIN') {
      throw new ForbiddenException('Platform Admin access required');
    }

    return true;
  }
}
