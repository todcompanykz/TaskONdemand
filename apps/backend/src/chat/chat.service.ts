import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserNotificationSettings } from '../users/entities/user-notification-settings.entity';
import {
  ChatConversation,
  ChatConversationStatus,
} from './entities/chat-conversation.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatBlock } from './entities/chat-block.entity';
import { FCMService } from '../notifications/fcm.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserNotificationSettings)
    private settingsRepository: Repository<UserNotificationSettings>,
    @InjectRepository(ChatConversation)
    private conversationsRepository: Repository<ChatConversation>,
    @InjectRepository(ChatMessage)
    private messagesRepository: Repository<ChatMessage>,
    @InjectRepository(ChatBlock)
    private blocksRepository: Repository<ChatBlock>,
    private fcmService: FCMService,
  ) {}

  async searchUserByIdentifier(currentUserId: string, query: string) {
    const normalized = query.trim();
    if (!normalized) {
      throw new BadRequestException('Search query is required');
    }

    const isEmail = normalized.includes('@');
    const email = normalized.toLowerCase();
    const phone = normalized.replace(/\s+/g, '');
    const phonePattern = /^\+[1-9]\d{7,14}$/;

    if (!isEmail && !phonePattern.test(phone)) {
      throw new BadRequestException(
        'Phone must be in international format, e.g. +77001234567',
      );
    }

    const qb = this.usersRepository.createQueryBuilder('user');
    if (isEmail) {
      qb.where('LOWER(user.email) = :email', { email });
    } else {
      qb.where('user.phoneNumber = :phone', { phone });
    }
    qb.andWhere('user.id != :currentUserId', { currentUserId });

    const user = await qb.getOne();
    if (!user) {
      return null;
    }

    return this.mapUser(user);
  }

  async createRequest(
    requesterId: string,
    targetUserId: string,
    message: string,
  ): Promise<ChatConversation> {
    if (requesterId === targetUserId) {
      throw new BadRequestException('Cannot start a chat with yourself');
    }

    const targetUser = await this.usersRepository.findOne({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    await this.ensureNotBlocked(requesterId, targetUserId);

    const [userAId, userBId] = this.normalizePair(requesterId, targetUserId);
    let conversation = await this.conversationsRepository.findOne({
      where: { userAId, userBId },
    });

    if (!conversation) {
      conversation = this.conversationsRepository.create({
        userAId,
        userBId,
        requestedById: requesterId,
        status: ChatConversationStatus.PENDING,
      });
    }

    if (
      conversation.status === ChatConversationStatus.DECLINED &&
      conversation.declinedById !== requesterId
    ) {
      throw new ForbiddenException(
        'User declined your request. You cannot write until they initiate chat.',
      );
    }

    const shouldRequireConfirmation =
      await this.requiresConfirmation(targetUserId);
    if (
      conversation.status === ChatConversationStatus.DECLINED &&
      conversation.declinedById === requesterId
    ) {
      conversation.status = shouldRequireConfirmation
        ? ChatConversationStatus.PENDING
        : ChatConversationStatus.ACTIVE;
    } else if (conversation.status !== ChatConversationStatus.ACTIVE) {
      conversation.status = shouldRequireConfirmation
        ? ChatConversationStatus.PENDING
        : ChatConversationStatus.ACTIVE;
    }

    conversation.requestedById = requesterId;
    conversation.declinedById = null;
    this.updateConversationPreview(conversation, message);
    const saved = await this.conversationsRepository.save(conversation);

    await this.messagesRepository.save(
      this.messagesRepository.create({
        conversationId: saved.id,
        senderId: requesterId,
        message,
      }),
    );

    const requester = await this.usersRepository.findOne({
      where: { id: requesterId },
    });
    this.sendChatNotification(
      targetUserId,
      'Новый запрос на переписку',
      `${this.getShortUserLabel(requester)} хочет начать с вами чат`,
      'chat_request',
      saved.id,
    );

    return this.getConversation(saved.id, requesterId);
  }

  async getMyConversations(userId: string): Promise<any[]> {
    const conversations = await this.conversationsRepository
      .createQueryBuilder('conversation')
      .where(
        'conversation.userAId = :userId OR conversation.userBId = :userId',
        {
          userId,
        },
      )
      .orderBy('conversation.lastMessageAt', 'DESC', 'NULLS LAST')
      .addOrderBy('conversation.createdAt', 'DESC')
      .getMany();

    const conversationIds = conversations.map(
      (conversation) => conversation.id,
    );
    const otherUserIds = conversations.map((conversation) =>
      this.getOtherParticipantId(conversation, userId),
    );

    const [otherUsers, unreadCountMap] = await Promise.all([
      this.usersRepository.find({
        where: { id: In(otherUserIds) },
      }),
      this.getUnreadCountMap(conversationIds, userId),
    ]);

    const userMap = new Map(otherUsers.map((user) => [user.id, user]));

    return conversations.map((conversation) =>
      this.buildConversationResponse(
        conversation,
        userId,
        userMap.get(this.getOtherParticipantId(conversation, userId)) ?? null,
        unreadCountMap.get(conversation.id) ?? 0,
      ),
    );
  }

  async getConversation(
    conversationId: string,
    userId: string,
    markAsRead = false,
  ): Promise<any> {
    const conversation = await this.getConversationOrThrow(conversationId);
    this.ensureParticipant(conversation, userId);

    if (markAsRead && conversation.status === ChatConversationStatus.ACTIVE) {
      await this.messagesRepository
        .createQueryBuilder()
        .update(ChatMessage)
        .set({ recipientReadAt: new Date() })
        .where('conversationId = :conversationId', { conversationId })
        .andWhere('senderId != :userId', { userId })
        .andWhere('recipientReadAt IS NULL')
        .execute();
    }

    const [otherUser, unreadCount, messages] = await Promise.all([
      this.usersRepository.findOne({
        where: { id: this.getOtherParticipantId(conversation, userId) },
      }),
      this.getUnreadCount(conversation.id, userId),
      this.messagesRepository.find({
        where: { conversationId: conversation.id },
        order: { createdAt: 'ASC' },
      }),
    ]);

    return this.buildConversationResponse(
      conversation,
      userId,
      otherUser,
      unreadCount,
      messages,
    );
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    text: string,
  ): Promise<any> {
    const conversation = await this.getConversationOrThrow(conversationId);
    this.ensureParticipant(conversation, senderId);

    const otherUserId = this.getOtherParticipantId(conversation, senderId);
    await this.ensureNotBlocked(senderId, otherUserId);

    if (
      conversation.status === ChatConversationStatus.PENDING &&
      conversation.requestedById !== senderId
    ) {
      throw new ForbiddenException(
        'You need to accept, decline or block before replying',
      );
    }

    if (
      conversation.status === ChatConversationStatus.DECLINED &&
      conversation.declinedById !== senderId
    ) {
      throw new ForbiddenException(
        'Chat request was declined. Wait until the other user initiates',
      );
    }

    if (
      conversation.status === ChatConversationStatus.DECLINED &&
      conversation.declinedById === senderId
    ) {
      const requiresConfirmation = await this.requiresConfirmation(otherUserId);
      conversation.status = requiresConfirmation
        ? ChatConversationStatus.PENDING
        : ChatConversationStatus.ACTIVE;
      conversation.requestedById = senderId;
      conversation.declinedById = null;
    }

    this.updateConversationPreview(conversation, text);
    await this.conversationsRepository.save(conversation);

    await this.messagesRepository.save(
      this.messagesRepository.create({
        conversationId,
        senderId,
        message: text,
      }),
    );

    const isRequest = conversation.status === ChatConversationStatus.PENDING;
    this.sendChatNotification(
      otherUserId,
      isRequest ? 'Новый запрос на переписку' : 'Новое сообщение',
      isRequest
        ? 'Пользователь хочет начать с вами чат'
        : 'У вас новое сообщение',
      isRequest ? 'chat_request' : 'chat_message',
      conversationId,
    );

    return this.getConversation(conversationId, senderId);
  }

  async acceptRequest(conversationId: string, userId: string): Promise<any> {
    const conversation = await this.getConversationOrThrow(conversationId);
    this.ensureParticipant(conversation, userId);
    if (conversation.status !== ChatConversationStatus.PENDING) {
      throw new BadRequestException('Conversation is not pending');
    }
    if (conversation.requestedById === userId) {
      throw new BadRequestException('Requester cannot accept own request');
    }

    conversation.status = ChatConversationStatus.ACTIVE;
    conversation.declinedById = null;
    await this.conversationsRepository.save(conversation);
    return this.getConversation(conversationId, userId);
  }

  async declineRequest(conversationId: string, userId: string): Promise<any> {
    const conversation = await this.getConversationOrThrow(conversationId);
    this.ensureParticipant(conversation, userId);
    if (conversation.status !== ChatConversationStatus.PENDING) {
      throw new BadRequestException('Conversation is not pending');
    }
    if (conversation.requestedById === userId) {
      throw new BadRequestException('Requester cannot decline own request');
    }

    conversation.status = ChatConversationStatus.DECLINED;
    conversation.declinedById = userId;
    await this.conversationsRepository.save(conversation);
    return this.getConversation(conversationId, userId);
  }

  async blockUser(
    conversationId: string,
    userId: string,
  ): Promise<{ success: true }> {
    const conversation = await this.getConversationOrThrow(conversationId);
    this.ensureParticipant(conversation, userId);
    const otherUserId = this.getOtherParticipantId(conversation, userId);

    const exists = await this.blocksRepository.findOne({
      where: { blockerId: userId, blockedId: otherUserId },
    });
    if (!exists) {
      await this.blocksRepository.save(
        this.blocksRepository.create({
          blockerId: userId,
          blockedId: otherUserId,
        }),
      );
    }

    conversation.status = ChatConversationStatus.DECLINED;
    conversation.declinedById = userId;
    await this.conversationsRepository.save(conversation);
    return { success: true };
  }

  private buildConversationResponse(
    conversation: ChatConversation,
    currentUserId: string,
    otherUser: User | null,
    unreadCount: number,
    messages?: ChatMessage[],
  ) {
    return {
      ...conversation,
      otherUser: otherUser ? this.mapUser(otherUser) : null,
      isIncomingRequest:
        conversation.status === ChatConversationStatus.PENDING &&
        conversation.requestedById !== currentUserId,
      unreadCount,
      messages,
    };
  }

  private async getUnreadCountMap(
    conversationIds: string[],
    currentUserId: string,
  ): Promise<Map<string, number>> {
    if (conversationIds.length === 0) {
      return new Map();
    }

    const rows = await this.messagesRepository
      .createQueryBuilder('message')
      .select('message.conversationId', 'conversationId')
      .addSelect('COUNT(*)', 'count')
      .where('message.conversationId IN (:...conversationIds)', {
        conversationIds,
      })
      .andWhere('message.senderId != :currentUserId', { currentUserId })
      .andWhere('message.recipientReadAt IS NULL')
      .groupBy('message.conversationId')
      .getRawMany<{ conversationId: string; count: string }>();

    return new Map(
      rows.map((row) => [row.conversationId, Number.parseInt(row.count, 10)]),
    );
  }

  private async getUnreadCount(
    conversationId: string,
    currentUserId: string,
  ): Promise<number> {
    const map = await this.getUnreadCountMap([conversationId], currentUserId);
    return map.get(conversationId) ?? 0;
  }

  private mapUser(user: User) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
    };
  }

  private getShortUserLabel(user: User | null): string {
    if (!user) return 'Пользователь';
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return fullName || user.email || 'Пользователь';
  }

  private updateConversationPreview(
    conversation: ChatConversation,
    text: string,
  ): void {
    conversation.lastMessageAt = new Date();
    conversation.lastMessagePreview = text.slice(0, 500);
  }

  private sendChatNotification(
    userId: string,
    title: string,
    body: string,
    type: 'chat_request' | 'chat_message',
    conversationId: string,
  ): void {
    this.fcmService
      .sendNotification(userId, {
        title,
        body,
        data: {
          id: `${type}_${conversationId}`,
          type,
          actionUrl: `/messages?conversation=${conversationId}`,
        },
      })
      .catch(() => {});
  }

  private ensureParticipant(conversation: ChatConversation, userId: string) {
    if (conversation.userAId !== userId && conversation.userBId !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }

  private getOtherParticipantId(
    conversation: ChatConversation,
    userId: string,
  ): string {
    return conversation.userAId === userId
      ? conversation.userBId
      : conversation.userAId;
  }

  private normalizePair(
    firstUserId: string,
    secondUserId: string,
  ): [string, string] {
    return firstUserId < secondUserId
      ? [firstUserId, secondUserId]
      : [secondUserId, firstUserId];
  }

  private async getConversationOrThrow(id: string): Promise<ChatConversation> {
    const conversation = await this.conversationsRepository.findOne({
      where: { id },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  private async requiresConfirmation(userId: string): Promise<boolean> {
    const settings = await this.settingsRepository.findOne({
      where: { userId },
    });
    return settings?.requireChatRequestApproval ?? true;
  }

  private async ensureNotBlocked(
    senderId: string,
    recipientId: string,
  ): Promise<void> {
    const block = await this.blocksRepository
      .createQueryBuilder('block')
      .where(
        new Brackets((qb) => {
          qb.where(
            'block.blockerId = :senderId AND block.blockedId = :recipientId',
            {
              senderId,
              recipientId,
            },
          ).orWhere(
            'block.blockerId = :recipientId AND block.blockedId = :senderId',
            {
              senderId,
              recipientId,
            },
          );
        }),
      )
      .getOne();

    if (block) {
      throw new ForbiddenException('Communication is blocked');
    }
  }
}
