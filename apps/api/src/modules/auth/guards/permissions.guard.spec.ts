import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSIONS } from '../permissions/permissions';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  function createMockExecutionContext(user: any): ExecutionContext {
    return {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  }

  it('should allow access if no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockExecutionContext({ role: 'USER' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has required permissions', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([PERMISSIONS.PROFILE_READ]);

    const context = createMockExecutionContext({ role: 'USER' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow ADMIN access to DASHBOARD_READ and USERS_READ', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([PERMISSIONS.DASHBOARD_READ, PERMISSIONS.USERS_READ]);

    const context = createMockExecutionContext({ role: 'ADMIN' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user lacks required permission', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([PERMISSIONS.USERS_READ]);

    const context = createMockExecutionContext({ role: 'USER' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user has no role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([PERMISSIONS.PROFILE_READ]);

    const context = createMockExecutionContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
