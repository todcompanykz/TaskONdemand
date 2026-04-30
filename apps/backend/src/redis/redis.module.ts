import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { RedisService } from './redis.service';

function createInMemoryRedisFallback() {
  const values = new Map<string, string>();
  const expirations = new Map<string, NodeJS.Timeout>();

  const clearExpiry = (key: string) => {
    const timeout = expirations.get(key);
    if (timeout) {
      clearTimeout(timeout);
      expirations.delete(key);
    }
  };

  return {
    async get(key: string) {
      return values.get(key) ?? null;
    },
    async set(key: string, value: string) {
      clearExpiry(key);
      values.set(key, value);
      return 'OK';
    },
    async setEx(key: string, ttlSeconds: number, value: string) {
      clearExpiry(key);
      values.set(key, value);
      const timeout = setTimeout(() => {
        values.delete(key);
        expirations.delete(key);
      }, ttlSeconds * 1000);
      expirations.set(key, timeout);
      return 'OK';
    },
    async incr(key: string) {
      const current = Number(values.get(key) ?? '0');
      const next = current + 1;
      values.set(key, String(next));
      return next;
    },
    async exists(key: string) {
      return values.has(key) ? 1 : 0;
    },
    async del(key: string) {
      clearExpiry(key);
      const hadValue = values.delete(key);
      return hadValue ? 1 : 0;
    },
  };
}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const client = createClient({
          url: configService.get('REDIS_URL', 'redis://localhost:6379'),
        });
        try {
          await client.connect();
          return client;
        } catch (error) {
          console.warn(
            '[RedisModule] Redis unavailable, using in-memory fallback:',
            error instanceof Error ? error.message : String(error),
          );
          return createInMemoryRedisFallback() as any;
        }
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
