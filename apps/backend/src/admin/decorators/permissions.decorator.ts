import { SetMetadata } from '@nestjs/common';
import { Permission } from '../../common/enums/permissions.enum';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions for an endpoint
 * @param permissions - Array of permission strings or Permission enum values
 * @example
 * @Permissions('tasks.read', 'tasks.update')
 * @Permissions(Permission.TASKS_READ, Permission.TASKS_DELETE)
 */
export const Permissions = (...permissions: (string | Permission)[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
