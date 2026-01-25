import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { ReplySupportRequestDto } from './dto/reply-support-request.dto';
import { SupportRequest } from './entities/support-request.entity';
import { FCMService } from '../notifications/fcm.service';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @InjectRepository(SupportRequest)
    private supportRequestRepository: Repository<SupportRequest>,
    private fcmService: FCMService,
  ) {}

  async createSupportRequest(userId: string, dto: CreateSupportRequestDto) {
    // #region agent log
    const fs = require('fs');
    const logPath = 'c:\\Cursorproject\\Todmvp\\.cursor\\debug.log';
    const logEntry = JSON.stringify({location:'support.service.ts:createSupportRequest:entry',message:'createSupportRequest called',data:{userId,topic:dto.topic,messageLength:dto.message.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})+'\n';
    fs.appendFileSync(logPath, logEntry);
    // #endregion
    // Store support request in database
    const supportRequest = this.supportRequestRepository.create({
      userId,
      topic: dto.topic,
      message: dto.message,
    });

    const saved = await this.supportRequestRepository.save(supportRequest);
    // #region agent log
    const logEntry2 = JSON.stringify({location:'support.service.ts:createSupportRequest:saved',message:'support request saved',data:{id:saved.id,userId:saved.userId,topic:saved.topic,createdAt:saved.createdAt},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})+'\n';
    fs.appendFileSync(logPath, logEntry2);
    // #endregion

    this.logger.log({
      event: 'support_request_created',
      id: saved.id,
      userId,
      topic: dto.topic,
    });

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
}
