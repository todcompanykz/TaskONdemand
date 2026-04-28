import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Task } from '../tasks/entities/task.entity';

@Injectable()
export class TelegramNotificationsService {
  private readonly logger = new Logger(TelegramNotificationsService.name);

  constructor(private readonly configService: ConfigService) {}

  async notifyTaskCreated(task: Task): Promise<void> {
    const message = [
      'New task created',
      `Task: ${task.shortDescription}`,
      `City: ${task.city}`,
      `Reward: ${task.reward} KZT`,
      `Task ID: ${task.id}`,
    ].join('\n');

    await this.sendMessage(message, 'task_created', task.id);
  }

  async notifyTaskClaimed(task: Task): Promise<void> {
    const message = [
      'Task claimed',
      `Task: ${task.shortDescription}`,
      `Task ID: ${task.id}`,
      `Creator ID: ${task.createdById}`,
      `Executor ID: ${task.claimedById ?? 'unknown'}`,
      `Reward: ${task.reward} KZT`,
    ].join('\n');

    await this.sendMessage(message, 'task_claimed', task.id);
  }

  async notifyTaskCompleted(task: Task): Promise<void> {
    const message = [
      'Task completed',
      `Task: ${task.shortDescription}`,
      `Task ID: ${task.id}`,
      `Creator ID: ${task.createdById}`,
      `Executor ID: ${task.claimedById ?? 'unknown'}`,
      `Reward: ${task.reward} KZT`,
    ].join('\n');

    await this.sendMessage(message, 'task_completed', task.id);
  }

  private async sendMessage(
    text: string,
    event: string,
    taskId: string,
  ): Promise<void> {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');

    if (!token || !chatId) {
      this.logger.debug(
        `Telegram is not configured. Skip event=${event}, taskId=${taskId}`,
      );
      return;
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            chat_id: chatId,
            text,
            disable_web_page_preview: 'true',
          }),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.warn(
          `Telegram send failed event=${event}, taskId=${taskId}, status=${response.status}, body=${errorBody}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Telegram send failed event=${event}, taskId=${taskId}, error=${message}`,
      );
    }
  }
}
