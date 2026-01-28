import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../common/enums/user-role.enum';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

/**
 * Permissions Guard - checks if user has required permissions
 * SUPER_ADMIN bypasses all permission checks
 * ADMIN must have all required permissions
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // SUPER_ADMIN has all permissions
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // ADMIN must have all required permissions
    if (user.role === UserRole.ADMIN) {
      const userPermissions = user.permissions || [];
      
      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasAllPermissions) {
        throw new ForbiddenException(
          `Missing required permissions: ${requiredPermissions.join(', ')}`,
        );
      }

      return true;
    }

    // USER role has no permissions
    throw new ForbiddenException('Insufficient permissions');
  }
}
