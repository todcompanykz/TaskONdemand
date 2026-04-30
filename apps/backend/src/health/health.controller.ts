import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private redisService: RedisService,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    // Check Redis connection
    let redisStatus = 'up';
    try {
      await this.redisService.get('health_check');
      await this.redisService.set('health_check', 'ok', 10);
    } catch (error) {
      redisStatus = 'down';
    }

    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024), // 300MB
      async (): Promise<HealthIndicatorResult> => {
        return {
          redis: {
            status: redisStatus,
          },
        } as HealthIndicatorResult;
      },
    ]);
  }
}
