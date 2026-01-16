import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Admin Guard - checks if user is admin
 * For MVP: checks if email contains 'admin' or is in admin list
 */
@Injectable()
export class AdminGuard implements CanActivate {
  // List of admin emails (can be moved to env/config)
  private readonly adminEmails = [
    'admin@tod.kz',
    'admin@example.com',
  ];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if email is in admin list or contains 'admin'
    const isAdmin =
      this.adminEmails.includes(user.email.toLowerCase()) ||
      user.email.toLowerCase().includes('@admin.') ||
      user.email.toLowerCase().startsWith('admin@');

    if (!isAdmin) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
