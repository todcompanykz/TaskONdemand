import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  Logger,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { SupportService } from '../support/support.service';
import { ReplySupportRequestDto } from '../support/dto/reply-support-request.dto';
import { CreateMessageDto } from '../support/dto/create-message.dto';
import { UpdateConversationDto } from '../support/dto/update-conversation.dto';
import { ConversationAccessGuard } from '../support/guards/conversation-access.guard';
import { MessageSenderRole } from '../support/entities/support-message.entity';
import { CreateAdminTokenDto } from './dto/create-admin-token.dto';
import { ActivateAdminTokenDto } from './dto/activate-admin-token.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { Permissions } from './decorators/permissions.decorator';
import { Permission } from '../common/enums/permissions.enum';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly supportService: SupportService,
  ) {}

  @Get('users')
  @UseGuards(PermissionsGuard)
  @Permissions(Permission.USERS_READ)
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Get('tasks')
  @UseGuards(PermissionsGuard)
  @Permissions(Permission.TASKS_READ)
  async getTasks() {
    return this.adminService.getTasks();
  }

  @Get('stats')
  @UseGuards(PermissionsGuard)
  @Permissions(Permission.ANALYTICS_READ)
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('analytics')
  @UseGuards(PermissionsGuard)
  @Permissions(Permission.ANALYTICS_READ)
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Delete('tasks/:id')
  @UseGuards(PermissionsGuard)
  @Permissions(Permission.TASKS_DELETE)
  async deleteTask(@Param('id') id: string) {
    return this.adminService.deleteTask(id);
  }

  @Post('users/:id/restrict')
  @UseGuards(PermissionsGuard)
  @Permissions(Permission.USERS_BLOCK)
  async restrictUser(@Param('id') id: string, @Request() req) {
    return this.adminService.restrictUser(id, req.user.id);
  }

  @Post('users/:id/unrestrict')
  @UseGuards(PermissionsGuard)
  @Permissions(Permission.USERS_UNBLOCK)
  async unrestrictUser(@Param('id') id: string, @Request() req) {
    return this.adminService.unrestrictUser(id, req.user.id);
  }

  @Post('support/:id/reply')
  @UseGuards(PermissionsGuard)
  @Permissions(Permission.SUPPORT_REPLY)
  async replyToSupportRequest(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: ReplySupportRequestDto,
  ) {
    return this.supportService.replyToSupportRequest(id, req.user.id, dto);
  }

  // ========== NEW CONVERSATION-BASED ENDPOINTS ==========

  @Get('support/conversations')
  @UseGuards(PermissionsGuard)
  @Permissions(Permission.SUPPORT_READ)
  async getSupportConversations(
    @Request() req,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin.controller.ts:getSupportConversations:entry',message:'getSupportConversations endpoint called',data:{userId:req.user.id,status,priority},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
    } catch(e) {}
    const logger = new Logger(AdminController.name);
    logger.log(`[DEBUG] getSupportConversations called: userId=${req.user.id}, status=${status}, priority=${priority}`);
    // #endregion
    const result = await this.supportService.getAdminConversations({
      status: status as any,
      priority: priority as any,
    });
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin.controller.ts:getSupportConversations:result',message:'getSupportConversations returning',data:{count:result.length,conversationIds:result.map(c => c.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
    } catch(e) {}
    logger.log(`[DEBUG] getSupportConversations returning ${result.length} conversations`);
    // #endregion
    return result;
  }

  @Get('support/conversations/:id')
  @UseGuards(PermissionsGuard)
  @Permissions(Permission.SUPPORT_READ)
  async getSupportConversation(@Param('id') id: string, @Request() req) {
    return this.supportService.getConversation(id, req.user.id, req.user.role);
  }

  @Post('support/messages')
  @UseGuards(PermissionsGuard, ConversationAccessGuard)
  @Permissions(Permission.SUPPORT_REPLY)
  async sendSupportMessage(
    @Request() req,
    @Body() createMessageDto: CreateMessageDto & { conversationId: string },
  ) {
    return this.supportService.addMessage(
      createMessageDto.conversationId,
      req.user.id,
      MessageSenderRole.ADMIN,
      createMessageDto,
    );
  }

  @Post('support/conversations/:id/close')
  @UseGuards(PermissionsGuard)
  @Permissions(Permission.SUPPORT_CLOSE)
  async closeSupportConversation(@Param('id') id: string, @Request() req) {
    return this.supportService.closeConversation(id, req.user.id);
  }

  @Post('support/conversations/:id/update')
  @UseGuards(PermissionsGuard)
  @Permissions(Permission.SUPPORT_READ)
  async updateSupportConversation(
    @Param('id') id: string,
    @Body() updateDto: UpdateConversationDto,
  ) {
    return this.supportService.updateConversation(id, updateDto);
  }

  // Token management endpoints (SUPER_ADMIN only)
  @Post('tokens')
  @UseGuards(SuperAdminGuard)
  async createAdminToken(
    @Body() createDto: CreateAdminTokenDto,
    @Request() req,
  ) {
    return this.adminService.createAdminToken(createDto, req.user.id);
  }

  @Get('tokens')
  @UseGuards(SuperAdminGuard)
  async getAdminTokens() {
    return this.adminService.getAdminTokens();
  }

  @Post('tokens/:id/revoke')
  @UseGuards(SuperAdminGuard)
  async revokeAdminToken(@Param('id') id: string, @Request() req) {
    await this.adminService.revokeAdminToken(id, req.user.id);
    return { message: 'Admin token revoked successfully' };
  }

  @Get('admins')
  @UseGuards(SuperAdminGuard)
  async getAdmins() {
    return this.adminService.getAdmins();
  }
}

// Separate controller for token activation (accessible to all authenticated users)
@Controller('admin/tokens')
export class AdminTokenController {
  constructor(private readonly adminService: AdminService) {}

  @Post('activate')
  @UseGuards(JwtAuthGuard)
  async activateAdminToken(
    @Body() activateDto: ActivateAdminTokenDto,
    @Request() req,
  ) {
    const result = await this.adminService.activateAdminToken(
      activateDto.token,
      req.user.id,
    );
    return {
      message: 'Admin token activated successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        permissions: result.user.permissions,
      },
    };
  }
}
