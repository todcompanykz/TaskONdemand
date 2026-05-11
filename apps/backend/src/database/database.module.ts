import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { Review } from '../reviews/entities/review.entity';
import { UserNotificationSettings } from '../users/entities/user-notification-settings.entity';
import { SupportRequest } from '../support/entities/support-request.entity';
import { SupportConversation } from '../support/entities/support-conversation.entity';
import { SupportMessage } from '../support/entities/support-message.entity';
import { AdminAccessToken } from '../admin/entities/admin-access-token.entity';
import { ChatConversation } from '../chat/entities/chat-conversation.entity';
import { ChatMessage } from '../chat/entities/chat-message.entity';
import { ChatBlock } from '../chat/entities/chat-block.entity';

function isTrue(value?: string): boolean {
  return ['1', 'true', 'yes', 'on'].includes((value || '').toLowerCase());
}

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const databaseSsl =
          isTrue(configService.get<string>('DATABASE_SSL')) ||
          (!!databaseUrl && configService.get<string>('DATABASE_SSL') !== 'false');

        return {
          type: 'postgres',
          url: databaseUrl,
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get('DB_PORT', 5432),
          username: configService.get('DB_USERNAME', 'postgres'),
          password: configService.get('DB_PASSWORD', 'postgres'),
          database: configService.get('DB_NAME', 'tod'),
          entities: [
            User,
            Task,
            Review,
            UserNotificationSettings,
            SupportRequest,
            SupportConversation,
            SupportMessage,
            AdminAccessToken,
            ChatConversation,
            ChatMessage,
            ChatBlock,
          ],
          // Use migrations only; synchronize can break schema in non-empty databases.
          synchronize: false,
          logging: configService.get('NODE_ENV') === 'development',
          ssl: databaseSsl ? { rejectUnauthorized: false } : false,
          extra: {
            // Enable PostGIS extension
            options: '-c search_path=public',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
