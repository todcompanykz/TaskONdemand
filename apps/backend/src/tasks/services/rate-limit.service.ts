import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

/**
 * Service for managing cancel/refuse rate limits
 *
 * Rules:
 * - Max 3 cancels OR refuses per 24h per user
 * - After limit: block claim for 24h
 * - Counts reset after 24h
 */
@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly MAX_CANCEL_REFUSE_PER_24H = 3;
  private readonly BLOCK_DURATION_SECONDS = 86400; // 24 hours

  constructor(private redisService: RedisService) {}

  /**
   * Check and increment cancel count
   * Returns true if limit exceeded (should block)
   */
  async checkAndIncrementCancel(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const cancelKey = `user:${userId}:cancel_count:${today}`;

    const count = await this.redisService.increment(cancelKey);

    // Set expiry on first increment
    if (count === 1) {
      await this.redisService.setWithExpiry(cancelKey, '1', 86400);
    }

    if (count > this.MAX_CANCEL_REFUSE_PER_24H) {
      await this.blockClaim(userId);
      this.logger.warn({
        event: 'cancel_limit_exceeded',
        userId,
        count,
        action: 'claim_blocked',
      });
      return true;
    }

    this.logger.log({
      event: 'cancel_counted',
      userId,
      count,
      limit: this.MAX_CANCEL_REFUSE_PER_24H,
    });

    return false;
  }

  /**
   * Check and increment refuse count
   * Returns true if limit exceeded (should block)
   */
  async checkAndIncrementRefuse(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const refuseKey = `user:${userId}:refuse_count:${today}`;

    const count = await this.redisService.increment(refuseKey);

    // Set expiry on first increment
    if (count === 1) {
      await this.redisService.setWithExpiry(refuseKey, '1', 86400);
    }

    if (count > this.MAX_CANCEL_REFUSE_PER_24H) {
      await this.blockClaim(userId);
      this.logger.warn({
        event: 'refuse_limit_exceeded',
        userId,
        count,
        action: 'claim_blocked',
      });
      return true;
    }

    this.logger.log({
      event: 'refuse_counted',
      userId,
      count,
      limit: this.MAX_CANCEL_REFUSE_PER_24H,
    });

    return false;
  }

  /**
   * Block user from claiming tasks for 24 hours
   */
  async blockClaim(userId: string): Promise<void> {
    const blockKey = `claim_block:${userId}`;
    await this.redisService.setWithExpiry(
      blockKey,
      '1',
      this.BLOCK_DURATION_SECONDS,
    );

    this.logger.warn({
      event: 'claim_blocked',
      userId,
      duration: '24h',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Check if user is blocked from claiming
   */
  async isBlocked(userId: string): Promise<boolean> {
    const blockKey = `claim_block:${userId}`;
    return await this.redisService.exists(blockKey);
  }
}
