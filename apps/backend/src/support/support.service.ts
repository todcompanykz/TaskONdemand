import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { ReplySupportRequestDto } from './dto/reply-support-request.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { SupportRequest } from './entities/support-request.entity';
import {
  SupportConversation,
  ConversationStatus,
  ConversationPriority,
} from './entities/support-conversation.entity';
import {
  SupportMessage,
  MessageSenderRole,
} from './entities/support-message.entity';
import { FCMService } from '../notifications/fcm.service';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @InjectRepository(SupportRequest)
    private supportRequestRepository: Repository<SupportRequest>,
    @InjectRepository(SupportConversation)
    private conversationRepository: Repository<SupportConversation>,
    @InjectRepository(SupportMessage)
    private messageRepository: Repository<SupportMessage>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private fcmService: FCMService,
  ) {}

  async createSupportRequest(userId: string, dto: CreateSupportRequestDto) {
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'support.service.ts:createSupportRequest:entry',message:'createSupportRequest called',data:{userId,topic:dto.topic,messageLength:dto.message.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    } catch(e) {}
    this.logger.log(`[DEBUG] createSupportRequest called: userId=${userId}, topic=${dto.topic}`);
    // #endregion
    // Store support request in database
    const supportRequest = this.supportRequestRepository.create({
      userId,
      topic: dto.topic,
      message: dto.message,
    });

    const saved = await this.supportRequestRepository.save(supportRequest);
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'support.service.ts:createSupportRequest:saved',message:'support request saved',data:{id:saved.id,userId:saved.userId,topic:saved.topic,createdAt:saved.createdAt},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    } catch(e) {}
    this.logger.log(`[DEBUG] Support request saved: id=${saved.id}`);
    // #endregion

    this.logger.log({
      event: 'support_request_created',
      id: saved.id,
      userId,
      topic: dto.topic,
    });

    // Notify admins about new support request (legacy method)
    // Note: This is a legacy method, but we still need to notify admins
    await this.notifyAdminsAboutNewSupportRequest(saved.id, userId, dto.topic);

    return {
      success: true,
      message: 'Support request received',
    };
  }

  async getAllSupportRequests() {
    // #region agent log
    const fs = require('fs');
    const logPath = 'c:\\Cursorproject\\Todmvp\\.cursor\\debug.log';
    const logEntry = JSON.stringify({location:'support.service.ts:getAllSupportRequests:entry',message:'getAllSupportRequests called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})+'\n';
    fs.appendFileSync(logPath, logEntry);
    // #endregion
    const requests = await this.supportRequestRepository.find({
      relations: ['user', 'respondedByAdmin'],
      order: { createdAt: 'DESC' },
    });
    // #region agent log
    const logEntry2 = JSON.stringify({location:'support.service.ts:getAllSupportRequests:result',message:'getAllSupportRequests result',data:{count:requests.length,requests:requests.map(r=>({id:r.id,userId:r.userId,topic:r.topic,hasUser:!!r.user}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})+'\n';
    fs.appendFileSync(logPath, logEntry2);
    // #endregion
    return requests;
  }

  async getUserSupportRequests(userId: string) {
    return this.supportRequestRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async replyToSupportRequest(
    requestId: string,
    adminId: string,
    dto: ReplySupportRequestDto,
  ): Promise<SupportRequest> {
    const request = await this.supportRequestRepository.findOne({
      where: { id: requestId },
      relations: ['user'],
    });

    if (!request) {
      throw new NotFoundException('Support request not found');
    }

    if (request.status !== 'open') {
      throw new BadRequestException('Support request has already been answered');
    }

    request.status = 'answered';
    request.responseMessage = dto.message;
    request.answeredAt = new Date();
    request.respondedByAdminId = adminId;

    const saved = await this.supportRequestRepository.save(request);

    this.logger.log({
      event: 'support_request_replied',
      requestId: saved.id,
      adminId,
      userId: saved.userId,
    });

    // Send FCM notification to user
    this.fcmService.sendNotification(saved.userId, {
      title: 'Ответ от поддержки',
      body: `Получен ответ на ваш запрос: "${saved.topic}"`,
      data: {
        id: `support_reply_${saved.id}`,
        type: 'support_reply',
        actionUrl: '/support/my-requests',
      },
    }).catch((error) => {
      this.logger.error(`Failed to send FCM notification to user ${saved.userId}:`, error);
    });

    return this.supportRequestRepository.findOne({
      where: { id: saved.id },
      relations: ['user', 'respondedByAdmin'],
    });
  }

  // ========== NEW CONVERSATION-BASED METHODS ==========

  /**
   * Create a new support conversation with initial message
   */
  async createConversation(
    userId: string,
    dto: CreateConversationDto,
  ): Promise<SupportConversation> {
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'support.service.ts:createConversation:entry',message:'createConversation called',data:{userId,topic:dto.topic,messageLength:dto.message.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    } catch(e) {}
    this.logger.log(`[DEBUG] createConversation called: userId=${userId}, topic=${dto.topic}`);
    // #endregion

    const conversation = this.conversationRepository.create({
      userId,
      topic: dto.topic,
      status: ConversationStatus.OPEN,
      priority: ConversationPriority.NORMAL,
      lastMessageAt: new Date(),
    });

    const savedConversation = await this.conversationRepository.save(conversation);

    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'support.service.ts:createConversation:conversationSaved',message:'conversation saved',data:{conversationId:savedConversation.id,userId:savedConversation.userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    } catch(e) {}
    this.logger.log(`[DEBUG] Conversation saved: id=${savedConversation.id}`);
    // #endregion

    // Create first message from user
    const message = this.messageRepository.create({
      conversationId: savedConversation.id,
      senderId: userId,
      senderRole: MessageSenderRole.USER,
      message: dto.message,
      isRead: false,
    });

    await this.messageRepository.save(message);

    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'support.service.ts:createConversation:messageSaved',message:'message saved',data:{messageId:message.id,conversationId:savedConversation.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    } catch(e) {}
    this.logger.log(`[DEBUG] Message saved: id=${message.id}`);
    // #endregion

    // Notify admins about new conversation
    await this.notifyAdminsAboutNewConversation(savedConversation.id, userId);

    this.logger.log({
      event: 'support_conversation_created',
      conversationId: savedConversation.id,
      userId,
      topic: dto.topic,
    });

    return this.conversationRepository.findOne({
      where: { id: savedConversation.id },
      relations: ['user', 'messages', 'messages.sender'],
      order: { messages: { createdAt: 'ASC' } },
    });
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string): Promise<SupportConversation[]> {
    return this.conversationRepository.find({
      where: { userId },
      relations: ['user', 'messages'],
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Get a specific conversation with messages
   */
  async getConversation(
    conversationId: string,
    userId: string,
    userRole?: UserRole,
  ): Promise<SupportConversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['user', 'messages', 'messages.sender'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check access: user can only access their own conversations, admins can access all
    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.SUPER_ADMIN &&
      conversation.userId !== userId
    ) {
      throw new ForbiddenException('Access denied to this conversation');
    }

    // Sort messages by creation date
    conversation.messages.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    return conversation;
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(
    conversationId: string,
    senderId: string,
    senderRole: MessageSenderRole,
    dto: CreateMessageDto,
  ): Promise<SupportMessage> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['user'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // User cannot write in closed conversations
    if (
      senderRole === MessageSenderRole.USER &&
      conversation.status === ConversationStatus.CLOSED
    ) {
      throw new BadRequestException('Cannot send message to closed conversation');
    }

    // Check access for users
    if (
      senderRole === MessageSenderRole.USER &&
      conversation.userId !== senderId
    ) {
      throw new ForbiddenException('Access denied to this conversation');
    }

    const message = this.messageRepository.create({
      conversationId,
      senderId,
      senderRole,
      message: dto.message,
      isRead: false,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation's lastMessageAt
    conversation.lastMessageAt = new Date();
    await this.conversationRepository.save(conversation);

    // Send notifications
    if (senderRole === MessageSenderRole.ADMIN) {
      // Notify user about admin's message
      await this.notifyUserAboutMessage(conversation.userId, conversationId);
    } else {
      // Notify admins about user's message
      await this.notifyAdminsAboutNewMessage(conversationId, conversation.userId);
    }

    this.logger.log({
      event: 'support_message_created',
      messageId: savedMessage.id,
      conversationId,
      senderId,
      senderRole,
    });

    return this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'conversation'],
    });
  }

  /**
   * Close a conversation (admin only)
   */
  async closeConversation(
    conversationId: string,
    adminId: string,
  ): Promise<SupportConversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['user'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.status === ConversationStatus.CLOSED) {
      throw new BadRequestException('Conversation is already closed');
    }

    conversation.status = ConversationStatus.CLOSED;
    const saved = await this.conversationRepository.save(conversation);

    this.logger.log({
      event: 'support_conversation_closed',
      conversationId,
      adminId,
      userId: conversation.userId,
    });

    return saved;
  }

  /**
   * Get all conversations for admin with filters
   */
  async getAdminConversations(filters?: {
    status?: ConversationStatus;
    priority?: ConversationPriority;
  }): Promise<SupportConversation[]> {
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'support.service.ts:getAdminConversations:entry',message:'getAdminConversations called',data:{filters},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
    } catch(e) {}
    this.logger.log(`[DEBUG] getAdminConversations called with filters: ${JSON.stringify(filters)}`);
    // #endregion

    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    const conversations = await this.conversationRepository.find({
      where,
      relations: ['user', 'messages'],
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
    });

    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'support.service.ts:getAdminConversations:result',message:'getAdminConversations returning',data:{count:conversations.length,conversationIds:conversations.map(c => c.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
    } catch(e) {}
    this.logger.log(`[DEBUG] getAdminConversations returning ${conversations.length} conversations`);
    // #endregion

    return conversations;
  }

  /**
   * Update conversation (status, priority)
   */
  async updateConversation(
    conversationId: string,
    dto: UpdateConversationDto,
  ): Promise<SupportConversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (dto.status !== undefined) {
      conversation.status = dto.status;
    }

    if (dto.priority !== undefined) {
      conversation.priority = dto.priority;
    }

    return this.conversationRepository.save(conversation);
  }

  /**
   * Get unread message count for user or admin
   */
  async getUnreadCount(userId: string, role: UserRole): Promise<number> {
    if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
      // For admins: count unread messages from users
      return this.messageRepository.count({
        where: {
          senderRole: MessageSenderRole.USER,
          isRead: false,
        },
      });
    } else {
      // For users: count unread messages from admins in their conversations
      const userConversations = await this.conversationRepository.find({
        where: { userId },
        select: ['id'],
      });

      if (userConversations.length === 0) {
        return 0;
      }

      return this.messageRepository.count({
        where: {
          conversationId: In(userConversations.map((c) => c.id)),
          senderRole: MessageSenderRole.ADMIN,
          isRead: false,
        },
      });
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(
    conversationId: string,
    userId: string,
    role: UserRole,
  ): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check access
    if (
      role !== UserRole.ADMIN &&
      role !== UserRole.SUPER_ADMIN &&
      conversation.userId !== userId
    ) {
      throw new ForbiddenException('Access denied');
    }

    const senderRoleToMark =
      role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN
        ? MessageSenderRole.USER
        : MessageSenderRole.ADMIN;

    await this.messageRepository.update(
      {
        conversationId,
        senderRole: senderRoleToMark,
        isRead: false,
      },
      { isRead: true },
    );
  }

  // ========== NOTIFICATION HELPERS ==========

  private async notifyUserAboutMessage(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['notificationSettings'],
      }).catch(() => null);

      if (
        user?.notificationSettings &&
        !user.notificationSettings.supportReplies
      ) {
        return; // User disabled support notifications
      }

      await this.fcmService.sendNotification(userId, {
        title: 'Новое сообщение от поддержки',
        body: 'Получен ответ на ваш запрос в поддержке',
        data: {
          id: `support_message_${conversationId}`,
          type: 'support_message',
          actionUrl: `/support?conversation=${conversationId}`,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send notification to user ${userId}:`,
        error,
      );
    }
  }

  private async notifyAdminsAboutNewMessage(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    try {
      const admins = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.notificationSettings', 'notificationSettings')
        .where('user.role IN (:...roles)', { roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] })
        .getMany();

      for (const admin of admins) {
        const settings = (admin as any).notificationSettings;
        if (settings && !settings.supportReplies) {
          continue; // Admin disabled support notifications
        }

        await this.fcmService.sendNotification(admin.id, {
          title: 'Новое сообщение в поддержке',
          body: 'Получено новое сообщение от пользователя',
          data: {
            id: `support_message_${conversationId}`,
            type: 'support_message',
            actionUrl: `/admin?tab=support&conversation=${conversationId}`,
          },
        });
      }
    } catch (error) {
      this.logger.error('Failed to notify admins about new message:', error);
    }
  }

  private async notifyAdminsAboutNewConversation(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'support.service.ts:notifyAdminsAboutNewConversation:entry',message:'notifyAdminsAboutNewConversation called',data:{conversationId,userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    } catch(e) {}
    this.logger.log(`[DEBUG] notifyAdminsAboutNewConversation called: conversationId=${conversationId}, userId=${userId}`);
    // #endregion
    
    try {
      const admins = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.notificationSettings', 'notificationSettings')
        .where('user.role IN (:...roles)', { roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] })
        .getMany();

      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'support.service.ts:notifyAdminsAboutNewConversation:adminsFound',message:'admins found',data:{adminCount:admins.length,admins:admins.map(a=>({id:a.id,email:a.email,role:a.role,hasFcmToken:!!a.fcmToken}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      } catch(e) {}
      this.logger.log(`[DEBUG] Found ${admins.length} admins to notify`);
      // #endregion

      if (admins.length === 0) {
        // #region agent log
        try {
          fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'support.service.ts:notifyAdminsAboutNewConversation:noAdmins',message:'no admins found',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        } catch(e) {}
        // #endregion
        this.logger.warn('No admins found to notify about new conversation');
        return;
      }

      let notifiedCount = 0;
      let skippedCount = 0;

      for (const admin of admins) {
        const settings = (admin as any).notificationSettings;
        
        // #region agent log
        try {
          fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'support.service.ts:notifyAdminsAboutNewConversation:processingAdmin',message:'processing admin',data:{adminId:admin.id,adminEmail:admin.email,hasSettings:!!settings,supportRepliesEnabled:settings?.supportReplies !== false,hasFcmToken:!!admin.fcmToken},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        } catch(e) {}
        this.logger.log(`[DEBUG] Processing admin: ${admin.email}, hasFcmToken: ${!!admin.fcmToken}, supportReplies: ${settings?.supportReplies !== false}`);
        // #endregion
        
        if (settings && !settings.supportReplies) {
          skippedCount++;
          // #region agent log
          try {
            fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'support.service.ts:notifyAdminsAboutNewConversation:skipped',message:'admin skipped - notifications disabled',data:{adminId:admin.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          } catch(e) {}
          // #endregion
          this.logger.log(`[DEBUG] Skipped admin ${admin.email}: notifications disabled`);
          continue;
        }

        if (!admin.fcmToken) {
          skippedCount++;
          // #region agent log
          try {
            fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'support.service.ts:notifyAdminsAboutNewConversation:skipped',message:'admin skipped - no FCM token',data:{adminId:admin.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          } catch(e) {}
          // #endregion
          this.logger.log(`[DEBUG] Skipped admin ${admin.email}: no FCM token`);
          continue;
        }

        const notificationResult = await this.fcmService.sendNotification(admin.id, {
          title: 'Новое обращение в поддержку',
          body: 'Создано новое обращение от пользователя',
          data: {
            id: `support_conversation_${conversationId}`,
            type: 'support_message',
            actionUrl: `/admin?tab=support&conversation=${conversationId}`,
          },
        });

        // #region agent log
        try {
          fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'support.service.ts:notifyAdminsAboutNewConversation:notificationSent',message:'notification sent to admin',data:{adminId:admin.id,success:notificationResult},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        } catch(e) {}
        this.logger.log(`[DEBUG] Notification sent to admin ${admin.email}: ${notificationResult}`);
        // #endregion

        if (notificationResult) {
          notifiedCount++;
        }
      }

      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'support.service.ts:notifyAdminsAboutNewConversation:complete',message:'notification process complete',data:{totalAdmins:admins.length,notifiedCount,skippedCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      } catch(e) {}
      // #endregion

      this.logger.log(`Notified ${notifiedCount} admins about new conversation ${conversationId} (skipped ${skippedCount})`);
    } catch (error) {
      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'support.service.ts:notifyAdminsAboutNewConversation:error',message:'error notifying admins',data:{errorMessage:error?.message,errorStack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      } catch(e) {}
      // #endregion
      this.logger.error(
        'Failed to notify admins about new conversation:',
        error,
      );
    }
  }

  private async notifyAdminsAboutNewSupportRequest(
    requestId: string,
    userId: string,
    topic: string,
  ): Promise<void> {
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'support.service.ts:notifyAdminsAboutNewSupportRequest:entry',message:'notifyAdminsAboutNewSupportRequest called',data:{requestId,userId,topic},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    } catch(e) {}
    this.logger.log(`[DEBUG] notifyAdminsAboutNewSupportRequest called: requestId=${requestId}, userId=${userId}`);
    // #endregion
    
    try {
      const admins = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.notificationSettings', 'notificationSettings')
        .where('user.role IN (:...roles)', { roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] })
        .getMany();

      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'support.service.ts:notifyAdminsAboutNewSupportRequest:adminsFound',message:'admins found',data:{adminCount:admins.length,admins:admins.map(a=>({id:a.id,email:a.email,role:a.role,hasFcmToken:!!a.fcmToken}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      } catch(e) {}
      this.logger.log(`[DEBUG] Found ${admins.length} admins to notify (legacy method)`);
      // #endregion

      if (admins.length === 0) {
        this.logger.warn('No admins found to notify about new support request');
        return;
      }

      let notifiedCount = 0;
      let skippedCount = 0;

      for (const admin of admins) {
        const settings = (admin as any).notificationSettings;
        
        if (settings && !settings.supportReplies) {
          skippedCount++;
          this.logger.log(`[DEBUG] Skipped admin ${admin.email}: notifications disabled`);
          continue;
        }

        if (!admin.fcmToken) {
          skippedCount++;
          this.logger.log(`[DEBUG] Skipped admin ${admin.email}: no FCM token`);
          continue;
        }

        const notificationResult = await this.fcmService.sendNotification(admin.id, {
          title: 'Новое обращение в поддержку',
          body: 'Создано новое обращение от пользователя',
          data: {
            id: `support_request_${requestId}`,
            type: 'support_message',
            actionUrl: `/admin?tab=support&request=${requestId}`,
          },
        });

        // #region agent log
        try {
          fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'support.service.ts:notifyAdminsAboutNewSupportRequest:notificationSent',message:'notification sent to admin',data:{adminId:admin.id,success:notificationResult},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
        } catch(e) {}
        this.logger.log(`[DEBUG] Notification sent to admin ${admin.email}: ${notificationResult}`);
        // #endregion

        if (notificationResult) {
          notifiedCount++;
        }
      }

      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'support.service.ts:notifyAdminsAboutNewSupportRequest:complete',message:'notification process complete',data:{totalAdmins:admins.length,notifiedCount,skippedCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      } catch(e) {}
      // #endregion

      this.logger.log(`Notified ${notifiedCount} admins about new support request ${requestId} (skipped ${skippedCount})`);
    } catch (error) {
      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'support.service.ts:notifyAdminsAboutNewSupportRequest:error',message:'error notifying admins',data:{errorMessage:error?.message,errorStack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      } catch(e) {}
      // #endregion
      this.logger.error(
        'Failed to notify admins about new support request:',
        error,
      );
    }
  }
}
