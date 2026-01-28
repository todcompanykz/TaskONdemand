import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { SupportRequest } from './entities/support-request.entity';
import { SupportConversation } from './entities/support-conversation.entity';
import { SupportMessage } from './entities/support-message.entity';
import { ConversationAccessGuard } from './guards/conversation-access.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupportRequest,
      SupportConversation,
      SupportMessage,
    ]),
    NotificationsModule,
    UsersModule,
  ],
  controllers: [SupportController],
  providers: [SupportService, ConversationAccessGuard],
  exports: [SupportService, TypeOrmModule, ConversationAccessGuard],
})
export class SupportModule {}
