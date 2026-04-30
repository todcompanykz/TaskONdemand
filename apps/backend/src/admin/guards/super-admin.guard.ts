import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../../common/enums/user-role.enum';

/**
 * Super Admin Guard - checks if user is SUPER_ADMIN
 * Only SUPER_ADMIN can access endpoints protected by this guard
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // #region agent log
    try {
      fetch(
        'http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'super-admin.guard.ts:15',
            message: 'SuperAdminGuard check',
            data: {
              hasUser: !!user,
              userId: user?.id,
              userRole: user?.role,
              userRoleType: typeof user?.role,
              expectedRole: UserRole.SUPER_ADMIN,
              rolesMatch: user?.role === UserRole.SUPER_ADMIN,
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'E',
          }),
        },
      ).catch(() => {});
    } catch (e) {}
    // #endregion

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role !== UserRole.SUPER_ADMIN) {
      // #region agent log
      try {
        fetch(
          'http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location: 'super-admin.guard.ts:23',
              message: 'SuperAdminGuard access denied',
              data: {
                userRole: user.role,
                expectedRole: UserRole.SUPER_ADMIN,
                roleComparison: user.role === UserRole.SUPER_ADMIN,
              },
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'run1',
              hypothesisId: 'E',
            }),
          },
        ).catch(() => {});
      } catch (e) {}
      // #endregion
      throw new ForbiddenException('Super admin access required');
    }

    return true;
  }
}
