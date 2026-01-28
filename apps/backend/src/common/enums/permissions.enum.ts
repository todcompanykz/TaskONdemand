/**
 * Atomic permissions for RBAC system
 * Each permission represents a specific action that can be performed
 */
export enum Permission {
  // Tasks permissions
  TASKS_READ = 'tasks.read',
  TASKS_UPDATE = 'tasks.update',
  TASKS_DELETE = 'tasks.delete',

  // Users permissions
  USERS_READ = 'users.read',
  USERS_BLOCK = 'users.block',
  USERS_UNBLOCK = 'users.unblock',

  // Payments permissions
  PAYMENTS_READ = 'payments.read',

  // Support permissions
  SUPPORT_READ = 'support.read',
  SUPPORT_REPLY = 'support.reply',
  SUPPORT_CLOSE = 'support.close',

  // Analytics permissions
  ANALYTICS_READ = 'analytics.read',

  // Admin tokens (only for SUPER_ADMIN)
  ADMIN_TOKENS_CREATE = 'admin.tokens.create',
}

/**
 * Helper function to get all permissions
 */
export function getAllPermissions(): string[] {
  return Object.values(Permission);
}

/**
 * Helper function to check if permission is valid
 */
export function isValidPermission(permission: string): boolean {
  return Object.values(Permission).includes(permission as Permission);
}
