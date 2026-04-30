import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Param,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import { SupportService } from './support.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { ConversationAccessGuard } from './guards/conversation-access.guard';
import { MessageSenderRole } from './entities/support-message.entity';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  private readonly logger = new Logger(SupportController.name);

  constructor(private readonly supportService: SupportService) {
    // Log all incoming requests to support endpoints
    this.logger.log('SupportController initialized');
  }

  // ========== NEW CONVERSATION-BASED ENDPOINTS ==========
  // IMPORTANT: More specific routes must be declared BEFORE generic routes
  // Otherwise, POST /support/conversations will be caught by POST /support

  @Post('conversations')
  async createConversation(
    @Request() req,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    // #region agent log
    try {
      fetch(
        'http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'support.controller.ts:createConversation:entry',
            message: 'createConversation endpoint called',
            data: {
              userId: req.user.id,
              topic: createConversationDto.topic,
              messageLength: createConversationDto.message.length,
              path: req.url,
              method: req.method,
              originalUrl: req.originalUrl,
              baseUrl: req.baseUrl,
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'K',
          }),
        },
      ).catch(() => {});
    } catch (e) {}
    this.logger.log(
      `[DEBUG] NEW createConversation called: userId=${req.user.id}, topic=${createConversationDto.topic}, path=${req.url}, originalUrl=${req.originalUrl}, method=${req.method}`,
    );
    // #endregion
    return this.supportService.createConversation(
      req.user.id,
      createConversationDto,
    );
  }

  @Get('conversations')
  async getMyConversations(@Request() req) {
    return this.supportService.getUserConversations(req.user.id);
  }

  @Get('conversations/:id')
  @UseGuards(ConversationAccessGuard)
  async getConversation(@Param('id') id: string, @Request() req) {
    return this.supportService.getConversation(id, req.user.id, req.user.role);
  }

  @Post('messages')
  @UseGuards(ConversationAccessGuard)
  async sendMessage(
    @Request() req,
    @Body() createMessageDto: CreateMessageDto & { conversationId: string },
  ) {
    return this.supportService.addMessage(
      createMessageDto.conversationId,
      req.user.id,
      MessageSenderRole.USER,
      createMessageDto,
    );
  }

  // ========== LEGACY ENDPOINTS ==========
  // NOTE: These endpoints are deprecated. Use POST /support/conversations instead.
  // Keeping them for backward compatibility with cached frontend code.

  // Temporary endpoint for backward compatibility with cached frontend
  // This will redirect to the new conversation-based endpoint
  @Post()
  async createSupportRequestLegacy(
    @Request() req,
    @Body() createSupportRequestDto: CreateSupportRequestDto,
  ) {
    // #region agent log
    try {
      fetch(
        'http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'support.controller.ts:createSupportRequestLegacy:entry',
            message:
              'createSupportRequestLegacy endpoint called (LEGACY REDIRECT)',
            data: {
              userId: req.user.id,
              topic: createSupportRequestDto.topic,
              messageLength: createSupportRequestDto.message.length,
              path: req.url,
              originalUrl: req.originalUrl,
              method: req.method,
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'M',
          }),
        },
      ).catch(() => {});
    } catch (e) {}
    this.logger.log(
      `[DEBUG] LEGACY createSupportRequestLegacy called: userId=${req.user.id}, topic=${createSupportRequestDto.topic}, path=${req.url}, originalUrl=${req.originalUrl}, method=${req.method}`,
    );
    // #endregion
    // Convert legacy request to new conversation format
    return this.supportService.createConversation(req.user.id, {
      topic: createSupportRequestDto.topic,
      message: createSupportRequestDto.message,
    });
  }

  @Post('requests')
  async createSupportRequest(
    @Request() req,
    @Body() createSupportRequestDto: CreateSupportRequestDto,
  ) {
    // #region agent log
    try {
      fetch(
        'http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'support.controller.ts:createSupportRequest:entry',
            message: 'createSupportRequest endpoint called (LEGACY)',
            data: {
              userId: req.user.id,
              topic: createSupportRequestDto.topic,
              messageLength: createSupportRequestDto.message.length,
              path: req.url,
              originalUrl: req.originalUrl,
              method: req.method,
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'L',
          }),
        },
      ).catch(() => {});
    } catch (e) {}
    this.logger.log(
      `[DEBUG] LEGACY createSupportRequest called: userId=${req.user.id}, topic=${createSupportRequestDto.topic}, path=${req.url}, originalUrl=${req.originalUrl}, method=${req.method}`,
    );
    // #endregion
    return this.supportService.createSupportRequest(
      req.user.id,
      createSupportRequestDto,
    );
  }

  @Get()
  @UseGuards(AdminGuard)
  async getAllSupportRequests(@Request() req) {
    // #region agent log
    const logPath = 'c:\\Cursorproject\\Todmvp\\.cursor\\debug.log';
    const logEntry =
      JSON.stringify({
        location: 'support.controller.ts:getAllSupportRequests:entry',
        message: 'getAllSupportRequests endpoint called',
        data: { userId: req.user?.id, isAdmin: req.user?.isAdmin },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'H',
      }) + '\n';
    fs.appendFileSync(logPath, logEntry);
    // #endregion
    const result = await this.supportService.getAllSupportRequests();
    // #region agent log
    const logEntry2 =
      JSON.stringify({
        location: 'support.controller.ts:getAllSupportRequests:result',
        message: 'getAllSupportRequests returning',
        data: { count: result.length },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'H',
      }) + '\n';
    fs.appendFileSync(logPath, logEntry2);
    // #endregion
    return result;
  }

  @Get('my-requests')
  async getMySupportRequests(@Request() req) {
    return this.supportService.getUserSupportRequests(req.user.id);
  }
}
