import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { SupportRequest } from './entities/support-request.entity';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @InjectRepository(SupportRequest)
    private supportRequestRepository: Repository<SupportRequest>,
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
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
    // #region agent log
    const logEntry2 = JSON.stringify({location:'support.service.ts:getAllSupportRequests:result',message:'getAllSupportRequests result',data:{count:requests.length,requests:requests.map(r=>({id:r.id,userId:r.userId,topic:r.topic,hasUser:!!r.user}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})+'\n';
    fs.appendFileSync(logPath, logEntry2);
    // #endregion
    return requests;
  }
}
