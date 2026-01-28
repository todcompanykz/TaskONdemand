import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportConversation, ConversationStatus } from '../entities/support-conversation.entity';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class ConversationAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(SupportConversation)
    private conversationRepository: Repository<SupportConversation>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const conversationId = request.params.id || request.body.conversationId;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!conversationId) {
      return true; // No conversation ID, let controller handle validation
    }

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Admins can access all conversations
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Users can only access their own conversations
    if (conversation.userId !== user.id) {
      throw new ForbiddenException('Access denied to this conversation');
    }

    // Check if user is trying to send a message to a closed conversation
    const method = request.method;
    if (
      method === 'POST' &&
      conversation.status === ConversationStatus.CLOSED &&
      user.role === UserRole.USER
    ) {
      throw new ForbiddenException('Cannot send message to closed conversation');
    }

    return true;
  }
}
