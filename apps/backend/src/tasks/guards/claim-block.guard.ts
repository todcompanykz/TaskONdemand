import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../../redis/redis.service';
import { User } from '../../users/entities/user.entity';

/**
 * Guard to check if user is blocked from claiming tasks
 * 
 * Blocks are set when user exceeds cancel/refuse limits (3 per 24h)
 * Block duration: 24 hours
 * Also checks if user is restricted by admin
 */
@Injectable()
export class ClaimBlockGuard implements CanActivate {
  constructor(
    private redisService: RedisService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      return false;
    }

    // Check if user is restricted
    const dbUser = await this.usersRepository.findOne({
      where: { id: user.id },
    });

    if (dbUser?.isRestricted) {
      throw new ForbiddenException(
        'You are restricted from claiming tasks. Please contact support.',
      );
    }

    // Check if user is temporarily blocked
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
