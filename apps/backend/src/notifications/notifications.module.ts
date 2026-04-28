import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FCMService } from './fcm.service';
import { TelegramNotificationsService } from './telegram-notifications.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [FCMService, TelegramNotificationsService],
  exports: [FCMService, TelegramNotificationsService],
})
export class NotificationsModule {}
