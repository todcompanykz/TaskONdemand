import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { RedisModule } from '../redis/redis.module';
import { TaskStateTransitionService } from './task-state-transition.service';
import { RateLimitService } from './services/rate-limit.service';
import { ClaimBlockGuard } from './guards/claim-block.guard';
import { TasksScheduler } from './tasks.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, User]),
    RedisModule,
    NotificationsModule,
  ],
  controllers: [TasksController],
  providers: [
    TasksService,
    TaskStateTransitionService,
    RateLimitService,
    ClaimBlockGuard,
    TasksScheduler,
  ],
  exports: [TasksService, TaskStateTransitionService, ClaimBlockGuard],
})
export class TasksModule {}
