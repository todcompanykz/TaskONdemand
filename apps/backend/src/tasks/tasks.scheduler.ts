import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TasksService } from './tasks.service';

/**
 * Background job scheduler for task expiration
 *
 * Runs every 5 minutes to mark expired tasks.
 * Tasks expire 24 hours after creation.
 */
@Injectable()
export class TasksScheduler {
  private readonly logger = new Logger(TasksScheduler.name);

  constructor(private tasksService: TasksService) {}

  /**
   * Expire tasks that are older than 24 hours
   * Runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredTasks() {
    this.logger.log({
      event: 'expire_job_started',
      timestamp: new Date().toISOString(),
    });

    try {
      const expiredCount = await this.tasksService.expireTasks();

      this.logger.log({
        event: 'expire_job_completed',
        expiredCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error({
        event: 'expire_job_failed',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
