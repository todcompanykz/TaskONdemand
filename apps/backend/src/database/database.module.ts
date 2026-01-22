import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { Review } from '../reviews/entities/review.entity';
import { UserNotificationSettings } from '../users/entities/user-notification-settings.entity';
import { SupportRequest } from '../support/entities/support-request.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'tod'),
        entities: [User, Task, Review, UserNotificationSettings, SupportRequest],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
        extra: {
          // Enable PostGIS extension
          options: '-c search_path=public',
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
