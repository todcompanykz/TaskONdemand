import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { SearchChatUserDto } from './dto/search-chat-user.dto';
import { CreateChatRequestDto } from './dto/create-chat-request.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('search')
  async search(@Request() req, @Query() queryDto: SearchChatUserDto) {
    return this.chatService.searchUserByIdentifier(req.user.id, queryDto.query);
  }

  @Post('requests')
  async createRequest(@Request() req, @Body() dto: CreateChatRequestDto) {
    return this.chatService.createRequest(req.user.id, dto.userId, dto.message);
  }

  @Get('conversations')
  async getConversations(@Request() req) {
    return this.chatService.getMyConversations(req.user.id);
  }

  @Get('conversations/:id')
  async getConversation(
    @Request() req,
    @Param('id') conversationId: string,
    @Query('markAsRead') markAsRead?: string,
  ) {
    return this.chatService.getConversation(
      conversationId,
      req.user.id,
      markAsRead === 'true',
    );
  }

  @Post('messages')
  async sendMessage(@Request() req, @Body() dto: SendChatMessageDto) {
    return this.chatService.sendMessage(
      dto.conversationId,
      req.user.id,
      dto.message,
    );
  }

  @Post('conversations/:id/accept')
  async accept(@Request() req, @Param('id') conversationId: string) {
    return this.chatService.acceptRequest(conversationId, req.user.id);
  }

  @Post('conversations/:id/decline')
  async decline(@Request() req, @Param('id') conversationId: string) {
    return this.chatService.declineRequest(conversationId, req.user.id);
  }

  @Post('conversations/:id/block')
  async block(@Request() req, @Param('id') conversationId: string) {
    return this.chatService.blockUser(conversationId, req.user.id);
  }
}
