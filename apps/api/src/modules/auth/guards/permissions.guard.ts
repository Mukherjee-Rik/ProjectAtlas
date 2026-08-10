import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLE_PERMISSIONS } from '../permissions/role-permissions';
import type { Permission } from '../permissions/permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.role) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const rolePermissions = ROLE_PERMISSIONS[user.role] ?? [];

    const hasPermission = requiredPermissions.every((permission) =>
      rolePermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
