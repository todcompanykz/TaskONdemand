import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

/**
 * Guard to check if user is blocked from claiming tasks
 * 
 * Blocks are set when user exceeds cancel/refuse limits (3 per 24h)
 * Block duration: 24 hours
 */
@Injectable()
export class ClaimBlockGuard implements CanActivate {
  constructor(private redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      return false;
    }

    const blockKey = `claim_block:${user.id}`;
    const isBlocked = await this.redisService.exists(blockKey);

    if (isBlocked) {
      throw new ForbiddenException(
        'You are temporarily blocked from claiming tasks. This block will be lifted in 24 hours.',
      );
    }

    return true;
  }
}
