import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { AdminModule } from './admin/admin.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SupportModule } from './support/support.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RootController } from './root.controller';
import { AiModule } from './ai/ai.module';
import { ChatModule } from './chat/chat.module';

const cwdEnvPath = resolve(process.cwd(), '.env');
const rootEnvPath = resolve(process.cwd(), '../../.env');
const envFilePath = [cwdEnvPath, rootEnvPath].filter((path) =>
  existsSync(path),
);

@Module({
  controllers: [RootController],
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFilePath.length > 0 ? envFilePath : '.env',
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    RedisModule,
    AuthModule,
    UsersModule,
    TasksModule,
    AdminModule,
    HealthModule,
    ReviewsModule,
    SupportModule,
    ChatModule,
    NotificationsModule,
    AiModule,
  ],
})
export class AppModule {}
